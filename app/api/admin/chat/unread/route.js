import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    const client = await db.connect();
    try {
        const result = await client.query(
            `SELECT COUNT(m.id)
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.status = 'pending_admin_response' AND m.sender_type = 'customer'`
        );
        const unreadCount = result.rows[0].count;

        return NextResponse.json({ unreadCount: parseInt(unreadCount, 10) }, { status: 200 });
    } catch (error) {
        console.error('Error fetching unread admin chat count:', error);
        return NextResponse.json({ message: 'Error fetching unread admin chat count', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
