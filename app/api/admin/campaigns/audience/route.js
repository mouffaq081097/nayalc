import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const segment = searchParams.get('segment') || 'all';

        let users = [];

        if (segment === 'all') {
            const { rows } = await db.query(`
                SELECT id, first_name, last_name, email, role, created_at 
                FROM users 
                ORDER BY created_at DESC
            `);
            users = rows;
        } else if (segment === 'abandoned_cart') {
            // Users with items in cart but no orders in the last 24h (optional filter)
            const sql = `
                SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.created_at,
                (SELECT COUNT(*) FROM user_carts WHERE user_id = u.id) as cart_items_count
                FROM users u
                JOIN user_carts uc ON u.id = uc.user_id
                ORDER BY u.created_at DESC
            `;
            const { rows } = await db.query(sql);
            users = rows;
        } else if (segment === 'subscribers') {
            // Assuming all registered users for now, or you can add a specific logic if a subscribers table exists
            const { rows } = await db.query(`
                SELECT id, first_name, last_name, email, created_at 
                FROM users 
                ORDER BY created_at DESC
            `);
            users = rows;
        }

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Fetch Audience Error:', error);
        return NextResponse.json({ message: 'Failed to fetch audience', error: error.message }, { status: 500 });
    }
}
