import CredentialsProviderModule from 'next-auth/providers/credentials';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendLoginConfirmationEmail } from '@/lib/mail';

const CredentialsProvider = CredentialsProviderModule.default?.default || CredentialsProviderModule.default || CredentialsProviderModule;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Authorize called with email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          throw new Error('Missing credentials');
        }

        const client = await db.connect();
        try {
          // Select the latest user by ID if duplicates exist, using case-insensitive email match
          const result = await client.query(
            'SELECT id, username, email, first_name, last_name, profile_image, password_hash, is_admin, created_at, COALESCE(email_verified, true) as email_verified, COALESCE(is_suspended, false) as is_suspended FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1',
            [credentials.email]
          );
          const user = result.rows[0];

          if (!user) {
            console.log('User not found');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) {
            console.log('Invalid password');
            return null;
          }

          if (user.is_suspended === true) {
            console.log('Suspended account login attempt:', user.email);
            throw new Error('ACCOUNT_SUSPENDED');
          }

          if (user.email_verified === false) {
            console.log('Email not verified for:', user.email);
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          console.log('User authenticated successfully');
          return {
            id: user.id,
            name: user.first_name,
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            profile_image: user.profile_image,
            role: user.is_admin ? 'admin' : 'user',
            createdAt: user.created_at,
          };
        } catch (e) {
            console.error('Error in authorize:', e);
            return null;
        } finally {
          client.release();
        }
      }
    })
  ],
  debug: true, // Enable NextAuth debugging
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist the user id and role to the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.profile_image = user.profile_image;
        token.createdAt = user.createdAt;
      }
      
      // Handle manual session updates (trigger: "update")
      if (trigger === "update" && session) {
        if (session.profile_image) token.profile_image = session.profile_image;
        if (session.first_name) token.first_name = session.first_name;
        if (session.last_name) token.last_name = session.last_name;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
        session.user.profile_image = token.profile_image;
        session.user.createdAt = token.createdAt;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      // Send a confirmation email on successful sign in
      if (user && user.email) {
          try {
            const displayName = user.name || user.username || 'Customer';
            await sendLoginConfirmationEmail(user.email, displayName);
          } catch (error) {
              console.error("Failed to send login confirmation email:", error);
          }
      }
    }
  },
  pages: {
    signIn: '/auth', // Redirect users to this page for sign-in
    error: '/auth', // Redirect users to the sign-in page on error
  },
  secret: process.env.NEXTAUTH_SECRET,
};
