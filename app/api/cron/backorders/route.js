import { NextResponse } from 'next/server';
import { checkLatePreorders } from '@/lib/backorders';

// Daily (vercel.json): pre-orders past their promised date get a new date, the
// customer an apology with a refund option, and the team one summary email.
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; without the secret set, nothing runs.
export async function GET(request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const result = await checkLatePreorders();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Late pre-order check failed:', error);
        return NextResponse.json({ message: 'Late pre-order check failed', error: error.message }, { status: 500 });
    }
}
