import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);

    // Verify the requester is an admin
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Only admins can change admin access.' }, { status: 403 });
    }

    const { id: userId } = await params;

    try {
        const { is_admin } = await request.json();

        if (typeof is_admin !== 'boolean') {
            return NextResponse.json({ message: 'is_admin must be true or false.' }, { status: 400 });
        }

        // Prevent admins from removing their own access by accident
        if (String(session.user.id) === String(userId) && !is_admin) {
            return NextResponse.json({ message: "You can't remove your own admin access." }, { status: 400 });
        }

        const result = await db.query(
            'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, is_admin',
            [is_admin, userId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ message: 'Customer not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Role updated successfully', user: result.rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json({ message: 'Admin access could not be changed.' }, { status: 500 });
    }
}
