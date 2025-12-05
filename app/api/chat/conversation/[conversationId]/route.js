import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req, context) {
    const { conversationId } = await context.params;
    const client = await db.connect();
    try {
        if (!conversationId) {
            return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
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
            WHERE c.id = $1`,
            [conversationId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error('Error fetching single conversation:', error);
        return NextResponse.json({ message: 'Error fetching single conversation', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(req, context) {
    const { conversationId } = context.params;
    const client = await db.connect();
    try {
        if (!conversationId) {
            return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
        }

        // Start a transaction to ensure atomicity
        await client.query('BEGIN');

        // 1. Delete associated messages
        await client.query(
            `DELETE FROM messages WHERE conversation_id = $1`,
            [conversationId]
        );

        // 2. Delete the conversation itself
        const result = await client.query(
            `DELETE FROM conversations WHERE id = $1 RETURNING id`,
            [conversationId]
        );

        // Commit the transaction
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Conversation deleted successfully' }, { status: 200 });

    } catch (error) {
        // Rollback the transaction in case of error
        await client.query('ROLLBACK');
        console.error('Error deleting conversation:', error);
        return NextResponse.json({ message: 'Error deleting conversation', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
