import { handle, jsonBody, requireAnyRole } from '@/lib/erp/access';
import { pageRoles } from '@/lib/erp/roles';
import { listSuppliers, saveSupplier } from '@/lib/erp/catalog';

export async function GET() {
  return handle(async (access) => {
    requireAnyRole(access, pageRoles('/admin/purchasing/suppliers'));
    return { access, suppliers: await listSuppliers() };
  });
}

export async function POST(request) {
  const body = await jsonBody(request);
  return handle(async (access) => ({ supplier: await saveSupplier(access, null, body) }), { failure: 'The supplier could not be saved.' });
}
