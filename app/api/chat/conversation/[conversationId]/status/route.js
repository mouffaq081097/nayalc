import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getIo } from '@/pages/api/socket';

const VALID_STATUSES = ['open', 'ai_handling', 'pending_admin_response', 'pending_customer_response', 'closed'];

export async function PUT(req, context) {
    const { conversationId } = await context.params;
    const client = await db.connect();
    try {
        const { status } = await req.json();

        if (!conversationId || !status) {
            return NextResponse.json({ message: 'Conversation ID and status are required' }, { status: 400 });
        }

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
        }

        const result = await client.query(
            `UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, conversationId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        const io = getIo();
        if (io) {
            io.to('admin').emit('conversation_status_updated', { id: parseInt(conversationId), status });
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
