import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(req, context) {
    const { conversationId } = context.params;
    const client = await db.connect();
    try {
        const { status } = await req.json();

        if (!conversationId || !status) {
            return NextResponse.json({ message: 'Conversation ID and status are required' }, { status: 400 });
        }

        if (status === 'closed') {
            // Fetch the user_id associated with this conversation
            const conversationQueryResult = await client.query(
                `SELECT user_id FROM conversations WHERE id = $1`,
                [conversationId]
            );

            if (conversationQueryResult.rows.length > 0) {
                const userId = conversationQueryResult.rows[0].user_id;

                // Delete messages associated with this conversation and user
                // Assuming messages table has a user_id or sender_id column for correlation
                await client.query(
                    `DELETE FROM messages WHERE conversation_id = $1 AND sender_id = $2`,
                    [conversationId, userId]
                );
                // Optionally, you might want to delete messages only by conversation_id if sender_id is not guaranteed to be the user_id
                // await client.query(`DELETE FROM messages WHERE conversation_id = $1`, [conversationId]);
                console.log(`Deleted messages for conversationId: ${conversationId} and userId: ${userId}`);
            }
        }

        const result = await client.query(
            `UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, conversationId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json(
            { message: 'Conversation status updated successfully', conversation: result.rows[0] },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating conversation status:', error);
        return NextResponse.json({ message: 'Error updating conversation status', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
