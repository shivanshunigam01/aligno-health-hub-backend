/**
 * Set prices on all products via the live Aligno API (admin auth required).
 *
 * Usage:
 *   node scripts/set-all-product-prices-api.js
 *   API_URL=https://api.myaligno.com/api/v1 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/set-all-product-prices-api.js
 */
const API_URL = process.env.API_URL || 'https://api.myaligno.com/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alignohealthhub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const PRICE = Number(process.env.PRICE || 100);

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${method} ${path} (${res.status})`);
  }
  return json.data ?? json;
}

async function main() {
  console.log(`Logging in to ${API_URL}...`);
  const auth = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = auth.accessToken;
  if (!token) throw new Error('Login succeeded but no access token returned');

  console.log('Fetching products...');
  const products = await api('/products?limit=500', { token });
  if (!Array.isArray(products) || products.length === 0) {
    console.log('No products found.');
    return;
  }

  let updated = 0;
  for (const product of products) {
    const id = product._id || product.id;
    if (!id) continue;
    await api(`/products/${id}`, {
      method: 'PATCH',
      token,
      body: { mrp: PRICE, sellingPrice: PRICE, discount: 0 },
    });
    updated += 1;
    console.log(`✓ ${product.name} → ₹${PRICE}`);
  }

  console.log(`\nDone. Updated ${updated} product(s) to ₹${PRICE}.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
