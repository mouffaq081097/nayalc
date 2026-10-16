import { handle, jsonBody, requireAnyRole, routeId } from '@/lib/erp/access';
import { pageRoles } from '@/lib/erp/roles';
import { actOnPurchaseOrder, deletePurchaseOrder, getPurchaseOrder, updatePurchaseOrder } from '@/lib/erp/purchaseOrders';

export async function GET(request, { params }) {
  return handle(async (access) => {
    requireAnyRole(access, pageRoles('/admin/purchasing/orders'));
    return { access, order: await getPurchaseOrder(await routeId(params)) };
  });
}

export async function PUT(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ order: await updatePurchaseOrder(access, await routeId(params), body) }), { failure: 'The purchase order could not be saved.' });
}

// { action: send | cancel | close | receive }
export async function POST(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => actOnPurchaseOrder(access, await routeId(params), body));
}

export async function DELETE(request, { params }) {
  return handle(async (access) => deletePurchaseOrder(access, await routeId(params)));
}
