import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/users/{userId}/addresses/{addressId}:
 *   put:
 *     summary: Update an existing address
 *     responses:
 *       200:
 *         description: Address updated successfully.
 *       400:
 *         description: Bad request, missing required fields.
 *       404:
 *         description: Address not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
    const params = await context.params;
    const { userId, addressId } = params;
    const userIdInt = parseInt(userId, 10);
    const addressIdInt = parseInt(addressId, 10);
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const { address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone } = await request.json();

        if (is_default) {
            await client.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1 AND id != $2', [userId, addressIdInt]);
        }

        const updateSql = `
            UPDATE user_addresses
            SET
                address_line1 = $1,
                address_line2 = $2,
                city = $3,
                state = $4,
                zip_code = $5,
                country = $6,
                is_default = $7,
                address_label = $8,
                customer_name = $9,
                customer_email = $10,
                customer_phone = $11,
                updated_at = NOW()
            WHERE id = $12 AND user_id = $13
            RETURNING *;
        `;
        const updateValues = [address_line1, address_line2, city, state, zip_code, country, is_default, address_label, customer_name, customer_email, customer_phone, addressIdInt, userIdInt];
        const { rowCount } = await client.query(updateSql, updateValues);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Address not found or not authorized.' }, { status: 404 });
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Address updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating address ${addressId}:`, error);
        return NextResponse.json({ message: 'Error updating address.', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * @swagger
 * /api/users/{userId}/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     responses:
 *       200:
 *         description: Address deleted successfully.
 *       404:
 *         description: Address not found.
 *       500:
 *         description: Server error.
 */
export async function DELETE(request, { params }) {
    const { userId, addressId } = params;
    try {
        const { rowCount } = await db.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
        if (rowCount === 0) {
            return NextResponse.json({ message: 'Address not found or not authorized.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error(`Error deleting address ${addressId}:`, error);
        return NextResponse.json({ message: 'Error deleting address.', error: error.message }, { status: 500 });
    }
}
