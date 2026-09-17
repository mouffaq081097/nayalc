import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
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
            {
                name: '006_delivered_orders_missing_financial_columns',
                sql: `
                    ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS subtotal        NUMERIC(10,2);
                    ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS shipping_cost   NUMERIC(10,2);
                    ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS gift_wrap       BOOLEAN DEFAULT FALSE;
                    ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS gift_wrap_cost  NUMERIC(10,2) DEFAULT 0;
                    ALTER TABLE delivered_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
                    ALTER TABLE cancelled_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
                `
            },
            {
                name: '007_add_size_to_products',
                sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(255);`
            },
            {
                name: '008_add_how_to_use_video_to_products',
                sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use_video TEXT;`
            },
            {
                name: '009_tabby_payment_id_on_orders',
                sql: `
                    ALTER TABLE orders            ADD COLUMN IF NOT EXISTS tabby_payment_id VARCHAR(255);
                    ALTER TABLE delivered_orders  ADD COLUMN IF NOT EXISTS tabby_payment_id VARCHAR(255);
                    ALTER TABLE cancelled_orders  ADD COLUMN IF NOT EXISTS tabby_payment_id VARCHAR(255);
                `
            },
            {
                name: '010_add_signature_image_to_products',
                sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS signature_image_url TEXT;`
            },
            {
                // Moved out of the signup hot path — this used to run as DDL on
                // every registration, taking an ACCESS EXCLUSIVE lock on users.
                // DEFAULT true so every pre-existing row stays verified; the
                // signup route explicitly inserts false for new rows.
                name: '011_auth_fast_signup',
                sql: `
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;
                    -- OAuth users (Google / Apple) never have a password.
                    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(32);
                    -- Every auth path looks users up by LOWER(email).
                    CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
                `
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
