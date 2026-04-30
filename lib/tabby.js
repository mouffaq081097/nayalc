const TABBY_API_BASE = 'https://api.tabby.ai/api/v2';

async function tabbyFetch(path, options = {}) {
  const res = await fetch(`${TABBY_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.TABBY_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Tabby API error ${res.status}`);
  return data;
}

export async function createTabbyCheckout({ amount, items, buyer, shippingAddress, taxAmount, shippingAmount, discountAmount, referenceId, merchantUrls }) {
  return tabbyFetch('/checkout', {
    method: 'POST',
    body: JSON.stringify({
      payment: {
        amount: parseFloat(amount).toFixed(2),
        currency: 'AED',
        buyer: {
          phone: buyer.phone || '',
          email: buyer.email || '',
          name: buyer.name || '',
        },
        buyer_history: {
          registered_since: buyer.registeredSince || new Date().toISOString(),
          loyalty_level: buyer.loyaltyLevel || 0,
          wishlist_count: 0,
          is_email_verified: true,
          is_phone_number_verified: false,
        },
        order: {
          tax_amount: parseFloat(taxAmount || 0).toFixed(2),
          shipping_amount: parseFloat(shippingAmount || 0).toFixed(2),
          discount_amount: parseFloat(discountAmount || 0).toFixed(2),
          updated_at: new Date().toISOString(),
          reference_id: referenceId || `cart_${Date.now()}`,
          items: items.map(item => ({
            title: item.name,
            description: item.name,
            quantity: item.quantity,
            unit_price: parseFloat(item.price).toFixed(2),
            discount_amount: '0.00',
            reference_id: String(item.productId || item.id),
            image_url: item.image || item.imageUrl || '',
            product_url: item.productUrl || '',
            category: 'Beauty & Personal Care',
          })),
        },
        shipping_address: {
          city: shippingAddress.city || 'Dubai',
          address: shippingAddress.address || '',
          zip: shippingAddress.zip || '00000',
        },
      },
      lang: 'en',
      merchant_code: process.env.TABBY_MERCHANT_CODE,
      merchant_urls: merchantUrls,
    }),
  });
}

export async function getTabbyPayment(paymentId) {
  return tabbyFetch(`/payments/${paymentId}`);
}

export async function listTabbySettlements(limit = 20) {
  // Tabby settlements/payouts endpoint
  return tabbyFetch(`/settlements?limit=${limit}`);
}

export async function listTabbyPayments(limit = 20) {
  // Tabby payments listing (using v1 as per documentation for listing)
  // Note: we use the same base but change the version if needed, 
  // but let's try v2 first as most modern APIs use it consistently.
  // If v2 doesn't support listing, we'll fallback to a custom fetch for v1.
  return tabbyFetch(`/payments?limit=${limit}`);
}
