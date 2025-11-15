import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendLoginConfirmationEmail } from '@/lib/mail'; // Import the new function

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user and returns a JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: 'string', format: 'email' }
 *               password: { type: 'string', format: 'password' }
 *     responses: 
 *       200:
 *         description: Login successful, returns JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: 'string' }
 *                 user: { type: 'object' }
 *       401:
 *         description: Invalid credentials.
 *       500:
 *         description: Server error.
 */
export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
        }

        const sql = 'SELECT id, username, email, password_hash, first_name, last_name FROM users WHERE email = $1';
        const { rows } = await db.query(sql, [email]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
        }

        // IMPORTANT: You must set JWT_SECRET in your .env file or Vercel environment variables
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not set.');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            secret,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password_hash;

        // Send login confirmation email using Nodemailer
        await sendLoginConfirmationEmail(user.email, user.first_name);

        return NextResponse.json({ message: 'Login successful!', token, user: userWithoutPassword });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal server error during login.', error: error.message }, { status: 500 });
    }
}
