import CredentialsProviderModule from 'next-auth/providers/credentials';
import GoogleProviderModule from 'next-auth/providers/google';
import AppleProviderModule from 'next-auth/providers/apple';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { sendLoginConfirmationEmail, sendSubscriptionConfirmationEmail } from '@/lib/mail';
import { findOrCreateUserByEmail, normalizeEmail, verifyLoginCode } from '@/lib/emailLoginCodes';

// next-auth v4 ships dual CJS/ESM builds; this project's bundler needs the
// interop unwrap (same pattern as the NextAuth handler itself).
const unwrap = (m) => m.default?.default || m.default || m;
const CredentialsProvider = unwrap(CredentialsProviderModule);
const GoogleProvider = unwrap(GoogleProviderModule);
const AppleProvider = unwrap(AppleProviderModule);

// purchasing_roles is read through to_jsonb so sign-in still works on a database
// where the purchasing tables (lib/erp/schema.js) haven't been created yet
const USER_COLUMNS = `id, username, email, first_name, last_name, profile_image, password_hash,
  is_admin, created_at, COALESCE(email_verified, true) AS email_verified,
  COALESCE(is_suspended, false) AS is_suspended,
  (to_jsonb(users) -> 'purchasing_roles') AS purchasing_roles`;

/**
 * 'admin'  full admin portal
 * 'staff'  an admin limited to some purchasing roles (lib/erp/roles.js): only the
 *          purchasing pages and APIs for those roles. Every role === 'admin' check
 *          elsewhere refuses them, so the rest of the admin stays closed.
 * 'user'   a customer
 */
export function sessionRole(user) {
  if (!user?.is_admin) return 'user';
  return Array.isArray(user.purchasing_roles) ? 'staff' : 'admin';
}

// Admin roles are re-read this often, so granting, limiting or removing access
// applies without the person signing out
const ROLE_RECHECK_MS = 60 * 1000;

