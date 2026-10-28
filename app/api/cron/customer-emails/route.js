import { NextResponse } from 'next/server';
import { sendDueReviewRequests } from '@/lib/reviewRequests';
import { notifyStockAlerts } from '@/lib/stockAlerts';

// Daily (vercel.json) customer emails:
// - orders delivered 5–21 days ago get one email asking to rate what was bought;
// - anyone still waiting on "Email me when it's back" for a product that's in
//   stock again gets their email (allocateStock() normally sends it straight away).
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; without the secret set, nothing runs.
export async function GET(request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const result = {};
    try {
        result.reviewRequests = await sendDueReviewRequests();
    } catch (error) {
        console.error('Review request run failed:', error);
        result.reviewRequests = { error: error.message };
    }
    try {
        result.stockAlerts = await notifyStockAlerts();
    } catch (error) {
        console.error('Back-in-stock sweep failed:', error);
        result.stockAlerts = { error: error.message };
    }
    const failed = result.reviewRequests?.error && result.stockAlerts?.error;
    return NextResponse.json(result, { status: failed ? 500 : 200 });
}
