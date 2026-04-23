import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getIo } from '@/pages/api/socket';
import { sendNewChatMessageNotificationEmail } from '@/lib/mail';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

async function buildAiSystemPrompt(client, conversationId, conversationUserId, firstName, currentMessage) {
    // Fetch last 20 messages for context
    const historyResult = await client.query(
        `SELECT sender_type as "senderType", message_text as "messageText"
         FROM messages WHERE conversation_id = $1
         ORDER BY created_at ASC LIMIT 20`,
        [conversationId]
    );

    // Fetch loyalty/tier from users table
    let tier = 'Member';
    let points = 0;
    try {
        const loyaltyResult = await client.query(
            `SELECT loyalty_points, loyalty_tier FROM users WHERE id = $1`,
            [conversationUserId]
        );
        if (loyaltyResult.rows.length > 0) {
            tier = loyaltyResult.rows[0].loyalty_tier || 'Member';
            points = loyaltyResult.rows[0].loyalty_points || 0;
        }
    } catch (_) {}

    // Fetch last 5 orders
    let orderSummary = 'No recent orders.';
    try {
        const ordersResult = await client.query(
            `SELECT id, total_amount, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
            [conversationUserId]
        );
        if (ordersResult.rows.length > 0) {
            orderSummary = ordersResult.rows.map(o =>
                `Order #${o.id} — AED ${parseFloat(o.total_amount || 0).toFixed(2)} — ${o.status} (${new Date(o.created_at).toLocaleDateString()})`
            ).join('\n');
        }
    } catch (_) {}

    // Fetch top 40 products
    let productList = '';
    try {
        let productsResult;
        try {
            productsResult = await client.query(
                `SELECT id, name, brand, price, description FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 40`
            );
        } catch (e) {
            if (e.message.includes('is_active')) {
                productsResult = await client.query(
                    `SELECT id, name, brand, price, description FROM products ORDER BY created_at DESC LIMIT 40`
                );
            } else {
                throw e;
            }
        }
        productList = productsResult.rows.map(p =>
            `- ${p.name} by ${p.brand || 'Naya Lumière'} — AED ${parseFloat(p.price).toFixed(2)}: ${(p.description || '').slice(0, 80)}`
        ).join('\n');
    } catch (_) {}

    const history = historyResult.rows.map(m => {
        const role = m.senderType === 'customer' ? 'Client' : 'Naya';
        return `${role}: ${m.messageText}`;
    }).join('\n');

    return `You are Naya, the AI Skin Specialist at Naya Lumière — a luxury skincare boutique in the UAE.
Your tone is warm, knowledgeable, and sophisticated (think Chanel concierge, not a chatbot).

CLIENT CONTEXT:
- Name: ${firstName}
- Loyalty Tier: ${tier} (${points} points)
- Recent Orders:
${orderSummary}

OUR COLLECTION:
${productList || 'A curated selection of luxury skincare products.'}

CONVERSATION HISTORY:
${history || 'No previous messages.'}

LATEST MESSAGE FROM CLIENT: ${currentMessage}

INSTRUCTIONS:
1. Answer directly and helpfully. Do not repeat the question back.
2. If the client mentions a skin concern, recommend 1-2 specific products by name and price from our collection above.
3. Reference their loyalty tier or order history if genuinely relevant (e.g., "As a ${tier} member...").
4. If asked about an order, acknowledge their recent orders but direct complex order issues to our team.
5. If the user wants to speak to a human, warmly confirm you are connecting them (but do not change the status yourself).
6. Keep replies concise — 2-4 sentences unless a detailed skincare routine is requested.
7. Never reveal that you are an AI unless directly asked. You are the Naya Specialist.
8. Always respond in English.`;
}

