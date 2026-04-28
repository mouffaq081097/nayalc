import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendPayoutRequestNotificationEmail } from '@/lib/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
    try {
        const balance = await stripe.balance.retrieve();
        
        // Fetch recent balance transactions for more context
        const transactions = await stripe.balanceTransactions.list({
            limit: 10,
            expand: ['data.source', 'data.source.payment_method', 'data.source.customer']
        });

        // Fetch payouts to show history
        const payouts = await stripe.payouts.list({
            limit: 5
        });

        return NextResponse.json({
            balance,
            transactions: transactions.data,
            payouts: payouts.data
        });
    } catch (error) {
        console.error('Error fetching Stripe balance:', error);
        return NextResponse.json({ message: 'Error fetching Stripe data', error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { amount, currency } = await request.json();

        if (!amount || !currency) {
            return NextResponse.json({ message: 'Amount and currency are required' }, { status: 400 });
        }

        // Create a payout
        const payout = await stripe.payouts.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency: currency.toLowerCase(),
        });

        // Send email notifications
        try {
            const recipients = ['waeldal@gmail.com', 'mouffaq.dalloul@gmail.com'];
            await sendPayoutRequestNotificationEmail(recipients, parseFloat(amount), currency, payout.id);
        } catch (emailError) {
            console.error('Failed to send payout notification emails:', emailError);
            // We don't fail the whole request if only emails fail
        }

        return NextResponse.json({ message: 'Payout requested successfully', payout });
    } catch (error) {
        console.error('Error creating Stripe payout:', error);
        return NextResponse.json({ message: 'Error creating payout', error: error.message }, { status: 500 });
    }
}
