import { handle, jsonBody, routeId } from '@/lib/erp/access';
import { saveSupplier } from '@/lib/erp/catalog';

export async function PUT(request, { params }) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ supplier: await saveSupplier(access, await routeId(params), body) }), { failure: 'The supplier could not be saved.' });
}
