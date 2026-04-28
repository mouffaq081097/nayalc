import { NextResponse } from 'next/server';
import { sendPayoutRequestNotificationEmail } from '@/lib/mail';

export async function POST(request) {
    try {
        const { payoutId, amount, currency } = await request.json();

        if (!payoutId || !amount || !currency) {
            return NextResponse.json({ message: 'Payout ID, amount and currency are required' }, { status: 400 });
        }

        // Send email notifications
        const recipients = ['waeldal@gmail.com', 'mouffaq.dalloul@gmail.com'];
        await sendPayoutRequestNotificationEmail(recipients, parseFloat(amount), currency, payoutId);

        return NextResponse.json({ message: 'Email notification sent successfully' });
    } catch (error) {
        console.error('Error sending payout email:', error);
        return NextResponse.json({ message: 'Error sending email', error: error.message }, { status: 500 });
    }
}
