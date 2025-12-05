import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req, context) {
    const { userId } = context.params;
    const client = await db.connect();
    try {
        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        const result = await client.query(
            `SELECT 
                c.id, 
                c.user_id, 
                c.created_at as "createdAt", 
                c.updated_at as "updatedAt", 
                c.status,
                u.first_name || ' ' || u.last_name as "customerName",
                u.email as "customerEmail"
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = $1
            ORDER BY c.updated_at DESC`,
            [userId]
        );

        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ message: 'Error fetching conversations', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
