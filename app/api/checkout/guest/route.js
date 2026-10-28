import { NextResponse } from 'next/server';
import { startGuestCheckout, GuestCheckoutError } from '@/lib/guestCheckout';
import { rateLimit, clientIp } from '@/lib/rateLimit';

// Checkout without signing in, step 1: the guest's email, name, phone and
// address are filed under an account (lib/guestCheckout.js) and a short-lived
// checkout token comes back for paying and placing the order.
export async function POST(request) {
    const byIp = rateLimit(`guest-checkout:ip:${clientIp(request)}`, { limit: 20, windowMs: 10 * 60_000 });
    if (!byIp.ok) {
        return NextResponse.json({ message: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
    }
    try {
        const body = await request.json().catch(() => ({}));
        const byEmail = rateLimit(`guest-checkout:email:${String(body.email || '').trim().toLowerCase()}`, { limit: 8, windowMs: 10 * 60_000 });
        if (!byEmail.ok) {
            return NextResponse.json({ message: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 });
        }
        const { token } = await startGuestCheckout(body);
        // Whether the email already had an account isn't said, so this can't be used to look people up
        return NextResponse.json({ token });
    } catch (error) {
        if (error instanceof GuestCheckoutError) {
            return NextResponse.json({ message: error.message, field: error.field }, { status: 400 });
        }
        console.error('Guest checkout failed:', error);
        return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
