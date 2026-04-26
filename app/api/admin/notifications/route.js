import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        // 1. Unread conversations
        const chatResult = await client.query(`
            SELECT COUNT(DISTINCT conversation_id) as unread_chats
            FROM messages
            WHERE sender_type = 'customer' AND read_by_admin = false
        `);
        const unreadChats = parseInt(chatResult.rows[0].unread_chats || '0', 10);

        // 2. Unread orders (where viewed_by_admin = false)
        const orderResult = await client.query(`
            SELECT id, total_amount, created_at, order_status 
            FROM orders 
            WHERE viewed_by_admin = false 
            ORDER BY created_at DESC
        `);
        const unreadOrdersCount = orderResult.rows.length;
        const unreadOrdersDetails = orderResult.rows;

        // Optionally, we could fetch details of the unread chats
        const chatDetailsResult = await client.query(`
            SELECT c.id, u.first_name, u.email, MAX(m.created_at) as last_message_at
            FROM conversations c
            JOIN messages m ON c.id = m.conversation_id
            JOIN users u ON c.user_id = u.id
            WHERE m.sender_type = 'customer' AND m.read_by_admin = false
            GROUP BY c.id, u.first_name, u.email
            ORDER BY last_message_at DESC
        `);
        const unreadChatsDetails = chatDetailsResult.rows;

        return NextResponse.json({
            unreadTotal: unreadChats + unreadOrdersCount,
            unreadChatsCount: unreadChats,
            unreadOrdersCount,
            unreadOrdersDetails,
            unreadChatsDetails
        });

    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
    } finally {
        client.release();
    }
}