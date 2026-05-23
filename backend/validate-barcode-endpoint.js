/**
 * Bloc 5 — Test GET /api/v1/products/barcode/{barcode} → ApiResponse<ProductDto>
 *
 * Usage: node validate-barcode-endpoint.js [baseUrl]
 * Default: http://localhost:8083
 */

const BASE_URL = process.argv[2] || 'http://localhost:8083';

async function login() {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.token || data.accessToken;
}

async function ensureProductWithBarcode(token) {
  const barcode = '6194001234567';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const lookup = await fetch(`${BASE_URL}/api/v1/products/barcode/${barcode}`, { headers });
  if (lookup.ok) {
    return { barcode, created: false };
  }

  const createRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Riz 5kg Test',
      barcode,
      purchasePrice: 4000,
      sellingPrice: 5000,
      stockQuantity: 15,
      minStockLevel: 5,
      isActive: true,
    }),
  });
  if (!createRes.ok && createRes.status !== 409) {
    console.warn('Could not create seed product:', createRes.status, await createRes.text());
  }
  return { barcode, created: true };
}

async function main() {
  console.log('🔍 Base URL:', BASE_URL);
  const token = await login();
  console.log('✅ JWT obtenu');

  const { barcode } = await ensureProductWithBarcode(token);

  const res = await fetch(`${BASE_URL}/api/v1/products/barcode/${barcode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await res.json();
  console.log('📦 Status:', res.status);
  console.log('📄 Body:', JSON.stringify(body, null, 2));

  if (!res.ok) {
    process.exit(1);
  }
  if (body.success !== true || !body.data || body.data.barcode !== barcode) {
    console.error('❌ Réponse invalide: attendu ApiResponse<ProductDto> avec success=true');
    process.exit(1);
  }

  console.log('✅ GET /api/v1/products/barcode/{barcode} OK');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
