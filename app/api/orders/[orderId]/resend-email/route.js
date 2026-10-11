import { NextResponse } from 'next/server';
import { currentSessionUser } from '@/lib/adminAuth';
import { resendOrderConfirmation } from '@/lib/orderConfirmation';

export async function POST(request, { params }) {
    const user = await currentSessionUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { orderId } = await params;

    try {
        // Customers can resend their own orders' emails; admins any
        const { status, body } = await resendOrderConfirmation(orderId,
            order => user.role === 'admin' || String(order.user_id) === String(user.id));
        return NextResponse.json({ message: body.message }, { status });
    } catch (error) {
        console.error('Error resending email:', error);
        return NextResponse.json({ message: 'Error resending email', error: error.message }, { status: 500 });
    }
}
