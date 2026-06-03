import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Runs a DELETE inside a savepoint so a missing table doesn't abort the transaction.
async function safeDelete(client, sql, params) {
    await client.query('SAVEPOINT sp');
    try {
        await client.query(sql, params);
        await client.query('RELEASE SAVEPOINT sp');
    } catch {
        await client.query('ROLLBACK TO SAVEPOINT sp');
    }
}

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: userId } = await params;

    if (String(session.user.id) === String(userId)) {
        return NextResponse.json({ error: 'You cannot suspend your own account.' }, { status: 400 });
    }

    const client = await db.connect();
    try {
        // Run outside the transaction — DDL auto-commits in Postgres
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false
        `);

        const { is_suspended } = await request.json();
        if (typeof is_suspended !== 'boolean') {
            return NextResponse.json({ error: 'is_suspended must be a boolean.' }, { status: 400 });
        }

        const { rows } = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        await client.query('BEGIN');

        if (is_suspended) {
            // Delete child rows before parent orders (FK order)
            await safeDelete(client, 'DELETE FROM order_items           WHERE order_id IN (SELECT id FROM orders           WHERE user_id = $1)', [userId]);
            await safeDelete(client, 'DELETE FROM delivered_order_items  WHERE order_id IN (SELECT id FROM delivered_orders  WHERE user_id = $1)', [userId]);
            await safeDelete(client, 'DELETE FROM cancelled_order_items  WHERE order_id IN (SELECT id FROM cancelled_orders  WHERE user_id = $1)', [userId]);
            await safeDelete(client, 'DELETE FROM archived_order_items   WHERE order_id IN (SELECT id FROM archived_orders   WHERE user_id = $1)', [userId]);

            await safeDelete(client, 'DELETE FROM orders            WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM delivered_orders  WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM cancelled_orders  WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM archived_orders   WHERE user_id = $1', [userId]);

            await safeDelete(client, 'DELETE FROM user_carts          WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM wishlist             WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM user_addresses       WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM loyalty_transactions  WHERE user_id = $1', [userId]);
            await safeDelete(client, 'DELETE FROM reviews              WHERE user_id = $1', [userId]);

            await client.query('DELETE FROM users WHERE id = $1', [userId]);
        } else {
            await client.query('UPDATE users SET is_suspended = false WHERE id = $1', [userId]);
        }

        await client.query('COMMIT');

        return NextResponse.json({
            message: is_suspended
                ? 'Account suspended and all user data deleted.'
                : 'Account reinstated.',
            user: { id: Number(userId), is_suspended },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Suspend user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}
