import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { userId } = await params;
    const client = await db.connect();
    try {
        const userRes = await client.query(
            `SELECT loyalty_points as "loyaltyPoints", loyalty_tier as "loyaltyTier" FROM users WHERE id = $1`,
            [userId]
        );
        if (userRes.rows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const orderRes = await client.query(
            `SELECT id, total_amount as "totalAmount", status, created_at as "createdAt"
             FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        return NextResponse.json({
            loyaltyTier: userRes.rows[0].loyaltyTier,
            loyaltyPoints: userRes.rows[0].loyaltyPoints,
            lastOrder: orderRes.rows[0] || null,
        });
    } catch (error) {
        console.error('Error fetching user context:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}
