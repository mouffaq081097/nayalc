import CredentialsProviderModule from 'next-auth/providers/credentials';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendLoginConfirmationEmail } from '@/lib/mail';

const CredentialsProvider = CredentialsProviderModule.default || CredentialsProviderModule;

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
          // Removed 'role' from query as it does not exist in the database
          const result = await client.query('SELECT id, username, email, first_name, last_name, password_hash FROM users WHERE LOWER(email) = LOWER($1) ORDER BY id DESC LIMIT 1', [credentials.email]);
          const user = result.rows[0];

          if (!user) {
            console.log('User not found');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (isValid) {
            console.log('User authenticated successfully');
            // Return the user object without the password hash
            return {
              id: user.id,
              name: user.first_name, // Default NextAuth name
              email: user.email,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.email === 'mouffaq@nayalc.com' ? 'admin' : 'user', 
              createdAt: user.created_at,
            };
          } else {
            console.log('Invalid password');
            return null; // returning null will cause authentication to fail
          }
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
    async jwt({ token, user }) {
      // Persist the user id and role to the token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.createdAt = user.createdAt;
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
        session.user.createdAt = token.createdAt;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      // Send a confirmation email on successful sign in
      if (user.email && user.name) {
          try {
            await sendLoginConfirmationEmail(user.email, user.name);
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
