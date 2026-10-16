import { handle, jsonBody, requireAnyRole } from '@/lib/erp/access';
import { hasRole } from '@/lib/erp/roles';
import { listPurchasingProducts, productCostHistory, setProductCost } from '@/lib/erp/catalog';

// GET                 every product with stock, owed, on order and cost
// GET ?history=<id>   one product's cost ledger
export async function GET(request) {
  const history = Number(new URL(request.url).searchParams.get('history'));
  return handle(async (access) => {
    // Costs are for finance and buyers; everyone else gets stock figures only
    const seesCost = hasRole(access, 'finance') || hasRole(access, 'buyer');
    if (history > 0) {
      requireAnyRole(access, ['finance', 'buyer']);
      return { history: await productCostHistory(history) };
    }
    const products = await listPurchasingProducts();
    return { access, products: seesCost ? products : products.map(p => ({ ...p, average_cost: undefined, last_cost: undefined })) };
  });
}

// PUT { productId, average_cost, note } — set a product's cost by hand (finance)
export async function PUT(request) {
  const body = await jsonBody(request);
  return handle(async (access) => setProductCost(access, body), { failure: 'The cost could not be saved.' });
}
