import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request, { params }) {
    const { userId } = params;
    try {
        const { firstName, lastName, username } = await request.json();

        if (!firstName || !lastName || !username) {
            return NextResponse.json({ message: 'First name, last name, and username are required.' }, { status: 400 });
        }

        const sql = 'UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE id = $4 RETURNING id, username, email, first_name, last_name';
        const { rows } = await db.query(sql, [firstName, lastName, username, userId]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Profile updated successfully!', user: rows[0] });

    } catch (error) {
        console.error(`Error updating profile for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error updating profile.', error: error.message }, { status: 500 });
    }
}