export async function POST(req, context) {
    const { conversationId } = await context.params;
    const { senderId, content, sender_type } = await req.json();
    const client = await db.connect();

    try {
        if (!conversationId || !senderId || !content || !sender_type) {
            return NextResponse.json({ message: 'Conversation ID, sender ID, content, and sender type are required' }, { status: 400 });
        }

        // Fetch conversation details
        const conversationQueryResult = await client.query(
            `SELECT c.user_id, c.status, u.first_name, u.last_name, u.email
             FROM conversations c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [conversationId]
        );

        if (conversationQueryResult.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }

        const { user_id: conversationUserId, status: convStatus, first_name, last_name, email: customerEmail } = conversationQueryResult.rows[0];
        const customerName = `${first_name} ${last_name}`;

        if (convStatus === 'closed') {
            return NextResponse.json({ message: 'Conversation is closed' }, { status: 400 });
        }

        // Validate sender_type — block customer from sending as 'admin' or 'ai'
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mouffaq.dalloul@nayalc.com';
        if (sender_type === 'admin') {
            const { getServerSession } = await import('next-auth');
            const { authOptions } = await import('@/lib/auth');
            const session = await getServerSession(authOptions);
            if (!session || session.user?.email !== ADMIN_EMAIL) {
                return NextResponse.json({ message: 'Unauthorized: Only admins can send admin messages' }, { status: 403 });
            }
        } else if (sender_type === 'ai') {
            return NextResponse.json({ message: 'Unauthorized: Cannot send as AI' }, { status: 403 });
        }

        // Validate customer sender
        if (sender_type === 'customer' && parseInt(conversationUserId, 10) !== parseInt(senderId, 10)) {
            return NextResponse.json({ message: 'Unauthorized: Sender ID does not match conversation user' }, { status: 403 });
        }

        // Save the message
        const result = await client.query(
            `INSERT INTO messages (conversation_id, sender_id, message_text, sender_type)
            VALUES ($1, $2, $3, $4)
            RETURNING id, conversation_id, sender_id, message_text as "messageText", created_at as "createdAt", sender_type as "senderType"`,
            [conversationId, senderId, content, sender_type]
        );

        const newMessageData = result.rows[0];
        if (!newMessageData.createdAt) {
            newMessageData.createdAt = new Date().toISOString();
        }

        // Broadcast customer message via Socket.IO
        const io = getIo();
        if (io) {
            io.to(`conversation-${conversationId}`).emit('receive_message', newMessageData);
        }

        // --- AI ROUTING ---
        if (sender_type === 'customer') {
            const shouldAiRespond = convStatus !== 'pending_admin_response' && convStatus !== 'closed';

            // AI debounce: skip if AI replied within the last 8 seconds
            let aiDebounced = false;
            if (shouldAiRespond) {
                const lastAiResult = await client.query(
                    `SELECT MAX(created_at) as last_ai FROM messages WHERE conversation_id = $1 AND sender_type = 'ai'`,
                    [conversationId]
                );
                const lastAiTime = lastAiResult.rows[0]?.last_ai;
                if (lastAiTime && (Date.now() - new Date(lastAiTime).getTime()) < 8000) {
                    aiDebounced = true;
                }
            }

            if (shouldAiRespond && !aiDebounced && process.env.GEMINI_API_KEY) {
                // Fire AI response asynchronously — don't block the HTTP response
                setImmediate(async () => {
                    const aiClient = await db.connect();
                    try {
                        const systemPrompt = await buildAiSystemPrompt(
                            aiClient, conversationId, conversationUserId, first_name, content
                        );

                        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                        const aiResult = await model.generateContent(systemPrompt);
                        const aiText = aiResult.response.text().trim();

                        if (!aiText) return;

                        // Save AI message (sender_id = customer's user_id, differentiated by sender_type='ai')
                        const aiMsgResult = await aiClient.query(
                            `INSERT INTO messages (conversation_id, sender_id, message_text, sender_type)
                             VALUES ($1, $2, $3, 'ai')
                             RETURNING id, conversation_id, sender_id, message_text as "messageText", created_at as "createdAt", sender_type as "senderType"`,
                            [conversationId, conversationUserId, aiText]
                        );
                        const aiMessageData = aiMsgResult.rows[0];
                        if (!aiMessageData.createdAt) aiMessageData.createdAt = new Date().toISOString();

                        // Update conversation status to ai_handling
                        await aiClient.query(
                            `UPDATE conversations SET status = 'ai_handling', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                            [conversationId]
                        );

                        // Broadcast AI message
                        const ioInstance = getIo();
                        if (ioInstance) {
                            ioInstance.to(`conversation-${conversationId}`).emit('receive_message', aiMessageData);
                            ioInstance.to('admin').emit('conversation_status_updated', { id: parseInt(conversationId), status: 'ai_handling' });
                        }
                    } catch (aiErr) {
                        console.error('AI response error:', aiErr);
                        // Fallback: send admin email if AI fails
                        const adminEmail = process.env.ADMIN_EMAIL;
                        if (adminEmail) {
                            await sendNewChatMessageNotificationEmail(adminEmail, customerName, customerEmail, conversationId, content).catch(() => {});
                        }
                    } finally {
                        aiClient.release();
                    }
                });
            } else {
                // Human escalation: notify admin
                await client.query(
                    `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                    [conversationId]
                );
                const adminEmail = process.env.ADMIN_EMAIL;
                if (adminEmail) {
                    await sendNewChatMessageNotificationEmail(adminEmail, customerName, customerEmail, conversationId, content).catch(() => {});
                }
            }
        } else if (sender_type === 'admin') {
            // Admin replied — mark as pending customer response
            await client.query(
                `UPDATE conversations SET status = 'pending_customer_response', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [conversationId]
            );
        }

        return NextResponse.json(newMessageData, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ message: 'Error sending message', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
