import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendMarketingEmail, sendAbandonedCartEmail } from '@/lib/mail';

export async function POST(request) {
    try {
        const { audience, subject, content, isTest, testEmail, selectedEmails } = await request.json();

        if (isTest) {
            if (!testEmail) return NextResponse.json({ message: 'Test email is required' }, { status: 400 });
            await sendMarketingEmail([testEmail], `[TEST] ${subject}`, content);
            return NextResponse.json({ message: 'Test email sent successfully' });
        }

        let recipients = [];

        if (audience === 'all') {
            const { rows } = await db.query('SELECT email, first_name FROM users');
            recipients = rows;
        } else if (audience === 'selected_users') {
            if (!selectedEmails || selectedEmails.length === 0) {
                return NextResponse.json({ message: 'No users selected.' }, { status: 400 });
            }
            recipients = selectedEmails.map(email => ({ email }));
        } else if (audience === 'abandoned_cart') {
            const { rows } = await db.query(`
                SELECT DISTINCT u.email, u.first_name, u.id
                FROM users u
                JOIN user_carts uc ON u.id = uc.user_id
            `);
            let sentCount = 0;
            for (const user of rows) {
                const { rows: cartItems } = await db.query(`
                    SELECT p.name, p.price, p.vendor as brand
                    FROM user_carts uc
                    JOIN products p ON uc.product_id = p.id
                    WHERE uc.user_id = $1
                `, [user.id]);
                if (cartItems.length > 0) {
                    await sendAbandonedCartEmail(user.email, user.first_name, cartItems);
                    sentCount++;
                }
            }
            return NextResponse.json({ message: `Abandoned cart campaign sent to ${sentCount} user(s).` });
        } else if (audience === 'subscribers') {
            const { rows } = await db.query('SELECT email, first_name FROM users');
            recipients = rows;
        }

        if (recipients.length === 0) {
            return NextResponse.json({ message: 'No recipients found for the selected audience.' }, { status: 404 });
        }

        const emailList = recipients.map(r => r.email);
        await sendMarketingEmail(emailList, subject, content);
        return NextResponse.json({ message: `Campaign launched to ${emailList.length} recipient(s).` });

    } catch (error) {
        console.error('Campaign Error:', error);
        return NextResponse.json({ message: 'Failed to launch campaign', error: error.message }, { status: 500 });
    }
}
