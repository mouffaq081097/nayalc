import { NextResponse } from 'next/server';
import { handle, requireAnyRole, routeId } from '@/lib/erp/access';
import { pageRoles } from '@/lib/erp/roles';
import { getPurchaseOrder } from '@/lib/erp/purchaseOrders';
import { generatePurchaseOrderPdf } from '@/lib/erp/purchaseOrderPdf';

// The PO as a PDF for the supplier
export async function GET(request, { params }) {
  return handle(async (access) => {
    requireAnyRole(access, pageRoles('/admin/purchasing/orders'));
    const order = await getPurchaseOrder(await routeId(params));
    const pdf = await generatePurchaseOrderPdf(order);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${order.number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  }, { failure: 'The PDF could not be generated.' });
}
