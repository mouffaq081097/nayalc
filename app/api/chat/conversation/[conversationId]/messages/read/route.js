import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(req, context) {
    const { conversationId } = await context.params;
    const client = await db.connect();
    try {
        await client.query(
            `UPDATE messages SET read_by_admin = true WHERE conversation_id = $1 AND sender_type = 'customer'`,
            [conversationId]
        );
        return NextResponse.json({ message: 'Marked as read' }, { status: 200 });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json({ message: 'Error marking as read' }, { status: 500 });
    } finally {
        client.release();
    }
}
