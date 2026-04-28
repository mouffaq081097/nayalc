import { NextResponse } from 'next/server';
import { sendTransactionNotificationEmail } from '@/lib/mail';

export async function POST(request) {
    try {
        const { txDetails } = await request.json();

        if (!txDetails || !txDetails.id) {
            return NextResponse.json({ message: 'Transaction details are required' }, { status: 400 });
        }

        // Send email notifications
        const recipients = ['waeldal@gmail.com', 'mouffaq.dalloul@gmail.com'];
        await sendTransactionNotificationEmail(recipients, txDetails);

        return NextResponse.json({ message: 'Transaction email notification sent successfully' });
    } catch (error) {
        console.error('Error sending transaction email:', error);
        return NextResponse.json({ message: 'Error sending email', error: error.message }, { status: 500 });
    }
}
