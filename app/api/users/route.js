import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    const client = await db.connect();
    try {
        const sql = `
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', a.id,
                            'address_label', a.address_label,
                            'customer_email', a.customer_email,
                            'customer_phone', a.customer_phone,
                            'shipping_address', a.shipping_address,
                            'city', a.city,
                            'zip_code', a.zip_code,
                            'is_default', a.is_default,
                            'address_line1', a.address_line1,
                            'address_line2', a.address_line2,
                            'state', a.state,
                            'country', a.country
                        )
                    ) FILTER (WHERE a.id IS NOT NULL),
                    '[]'
                ) AS addresses
            FROM
                users u
            LEFT JOIN
                user_addresses a ON u.id = a.user_id
            GROUP BY
                u.id, u.first_name, u.last_name, u.email, u.phone_number
            ORDER BY
                u.created_at DESC;
        `;
        const { rows } = await client.query(sql);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Error fetching users from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
