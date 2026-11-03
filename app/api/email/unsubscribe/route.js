import { checkUnsubscribeToken, turnOffCartReminders } from '@/lib/cartReminders';
import { escapeHtml } from '@/lib/email/theme';

// "Stop bag reminders" from a cart reminder email (lib/cartReminders.js).
// GET shows a confirm button (mail scanners open links, so a GET never unsubscribes);
// POST turns reminders off — also what mail apps send for one-click unsubscribe.

const page = (title, body) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${escapeHtml(title)} · Naya Lumière Cosmetics</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f6f5f2;color:#111114}
main{max-width:440px;margin:12vh auto;padding:32px 24px;background:#fff;text-align:center}
h1{font-size:20px;letter-spacing:.04em;text-transform:uppercase;margin:0 0 12px}p{color:#5a5a64;line-height:1.6;margin:0 0 20px}
button,a.btn{display:inline-block;background:#111114;color:#fff;border:0;border-radius:999px;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;text-decoration:none}
a{color:#111114}</style></head><body><main>${body}</main></body></html>`, {
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
});

const invalid = () => page('Link not valid', '<h1>Link not valid</h1><p>This link is incomplete or out of date. Reply to any of our emails and we’ll stop the reminders for you.</p><a class="btn" href="/">Go to the shop</a>');

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const u = params.get('u');
  const t = params.get('t');
  if (!checkUnsubscribeToken(u, t)) return invalid();
  return page('Stop bag reminders', `<h1>Stop bag reminders?</h1>
    <p>We’ll stop emailing you about items left in your bag. Order emails still arrive as usual.</p>
    <form method="post" action="/api/email/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}"><button type="submit">Stop reminders</button></form>`);
}

export async function POST(request) {
  const params = new URL(request.url).searchParams;
  const u = params.get('u');
  if (!checkUnsubscribeToken(u, params.get('t'))) return invalid();
  try {
    await turnOffCartReminders(u);
  } catch (error) {
    console.error('Unsubscribe failed:', error);
    return page('Something went wrong', '<h1>Something went wrong</h1><p>Please try again in a moment.</p>');
  }
  return page('Reminders stopped', '<h1>Done</h1><p>You won’t get bag reminders any more. Order emails still arrive as usual.</p><a class="btn" href="/">Back to the shop</a>');
}
