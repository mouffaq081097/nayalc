import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export async function POST(req, context) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const client = await db.connect();

    try {
        // Fetch conversation + customer info
        const convResult = await client.query(
            `SELECT c.user_id, u.first_name, u.last_name, u.loyalty_points, u.loyalty_tier
             FROM conversations c JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
            [conversationId]
        );
        if (convResult.rows.length === 0) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }
        const { user_id, first_name, loyalty_tier, loyalty_points } = convResult.rows[0];

        // Fetch last 30 messages
        const msgResult = await client.query(
            `SELECT sender_type as "senderType", message_text as "messageText"
             FROM messages WHERE conversation_id = $1
             ORDER BY created_at ASC LIMIT 30`,
            [conversationId]
        );

        // Fetch last 5 orders
        let orderSummary = 'No recent orders.';
        try {
            const ordersResult = await client.query(
                `SELECT id, total_amount, status FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
                [user_id]
            );
            if (ordersResult.rows.length > 0) {
                orderSummary = ordersResult.rows.map(o =>
                    `Order #${o.id} — AED ${parseFloat(o.total_amount || 0).toFixed(2)} — ${o.status}`
                ).join(', ');
            }
        } catch (_) {}

        const history = msgResult.rows.map(m => {
            const role = m.senderType === 'customer' ? 'Client' : m.senderType === 'admin' ? 'Admin' : 'AI';
            return `${role}: ${m.messageText}`;
        }).join('\n');

        const prompt = `You are helping a Naya Lumière concierge admin draft a professional reply to a client.

CLIENT: ${first_name} | Tier: ${loyalty_tier || 'Member'} (${loyalty_points || 0} pts)
RECENT ORDERS: ${orderSummary}

CONVERSATION:
${history}

Write a single, professional, empathetic reply from the admin's perspective. The reply should:
- Sound warm and human (not AI-generated)
- Align with the Naya Lumière luxury brand voice
- Directly address the client's latest message or concern
- Be concise (2-4 sentences max unless a detailed answer is needed)
- Not include any preamble like "Here is a draft:" — just write the reply itself`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const draft = result.response.text().trim();

        return NextResponse.json({ draft }, { status: 200 });
    } catch (error) {
        console.error('AI draft error:', error);
        return NextResponse.json({ message: 'Failed to generate draft', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
