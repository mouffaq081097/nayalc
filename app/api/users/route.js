import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    const client = await db.connect();
    try {
        const sql = `
            SELECT 
                id, 
                first_name, 
                last_name, 
                email, 
                phone_number 
            FROM users 
            ORDER BY created_at DESC;
        `;
        const { rows } = await client.query(sql);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Error fetching users from database', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
