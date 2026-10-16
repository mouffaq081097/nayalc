import { handle, jsonBody, requireAnyRole, routeId } from '@/lib/erp/access';
import { pageRoles } from '@/lib/erp/roles';
import { actOnReceipt, deleteReceipt, getReceipt, updateReceipt } from '@/lib/erp/receipts';

export async function GET(request, { params }) {
  return handle(async (access) => {
    requireAnyRole(access, pageRoles('/admin/purchasing/receipts'));
    return { access, receipt: await getReceipt(await routeId(params)) };
  });
}

// { section: 'receipt', ... } (storekeeper, draft) or { section: 'costing', exchange_rate, supplier_invoice, charges } (finance)
export async function PUT(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ receipt: await updateReceipt(access, await routeId(params), body) }), { failure: 'The receipt could not be saved.' });
}

// { action: post | finalize }
export async function POST(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => actOnReceipt(access, await routeId(params), body));
}

export async function DELETE(request, { params }) {
  return handle(async (access) => deleteReceipt(access, await routeId(params)));
}
