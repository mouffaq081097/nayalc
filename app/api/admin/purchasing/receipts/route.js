import { handle, requireAnyRole } from '@/lib/erp/access';
import { pageRoles } from '@/lib/erp/roles';
import { listReceipts } from '@/lib/erp/receipts';

export async function GET() {
  return handle(async (access) => {
    requireAnyRole(access, pageRoles('/admin/purchasing/receipts'));
    return { access, receipts: await listReceipts() };
  });
}
