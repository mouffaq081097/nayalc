import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/users/{userId}/addresses:
 *   get:
 *     summary: Get all addresses for a user
 *     responses:
 *       200:
 *         description: A list of addresses.
 *       500:
 *         description: Server error.
 */
export async function GET(request, context) {
    const params = await context.params;
    const { userId } = params;
    try {
        const sql = 'SELECT id, user_id as "userId", address_line1 as "addressLine1", address_line2 as "addressLine2", city, state, zip_code as "zipCode", country, is_default as "isDefault", address_label as "addressLabel", customer_name as "customerName", customer_email as "customerEmail", customer_phone as "customerPhone", created_at as "createdAt", updated_at as "updatedAt" FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC';
        const { rows } = await db.query(sql, [userId]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error(`Error fetching addresses for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error fetching addresses.', error: error.message }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/users/{userId}/addresses:
 *   post:
 *     summary: Add a new address for a user
 *     responses:
 *       201:
 *         description: Address added successfully.
 *       400:
 *         description: Bad request, missing required fields.
 *       500:
 *         description: Server error.
 */
export async function POST(request, { params }) {
    const { userId } = params;
    const client = await db.connect();
    try {
        const { address_line1, address_line2, city, state, zip_code, country, is_default, address_label = 'Other' } = await request.json();

        if (!address_line1 || !city || !country) {
            return NextResponse.json({ message: 'Address Line 1, City, and Country are required.' }, { status: 400 });
        }

        await client.query('BEGIN');

        if (is_default) {
            await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
        }

        const sql = 'INSERT INTO user_addresses (user_id, address_line1, address_line2, city, state, zip_code, country, is_default, address_label) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id';
        const { rows } = await client.query(sql, [userId, address_line1, address_line2, city, state, zip_code, country, is_default, address_label]);
        
        await client.query('COMMIT');

        return NextResponse.json({ message: 'Address added successfully', addressId: rows[0].id }, { status: 201 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error adding address for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error adding address.', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
