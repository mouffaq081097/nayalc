import { handle, jsonBody } from '@/lib/erp/access';
import { createRequisition, listRequisitions } from '@/lib/erp/requisitions';

export async function GET() {
  return handle(async (access) => ({ access, requisitions: await listRequisitions(access) }));
}

// { supplier_id?, needed_by?, notes?, items: [{ product_id, quantity, note? }], submit? }
export async function POST(request) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ requisition: await createRequisition(access, body) }), { failure: 'The requisition could not be saved.' });
}
