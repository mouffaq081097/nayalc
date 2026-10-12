import { NextResponse } from 'next/server';
import { verifyOtoSignature, handleOtoStatusUpdate } from '@/lib/oto';

// OTO calls this as a shipment moves (registered by scripts/oto-register-webhook.mjs).
// Not behind the auth middleware — the HMAC signature in the body is the authentication.
export async function POST(request) {
    const payload = await request.json().catch(() => null);
    if (!payload) return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });

    if (!verifyOtoSignature(payload)) {
        console.warn(`OTO webhook rejected: bad or missing signature (order ${payload.orderId}, status ${payload.status})`);
        return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    try {
        const { status, body } = await handleOtoStatusUpdate(payload);
        if (status >= 400) console.error(`OTO webhook for order ${payload.orderId} failed:`, body);
        return NextResponse.json(body, { status });
    } catch (error) {
        // A 5xx makes OTO retry, which is what we want if the database blipped
        console.error(`OTO webhook for order ${payload.orderId} failed:`, error);
        return NextResponse.json({ message: 'Webhook failed', error: error.message }, { status: 500 });
    }
}
