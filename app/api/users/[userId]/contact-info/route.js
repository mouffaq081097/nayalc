import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET contact info
export async function GET(request, { params }) {
    const { userId } = await params;
    try {
        const { rows } = await db.query(
            'SELECT customer_phone FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Contact info not found' }, { status: 404 });
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