
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
    try {
        console.log('Testing Stripe connection...');
        console.log('Key exists:', !!process.env.STRIPE_SECRET_KEY);
        const balance = await stripe.balance.retrieve();
        console.log('Success! Balance retrieved:', JSON.stringify(balance, null, 2));
    } catch (error) {
        console.error('Stripe Error:', error.message);
        if (error.raw) {
            console.error('Raw Error:', JSON.stringify(error.raw, null, 2));
        }
    }
}

testStripe();
