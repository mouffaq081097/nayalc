import { handle, jsonBody, requireAnyRole } from '@/lib/erp/access';
import { pageRoles } from '@/lib/erp/roles';
import { createPurchaseOrderFromBody, listPurchaseOrders } from '@/lib/erp/purchaseOrders';

export async function GET() {
  return handle(async (access) => {
    requireAnyRole(access, pageRoles('/admin/purchasing/orders'));
    return { access, orders: await listPurchaseOrders() };
  });
}

export async function POST(request) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ order: await createPurchaseOrderFromBody(access, body) }), { failure: 'The purchase order could not be saved.' });
}
