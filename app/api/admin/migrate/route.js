import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== 'mouffaq@nayalc.com') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await db.connect();
    const results = [];

    try {
        const migrations = [
            {
                name: '002_stripe_payment_intent_id_on_orders',
                sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);`
            },
            {
                name: '003_stripe_payment_intent_id_on_archived_orders',
                sql: `
                    ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
                    ALTER TABLE cancelled_orders  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
                `
            },
            {
                name: '004_cancelled_orders_missing_financial_columns',
                sql: `
                    ALTER TABLE cancelled_orders ADD COLUMN IF NOT EXISTS subtotal       NUMERIC(10,2);
                    ALTER TABLE cancelled_orders ADD COLUMN IF NOT EXISTS shipping_cost  NUMERIC(10,2);
                    ALTER TABLE cancelled_orders ADD COLUMN IF NOT EXISTS gift_wrap      BOOLEAN DEFAULT FALSE;
                    ALTER TABLE cancelled_orders ADD COLUMN IF NOT EXISTS gift_wrap_cost NUMERIC(10,2) DEFAULT 0;
                `
            },
            {
                name: '005_redeemed_points_on_orders',
                sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0;`
            },
        ];

        for (const migration of migrations) {
            await client.query(migration.sql);
            results.push({ name: migration.name, status: 'applied' });
        }

        return NextResponse.json({ message: 'Migrations applied', results });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ message: 'Migration failed', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
