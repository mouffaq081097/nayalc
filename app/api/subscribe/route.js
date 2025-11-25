import { NextResponse } from 'next/server';
import { sendSubscriptionConfirmationEmail } from '@/lib/mail';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@') || !email.includes('.')) {
            return NextResponse.json({ message: 'Invalid email address.' }, { status: 400 });
        }

        const result = await sendSubscriptionConfirmationEmail(email);

        if (result.success) {
            return NextResponse.json({ message: 'Subscription successful! Please check your email for confirmation.' }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'An error occurred during subscription.' }, { status: 500 });
        }

    } catch (error) {
        console.error('Subscription API error:', error);
        return NextResponse.json({ message: 'An error occurred during subscription.', error: error.message }, { status: 500 });
    }
}
