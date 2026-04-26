import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);

    // Verify the requester is an admin
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized. Only admins can modify roles.' }, { status: 403 });
    }

    const userId = params.id;
    const client = await db.connect();

    try {
        const body = await request.json();
        const { is_admin } = body;

        if (typeof is_admin !== 'boolean') {
            return NextResponse.json({ error: 'Invalid payload. is_admin must be a boolean.' }, { status: 400 });
        }

        // Prevent admin from removing their own privileges accidentally
        if (session.user.id == userId && !is_admin) {
             return NextResponse.json({ error: 'You cannot revoke your own admin access.' }, { status: 400 });
        }

        const result = await client.query(
            'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, is_admin',
            [is_admin, userId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Role updated successfully', user: result.rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
