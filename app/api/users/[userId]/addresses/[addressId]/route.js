import { NextResponse } from 'next/server';
import db from '@/lib/db';

// UPDATE an address
export async function PUT(request, { params }) {
    const { userId, addressId } = await params;
    const {
        address_line1,
        city,
        zip_code,
        country,
        address_line2,
        state,
        is_default,
        address_label,
        customer_email,
        customer_phone
    } = await request.json();

    if (!address_line1 || !city || !zip_code || !country || !customer_phone) {
        return NextResponse.json({ message: 'Missing required address fields' }, { status: 400 });
    }

    try {
        // If this is the new default, set all others to false first
        if (is_default) {
            await db.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }

        const { rows } = await db.query(
            `UPDATE user_addresses
             SET shipping_address = $1, address_line1 = $2, city = $3, zip_code = $4, country = $5, address_line2 = $6, state = $7, is_default = $8, address_label = $9, customer_email = $10, customer_phone = $11
             WHERE id = $12 AND user_id = $13
             RETURNING *`,
            [address_line1, address_line1, city, zip_code, country, address_line2, state, is_default, address_label, customer_email, customer_phone, addressId, userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Address not found or user mismatch' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Error updating address:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

// DELETE an address
export async function DELETE(request, { params }) {
    const { userId, addressId } = await params;
    try {
        // Check if the address is referenced by any orders
        const { rowCount: orderCount } = await db.query(
            'SELECT 1 FROM orders WHERE user_address_id = $1 LIMIT 1',
            [addressId]
        );

        if (orderCount > 0) {
            return NextResponse.json({ message: 'Address cannot be deleted as it is associated with existing orders.' }, { status: 409 });
        }

        const result = await db.query(
            'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
            [addressId, userId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ message: 'Address not found or user mismatch' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}