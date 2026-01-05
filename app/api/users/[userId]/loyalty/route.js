import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { userId } = await params;

    try {
        // 1. Get user loyalty status
        const userRes = await db.query(
            'SELECT loyalty_points as "points", lifetime_spend as "lifetimeSpend", loyalty_tier as "tier" FROM users WHERE id = $1',
            [userId]
        );

        if (userRes.rows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const stats = userRes.rows[0];

        // 2. Get transaction history
        const transRes = await db.query(
            'SELECT id, type, points, description, created_at as "createdAt" FROM loyalty_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        return NextResponse.json({
            stats,
            transactions: transRes.rows
        });

    } catch (error) {
        console.error('Error fetching loyalty data:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
