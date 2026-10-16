import { handle, PurchasingError } from '@/lib/erp/access';
import { purchasingOverview } from '@/lib/erp/team';

export async function GET() {
  return handle(async (access) => {
    // Stock value and shortfalls: full access only. Role-limited members land on their own pages.
    if (!access.full) throw new PurchasingError("You don't have access to this page.", 403);
    return { access, overview: await purchasingOverview(access) };
  });
}
