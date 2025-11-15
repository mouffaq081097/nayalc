import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { Buffer } from 'buffer';

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

        // Send login confirmation email
        const pythonScriptPath = 'app/api/send_email.py';
        const subject = 'Login Confirmation - nayalc.com';
        const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; margin: 0; padding: 0; }
                .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
                .header { background-color: #007bff; color: white; padding: 25px 20px; text-align: center; }
                .header h2 { margin: 0; font-size: 28px; }
                .content { padding: 30px; }
                .content p { margin-bottom: 15px; }
                .footer { text-align: center; font-size: 0.85em; color: #777; margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-top: 1px solid #e0e0e0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Login Confirmation</h2>
                </div>
                <div class="content">
                    <p>Dear ${user.first_name},</p>
                    <p>This is to confirm that you have successfully logged into your nayalc.com account.</p>
                    <p>If you did not initiate this login, please change your password immediately and contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
        const encodedBody = Buffer.from(body).toString('base64');
        const command = `python ${pythonScriptPath} "${user.email}" "${subject}" "${encodedBody}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error (login email): ${error}`);
                return;
            }
            console.log(`stdout (login email): ${stdout}`);
            console.error(`stderr (login email): ${stderr}`);
        });

        return NextResponse.json({ message: 'Login successful!', token, user: userWithoutPassword });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal server error during login.', error: error.message }, { status: 500 });
    }
}
