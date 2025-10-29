import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { Buffer } from 'buffer';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@') || !email.includes('.')) {
            return NextResponse.json({ message: 'Invalid email address.' }, { status: 400 });
        }

        const pythonScriptPath = './send_email.py';
        const subject = 'Welcome to the Lumière Club - nayalc.com';
        
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
        .header { background-color: #007bff; color: white; padding: 25px 20px; text-align: center; }
        .header h2 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .content p { margin-bottom: 15px; }
        .footer { text-align: center; font-size: 0.85em; color: #777; margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-top: 1px solid #e0e0e0; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to the Lumière Club!</h2>
        </div>
        <div class="content">
            <p>Dear Subscriber,</p>
            <p>Thank you for joining the nayalc.com Lumière Club! You're now part of an exclusive community that receives:</p>
            <ul>
                <li>Exclusive 20% off offers</li>
                <li>New arrivals first access</li>
                <li>Personalized beauty tips</li>
            </ul>
            <p>Get ready for a world of beauty delivered straight to your inbox.</p>
            <p>If you have any questions, feel free to contact us.</p>
            <a href="#" class="button">Visit nayalc.com</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} nayalc.com. All rights reserved.</p>
            <p><a href="#" style="color: #007bff;">Privacy Policy</a> | <a href="#" style="color: #007bff;">Contact Us</a></p>
        </div>
    </div>
</body>
</html>
`;

        const encodedHtmlBody = Buffer.from(htmlBody).toString('base64');
        const command = `python ${pythonScriptPath} "${email}" "${subject}" "${encodedHtmlBody}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error (subscription email): ${error}`);
                return;
            }
            console.log(`stdout (subscription email): ${stdout}`);
            console.error(`stderr (subscription email): ${stderr}`);
        });

        return NextResponse.json({ message: 'Subscription successful! Please check your email for confirmation.' }, { status: 200 });

    } catch (error) {
        console.error('Subscription API error:', error);
        return NextResponse.json({ message: 'An error occurred during subscription.', error: error.message }, { status: 500 });
    }
}
