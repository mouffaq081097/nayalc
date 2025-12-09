import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getIo } from '@/pages/api/socket'; // Import getIo function
import { sendNewChatMessageNotificationEmail } from '@/lib/mail'; // Import mail function

export async function GET(req, context) {
    const { conversationId } = await context.params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const client = await db.connect();
    try {
        if (!conversationId) {
            return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
        }

        // Fetch paginated messages
        const messagesResult = await client.query(
            `SELECT 
                id, 
                conversation_id, 
                sender_id, 
                message_text as "messageText", 
                created_at as "createdAt",
                sender_type as "senderType"
            FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3`,
            [conversationId, limit, offset]
        );

        // Fetch total message count
        const totalCountResult = await client.query(
            `SELECT COUNT(*) FROM messages WHERE conversation_id = $1`,
            [conversationId]
        );
        const totalMessages = parseInt(totalCountResult.rows[0].count, 10);

        return NextResponse.json({
            messages: messagesResult.rows,
            totalMessages,
            limit,
            offset,
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching paginated messages for conversation:', error);
        return NextResponse.json({ message: 'Error fetching messages', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function POST(req, context) {
    const { conversationId } = await context.params;
    const { senderId, content, sender_type } = await req.json();
    const client = await db.connect();

    try {
        if (!conversationId || !senderId || !content || !sender_type) {
            return NextResponse.json({ message: 'Conversation ID, sender ID, content, and sender type are required' }, { status: 400 });
        }

        // Fetch conversation details to validate user_id and get customer info for email
        const conversationQueryResult = await client.query(
            `SELECT 
                c.user_id, 
                u.first_name, 
                u.last_name, 
                u.email 
            FROM conversations c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = $1`,
            [conversationId]
        );

        if (conversationQueryResult.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        const { user_id: conversationUserId, first_name, last_name, email: customerEmail } = conversationQueryResult.rows[0];
        const customerName = `${first_name} ${last_name}`;

        // If message is from customer, validate senderId against conversation's user_id
        if (sender_type === 'customer' && parseInt(conversationUserId, 10) !== parseInt(senderId, 10)) {
            return NextResponse.json({ message: 'Unauthorized: Sender ID does not match conversation user' }, { status: 403 });
        }

        const result = await client.query(
            `INSERT INTO messages (conversation_id, sender_id, message_text, sender_type)
            VALUES ($1, $2, $3, $4)
            RETURNING id, conversation_id, sender_id, message_text as "messageText", created_at as "createdAt", sender_type as "senderType"`,
            [conversationId, senderId, content, sender_type]
        );

        const newMessageData = result.rows[0];
        // Ensure createdAt is always present, even if not returned by the DB for some reason
        if (!newMessageData.createdAt) {
            newMessageData.createdAt = new Date().toISOString();
        }

        // If the message is from a customer, update the conversation status to 'pending_admin_response' and send email notification
        if (newMessageData.senderType === 'customer') {
            await client.query(
                `UPDATE conversations SET status = 'pending_admin_response', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [conversationId]
            );
            console.log(`Conversation ${conversationId} status updated to 'pending_admin_response' due to customer message.`);

            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
                await sendNewChatMessageNotificationEmail(
                    adminEmail,
                    customerName,
                    customerEmail,
                    conversationId,
                    newMessageData.messageText
                );
            } else {
                console.warn('ADMIN_EMAIL environment variable is not set. New chat message notification email not sent.');
            }
        }

        // Broadcast the new message via Socket.io
        const io = getIo();
        if (io) {
            io.to(`conversation-${conversationId}`).emit('receive_message', newMessageData);
            console.log(`Message broadcasted to conversation-${conversationId}:`, newMessageData);
        } else {
            console.warn('Socket.io server not initialized. Message not broadcasted.');
        }

        return NextResponse.json(newMessageData, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ message: 'Error sending message', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}