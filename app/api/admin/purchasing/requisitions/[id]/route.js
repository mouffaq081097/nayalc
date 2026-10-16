import { handle, jsonBody, routeId } from '@/lib/erp/access';
import { actOnRequisition, deleteRequisition, getVisibleRequisition, updateRequisition } from '@/lib/erp/requisitions';

export async function GET(request, { params }) {
  return handle(async (access) => ({ access, requisition: await getVisibleRequisition(access, await routeId(params)) }));
}

export async function PUT(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ requisition: await updateRequisition(access, await routeId(params), body) }), { failure: 'The requisition could not be saved.' });
}

// { action: submit | withdraw | approve | reject | reopen | cancel | convert, note?, supplier_id? }
export async function POST(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => actOnRequisition(access, await routeId(params), body));
}

export async function DELETE(request, { params }) {
  return handle(async (access) => deleteRequisition(access, await routeId(params)));
}
