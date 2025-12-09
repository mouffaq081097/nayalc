import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    const client = await db.connect();
    try {
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
            ORDER BY c.updated_at DESC`
        );
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error('Error fetching all conversations:', error);
        return NextResponse.json({ message: 'Error fetching all conversations', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function POST(req) {
    const client = await db.connect();
    try {
        const { user_id } = await req.json();

        if (!user_id) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        // Check if an open conversation already exists for this user
        const existingConversation = await client.query(
            `SELECT id FROM conversations WHERE user_id = $1 AND status != 'closed'`,
            [user_id]
        );

        if (existingConversation.rows.length > 0) {
            return NextResponse.json(
                { message: 'Open conversation already exists', conversationId: existingConversation.rows[0].id },
                { status: 200 }
            );
        }

        // Create a new conversation
        const result = await client.query(
            `INSERT INTO conversations (user_id, status) VALUES ($1, 'open') RETURNING id, created_at, status`,
            [user_id]
        );

        return NextResponse.json(
            { message: 'Conversation created successfully', conversationId: result.rows[0].id },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ message: 'Error creating conversation', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
