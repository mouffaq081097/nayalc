import { NextResponse } from 'next/server';
import { listTabbyPayments, listTabbySettlements } from '@/lib/tabby';

export async function GET() {
    try {
        let paymentsData = {};
        let settlementsData = {};

        try {
            paymentsData = await listTabbyPayments(20);
        } catch (paymentError) {
            console.error('Error fetching Tabby payments:', paymentError.message);
            // Continue without payments data
        }

        try {
            settlementsData = await listTabbySettlements(10);
        } catch (settlementError) {
            console.error('Error fetching Tabby settlements:', settlementError.message);
            // Continue without settlements data
        }
        
        const balance = {
            available: [
                {
                    amount: 0, // Tabby doesn't expose this easily via API
                    currency: 'AED'
                }
            ],
            pending: [
                {
                    amount: 0,
                    currency: 'AED'
                }
            ]
        };

        const payments = paymentsData.payments || [];
        const settlements = settlementsData.payouts || settlementsData.settlements || [];

        return NextResponse.json({
            balance,
            transactions: payments,
            payouts: settlements,
            isTabby: true
        });
    } catch (error) {
        console.error('Error fetching Tabby balance:', error);
        return NextResponse.json({ message: 'Error fetching Tabby data', error: error.message }, { status: 500 });
    }
}

export async function POST() {
    // Tabby payouts are typically automatic.
    return NextResponse.json({ 
        message: 'Tabby payouts are handled automatically by Tabby based on your agreement.' 
    }, { status: 400 });
}