async function currentRole(userId) {
  const { rows: [row] } = await db.query(
    `SELECT is_admin, (to_jsonb(users) -> 'purchasing_roles') AS purchasing_roles,
            COALESCE(is_suspended, false) AS is_suspended
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!row || row.is_suspended) return 'user';
  return sessionRole(row);
}

function toSessionUser(user) {
  return {
    id: user.id,
    name: user.first_name,
    email: user.email,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    profile_image: user.profile_image,
    role: sessionRole(user),
    emailVerified: user.email_verified !== false,
    createdAt: user.created_at,
  };
}

// Social providers are only registered when configured, so a missing key can
// never break the credentials login that the whole store depends on.
const socialProviders = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { prompt: 'select_account' } },
    })
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Apple returns its callback as a cross-site POST (response_mode=form_post,
// set by the provider itself). Browsers do not send SameSite=Lax cookies on a
// cross-site POST, so the PKCE verifier NextAuth wrote before the redirect
// never arrives and the callback fails — with the Apple console configured
// perfectly. next-auth 4.x defaults every cookie to Lax and does not
// special-case form_post, so the OAuth round-trip cookies are relaxed here.
//
// Deliberately narrow: only the short-lived cookies involved in the redirect.
// The session cookie and the CSRF token keep their defaults, so the actual
// session is never loosened. SameSite=None requires Secure, which requires
// HTTPS, so this only engages when Apple is configured AND the site is https.
const appleConfigured = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET);
const secureCookies = (process.env.NEXTAUTH_URL || '').startsWith('https://');
const cookiePrefix = secureCookies ? '__Secure-' : '';

const crossSiteOAuthCookies =
  appleConfigured && secureCookies
    ? {
        pkceCodeVerifier: {
          name: `${cookiePrefix}next-auth.pkce.code_verifier`,
          options: { httpOnly: true, sameSite: 'none', path: '/', secure: true, maxAge: 900 },
        },
        state: {
          name: `${cookiePrefix}next-auth.state`,
          options: { httpOnly: true, sameSite: 'none', path: '/', secure: true, maxAge: 900 },
        },
        nonce: {
          name: `${cookiePrefix}next-auth.nonce`,
          options: { httpOnly: true, sameSite: 'none', path: '/', secure: true },
        },
        callbackUrl: {
          name: `${cookiePrefix}next-auth.callback-url`,
          options: { httpOnly: true, sameSite: 'none', path: '/', secure: true },
        },
      }
    : undefined;

export const authOptions = {
  providers: [
    ...socialProviders,

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const client = await db.connect();
        try {
          // Latest row by id, case-insensitive, in case of historic duplicates.
          const result = await client.query(
            `SELECT ${USER_COLUMNS} FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1`,
            [credentials.email]
          );
          const user = result.rows[0];
          if (!user || !user.password_hash) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) return null;

          if (user.is_suspended === true) throw new Error('ACCOUNT_SUSPENDED');

          // Soft verification: an unverified email no longer blocks sign-in.
          // The flag rides along in the session and the UI nudges with a banner.
          return toSessionUser(user);
        } finally {
          client.release();
        }
      },
    }),

    // Shopify-style sign-in: the 6-digit code from /api/auth/email-code. A correct
    // code signs the customer in, creating their account the first time.
    // Failures come back as result.error: CODE_WRONG / CODE_EXPIRED / CODE_LOCKED.
    CredentialsProvider({
      id: 'email-code',
      name: 'Email code',
      credentials: { email: { label: 'Email', type: 'email' }, code: { label: 'Code', type: 'text' } },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        if (!email || !credentials?.code) throw new Error('CODE_WRONG');

        const check = await verifyLoginCode(email, credentials.code);
        if (!check.ok) throw new Error(`CODE_${check.reason.toUpperCase()}`);

        const { user, created } = await findOrCreateUserByEmail(email, USER_COLUMNS);
        if (user.is_suspended === true) throw new Error('ACCOUNT_SUSPENDED');
        // "Email me with news and offers" on a new account: the same welcome (WELCOME10) as the footer sign-up
        if (created && check.marketing) {
          sendSubscriptionConfirmationEmail(email).catch(e => console.error('Welcome offer email failed:', e));
        }
        return toSessionUser(user);
      },
    }),

    // Signs a visitor in straight from the emailed verification link, so
    // clicking "Verify" never dead-ends on a login form.
    CredentialsProvider({
      id: 'verification-token',
      name: 'Verification Link',
      credentials: { token: { label: 'Token', type: 'text' } },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          const { payload } = await jwtVerify(credentials.token, secret);
          if (payload.purpose !== 'session_grant') return null;

          const { rows } = await db.query(
            `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND LOWER(email) = LOWER($2) LIMIT 1`,
            [payload.userId, payload.email]
          );
          const user = rows[0];
          if (!user || user.is_suspended === true) return null;

          return toSessionUser(user);
        } catch {
          return null;
        }
      },
    }),
  ],

  // Merged over next-auth's defaults; absent entirely unless Apple is
  // configured on an https origin. See crossSiteOAuthCookies above.
  ...(crossSiteOAuthCookies ? { cookies: crossSiteOAuthCookies } : {}),

  debug: process.env.NEXTAUTH_DEBUG === 'true',

  session: { strategy: 'jwt' },

  callbacks: {
    // OAuth users have no row until their first sign-in. There is no database
    // adapter here, so we upsert by email and graft the database identity onto
    // `user` — the same object the jwt callback receives next.
    async signIn({ user, account, profile }) {
      if (!account || account.type === 'credentials') return true;

      const email = String(user?.email || profile?.email || '').trim().toLowerCase();
      if (!email) return false;

      const client = await db.connect();
      try {
        const existing = await client.query(
          `SELECT ${USER_COLUMNS} FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1`,
          [email]
        );

        let row = existing.rows[0];

        if (row) {
          if (row.is_suspended === true) return false;
          // The provider vouched for this address, so trust it and clear any
          // pending verification nudge.
          if (row.email_verified === false) {
            await client.query('UPDATE users SET email_verified = true WHERE id = $1', [row.id]);
            row.email_verified = true;
          }
        } else {
          // Apple only returns a name on the very first authorization.
          const fullName = String(user?.name || profile?.name || '').trim();
          const parts = fullName.split(/\s+/).filter(Boolean);
          const firstName = parts[0] || email.split('@')[0];
          const lastName = parts.slice(1).join(' ');

          const inserted = await client.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name,
                                profile_image, email_verified, oauth_provider, loyalty_points)
             VALUES ($1, $2, NULL, $3, $4, $5, true, $6, 500)
             RETURNING ${USER_COLUMNS}`,
            [
              `u_${account.provider}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
              email,
              firstName,
              lastName,
              user?.image || null,
              account.provider,
            ]
          );
          row = inserted.rows[0];

          const slug =
            `${firstName}${lastName}`.toLowerCase().normalize('NFD')
              .replace(/[̀-ͯ]/g, '')
              .replace(/[^a-z0-9]/g, '')
              .slice(0, 20) || 'member';
          try {
            await client.query('UPDATE users SET username = $1 WHERE id = $2', [`${slug}${row.id}`, row.id]);
            row.username = `${slug}${row.id}`;
          } catch {
            // Provisional handle is already valid.
          }

        }

        Object.assign(user, toSessionUser(row));
        return true;
      } catch (e) {
        console.error('OAuth sign-in failed:', e);
        return false;
      } finally {
        client.release();
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.profile_image = user.profile_image;
        token.emailVerified = user.emailVerified;
        token.createdAt = user.createdAt;
        token.roleCheckedAt = Date.now();
      }

      // Admin and staff tokens follow the database: a role change or removed access
      // applies within a minute. Customers are never re-checked (no extra queries).
      const elevated = token.role === 'admin' || token.role === 'staff';
      if (!user && token.id && (elevated || trigger === 'update') && Date.now() - (token.roleCheckedAt || 0) > ROLE_RECHECK_MS) {
        try {
          token.role = await currentRole(token.id);
          token.roleCheckedAt = Date.now();
        } catch (e) {
          console.error('Role re-check failed:', e);
        }
      }

      if (trigger === 'update' && session) {
        if (session.profile_image) token.profile_image = session.profile_image;
        if (session.first_name) token.first_name = session.first_name;
        if (session.last_name) token.last_name = session.last_name;
        // Lets the verify banner clear itself without a full re-login.
        if (session.emailVerified !== undefined) token.emailVerified = session.emailVerified;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
        session.user.profile_image = token.profile_image;
        session.user.emailVerified = token.emailVerified !== false;
        session.user.createdAt = token.createdAt;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      // Fire-and-forget: this used to be awaited, adding an SMTP round-trip to
      // every single sign-in before the user was let through.
      if (!user?.email) return;
      // A code sign-in has just emailed them; a second "you signed in" email is noise
      if (account?.provider === 'email-code') return;
      const displayName = user.name || user.username || 'Customer';
      Promise.resolve()
        .then(() => sendLoginConfirmationEmail(user.email, displayName))
        .catch((error) => console.error('Failed to send login confirmation email:', error));
    },
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
