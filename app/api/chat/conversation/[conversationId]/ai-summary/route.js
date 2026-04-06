import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const ADMIN_EMAIL = 'mouffaq@nayalc.com';

export async function POST(req, context) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== ADMIN_EMAIL) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const client = await db.connect();

    try {
        const msgResult = await client.query(
            `SELECT sender_type as "senderType", message_text as "messageText", created_at as "createdAt"
             FROM messages WHERE conversation_id = $1
             ORDER BY created_at ASC`,
            [conversationId]
        );

        if (msgResult.rows.length === 0) {
            return NextResponse.json({ summary: 'No messages in this conversation yet.' }, { status: 200 });
        }

        const history = msgResult.rows.map(m => {
            const role = m.senderType === 'customer' ? 'Client' : m.senderType === 'admin' ? 'Admin' : 'AI';
            return `${role}: ${m.messageText}`;
        }).join('\n');

        const prompt = `Summarize the following customer support conversation for a Naya Lumière admin. Be brief and clear.

Provide exactly 3 bullet points:
• Main concern: [what the client needed help with]
• What was addressed: [what was resolved or discussed]
• Action needed: [what still needs attention, or "None — resolved"]

CONVERSATION:
${history}`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim();

        return NextResponse.json({ summary }, { status: 200 });
    } catch (error) {
        console.error('AI summary error:', error);
        return NextResponse.json({ message: 'Failed to generate summary', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
