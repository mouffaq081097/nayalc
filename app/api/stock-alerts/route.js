import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { addStockAlert, isEmail } from '@/lib/stockAlerts';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// "Email me when it's back" on a sold-out product page. Public; one email per
// product and address, sent when stock returns (lib/stockAlerts.js).
export async function POST(request) {
    const limited = rateLimit(`stock-alert:ip:${clientIp(request)}`, { limit: 10, windowMs: 10 * 60_000 });
    if (!limited.ok) {
        return NextResponse.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 });
    }

    try {
        const { productId, email } = await request.json().catch(() => ({}));
        if (!isEmail(email)) {
            return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
        }
        const { rows } = await db.query('SELECT id FROM products WHERE id = $1 AND is_active = TRUE', [Number(productId)]);
        if (!rows.length) {
            return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
        }

        const session = await getServerSession(authOptions);
        await addStockAlert({ productId: rows[0].id, email, userId: session?.user?.id });
        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        console.error('Stock alert sign-up failed:', error);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
