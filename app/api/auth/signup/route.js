import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/mail';

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with a hashed password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username: { type: 'string' }
 *               email: { type: 'string', format: 'email' }
 *               password: { type: 'string', format: 'password' }
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Missing required fields.
 *       409:
 *         description: Username or email already exists.
 *       500:
 *         description: Server error.
 */
export async function POST(request) {
    try {
        const { username, email, password, firstName, lastName } = await request.json();

        if (!username || !email || !password || !firstName || !lastName) {
            return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, first_name, last_name';
        const { rows } = await db.query(sql, [username, email, hashedPassword, firstName, lastName]);

        // Send welcome email
        await sendWelcomeEmail(email, firstName);

        return NextResponse.json({ message: 'User registered successfully!', user: rows[0] }, { status: 201 });

    } catch (error) {
        console.error('Signup Error:', error);
        // Check for unique constraint violation (PostgreSQL error code 23505)
        if (error.code === '23505') {
            if (error.constraint === 'users_email_key') { // Assuming a unique constraint on email is named users_email_key
                 return NextResponse.json({ message: 'Email address is already registered.' }, { status: 409 });
            }
            if (error.constraint === 'users_username_key') { // Assuming a unique constraint on username is named users_username_key
                 return NextResponse.json({ message: 'Username already exists.' }, { status: 409 });
            }
            return NextResponse.json({ message: 'A user with the same username or email already exists.' }, { status: 409 });
        }

        return NextResponse.json({ message: 'Internal server error during signup.', error: error.message }, { status: 500 });
    }
}
