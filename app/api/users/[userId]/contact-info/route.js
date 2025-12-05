import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET contact info
export async function GET(request, { params }) {
    const { userId } = await params;
    try {
        const { rows } = await db.query(
            `SELECT 
                u.first_name,
                u.last_name,
                u.email,
                ua.customer_phone
            FROM users u
            LEFT JOIN user_addresses ua ON u.id = ua.user_id
            WHERE u.id = $1
            ORDER BY ua.is_default DESC, ua.id DESC
            LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) {
            // It's possible a user exists but has no address/phone, so we return what we have for the user
            const userResult = await db.query(
                `SELECT first_name, last_name, email FROM users WHERE id = $1`,
                [userId]
            );
            if (userResult.rows.length === 0) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }
            return NextResponse.json({ ...userResult.rows[0], customer_phone: null });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Error fetching contact info:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// UPDATE contact info
export async function PUT(request, { params }) {
    const { userId } = await params; // Await params
    const { name, phone } = await request.json();

    if (!phone) { // Only phone is required now
        return NextResponse.json({ message: 'Phone is required' }, { status: 400 });
    }

    try {
        // This will update all addresses for the user.
        // This is a business logic decision that might need to be revisited.
        await db.query(
            'UPDATE user_addresses SET customer_phone = $1 WHERE user_id = $2', // Removed customer_name
            [phone, userId]
        );

        return NextResponse.json({ message: 'Contact info updated successfully' });
    } catch (error) {
        console.error('Error updating contact info:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}