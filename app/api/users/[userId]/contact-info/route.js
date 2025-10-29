import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * @swagger
 * /api/users/{userId}/contact-info:
 *   put:
 *     summary: Update user's contact info in their first address
 *     description: Updates the name and phone number on the user's first available address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: 'string' }
 *               phone: { type: 'string' }
 *     responses:
 *       200:
 *         description: Contact information updated successfully.
 *       400:
 *         description: Bad request, missing fields.
 *       404:
 *         description: No address found for the user.
 *       500:
 *         description: Server error.
 */
export async function PUT(request, context) {
    const params = await context.params;
    const { userId } = params;
    const client = await db.connect();
    try {
        const { name, phone } = await request.json();

        if (!name || !phone) {
            return NextResponse.json({ message: 'Name and phone are required.' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Find the first address for this user
        const { rows: addresses } = await client.query('SELECT id FROM user_addresses WHERE user_id = $1 LIMIT 1', [userId]);

        if (addresses.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'No address found for this user to update contact info.' }, { status: 404 });
        }

        const addressId = addresses[0].id;

        const updateAddressSql = 'UPDATE user_addresses SET customer_name = $1, customer_phone = $2 WHERE id = $3 AND user_id = $4';
        const { rowCount } = await client.query(updateAddressSql, [name, phone, addressId, userId]);

        if (rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Address not found or no changes made.' }, { status: 404 });
        }

        await client.query('COMMIT');
        return NextResponse.json({ message: 'Contact information updated successfully in address.' });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error(`Error updating contact info for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to update contact information.', error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function GET(request, context) {
    const params = await context.params;
    const { userId } = params;
    const client = await db.connect();
    try {
        // Find the default address, or the first address if no default is set
        const { rows: addresses } = await client.query(
            'SELECT customer_name, customer_email, customer_phone FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC LIMIT 1',
            [userId]
        );
        console.log(`Fetched contact info for user ${userId}:`, addresses);

        if (addresses.length === 0) {
            return NextResponse.json({ name: '', email: '', phone: '' }, { status: 200 }); // Return empty if no address
        }

        const contactInfo = addresses[0];
        return NextResponse.json(contactInfo, { status: 200 });

    } catch (error) {
        console.error(`Error fetching contact info for user ${userId}:`, error);
        return NextResponse.json({ message: 'Failed to fetch contact information.', error: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
