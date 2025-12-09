import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all addresses for a user
export async function GET(request, { params }) {
    const { userId } = await params;
    try {
        const { rows } = await db.query(
            `SELECT
                id,
                user_id as "userId",
                address_line1 as "addressLine1",
                address_line2 as "addressLine2",
                city,
                zip_code as "zipCode",
                country,
                state,
                is_default as "isDefault",
                address_label as "addressLabel",
                customer_email as "customerEmail",
                customer_phone as "customerPhone",
                shipping_address as "shippingAddress",
                (SELECT COUNT(*) FROM orders o WHERE o.user_address_id = user_addresses.id) = 0 as "isDeletable"
             FROM user_addresses
             WHERE user_id = $1
             ORDER BY is_default DESC, id DESC`,
            [userId]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST a new address for a user
export async function POST(request, { params }) {
    const { userId } = await params;
    const {
        address_line1, // This will be used for shipping_address
        city,
        zip_code,
        country,
        address_line2, // This will be concatenated or ignored if shipping_address is enough
        state,
        is_default,
        address_label = 'My Address', // Provide a default if not present
        customer_email = '', // Provide a default if not present
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
        
        // Use shipping_address and address_line1
        const { rows } = await db.query(
            `INSERT INTO user_addresses (user_id, shipping_address, address_line1, city, zip_code, country, address_line2, state, is_default, address_label, customer_email, customer_phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING 
                id,
                user_id as "userId",
                shipping_address,
                address_line1 as "addressLine1",
                address_line2 as "addressLine2",
                city,
                zip_code as "zipCode",
                country,
                state,
                is_default as "isDefault",
                address_label as "addressLabel",
                customer_email as "customerEmail",
                customer_phone as "customerPhone"`,
            [userId, address_line1, address_line1, city, zip_code, country, address_line2, state, is_default, address_label, customer_email, customer_phone]
        );
        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating address:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}