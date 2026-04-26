import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req) {
    const session = await getServerSession(authOptions);

    // Verify admin access
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationIds } = await req.json();

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
        return NextResponse.json({ message: 'Conversation IDs are required' }, { status: 400 });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Delete associated messages
        await client.query(
            'DELETE FROM messages WHERE conversation_id = ANY($1)',
            [conversationIds]
        );

        // 2. Delete the conversations
        const result = await client.query(
            'DELETE FROM conversations WHERE id = ANY($1) RETURNING id',
            [conversationIds]
        );

        await client.query('COMMIT');

        return NextResponse.json({ 
            message: `Successfully deleted ${result.rowCount} conversations`,
            deletedCount: result.rowCount 
        }, { status: 200 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in bulk delete conversations:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
