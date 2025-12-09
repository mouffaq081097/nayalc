import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
    const { userId } = params;

    try {
        const sql = 'SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = $1';
        const { rows } = await db.query(sql, [userId]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error fetching profile.', error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { userId } = params;
    try {
        const { firstName, lastName, username, password } = await request.json();

        if (!firstName || !lastName || !username) {
            return NextResponse.json({ message: 'First name, last name, and username are required.' }, { status: 400 });
        }

        let sql;
        let paramsArray;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql = 'UPDATE users SET first_name = $1, last_name = $2, username = $3, password_hash = $4 WHERE id = $5 RETURNING id, username, email, first_name, last_name';
            paramsArray = [firstName, lastName, username, hashedPassword, userId];
        } else {
            sql = 'UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE id = $4 RETURNING id, username, email, first_name, last_name';
            paramsArray = [firstName, lastName, username, userId];
        }

        const { rows } = await db.query(sql, paramsArray);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Profile updated successfully!', user: rows[0] });

    } catch (error) {
        console.error(`Error updating profile for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error updating profile.', error: error.message }, { status: 500 });
    }
}
