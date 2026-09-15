import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Suspending only blocks sign-in (see lib/auth.js). The customer's orders, addresses
// and history are kept, so reinstating restores the account exactly as it was.
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { id: userId } = await params;

    if (String(session.user.id) === String(userId)) {
        return NextResponse.json({ message: "You can't suspend your own account." }, { status: 400 });
    }

    try {
        const { is_suspended } = await request.json();
        if (typeof is_suspended !== 'boolean') {
            return NextResponse.json({ message: 'is_suspended must be true or false.' }, { status: 400 });
        }

        const { rowCount } = await db.query('UPDATE users SET is_suspended = $1 WHERE id = $2', [is_suspended, userId]);
        if (rowCount === 0) {
            return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
        }

        return NextResponse.json({
            message: is_suspended ? 'Account suspended. They can no longer sign in.' : 'Account reinstated.',
            user: { id: Number(userId), is_suspended },
        });
    } catch (error) {
        console.error('Suspend user error:', error);
        return NextResponse.json({ message: 'The account could not be updated.' }, { status: 500 });
    }
}
