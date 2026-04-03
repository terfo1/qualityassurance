# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin/TC-DASH-dashboard.spec.ts >> Admin Dashboard — GET /api/admin/dashboard >> TC-DASH-002 | low_stock count = products where stock ≤ 5
- Location: admin/TC-DASH-dashboard.spec.ts:38:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: []
```

# Test source

```ts
  1  | /**
  2  |  * Test Suite : Admin Dashboard Metrics
  3  |  * Endpoint   : GET /api/admin/dashboard
  4  |  * Coverage   : TC-DASH-001 … TC-DASH-004
  5  |  *
  6  |  * Positive: correct product count; correct low_stock count (threshold ≤ 5); revenue sum
  7  |  * Negative: customer token → 403
  8  |  *
  9  |  * Note: exact numeric assertions compare against known seeded data. If products have
  10 |  * been created/deleted by other tests, counts may differ — run this suite in isolation
  11 |  * or after a DB reset for deterministic count assertions.
  12 |  */
  13 | import { test, expect } from "@playwright/test";
  14 | import { ApiClient } from "../helpers/api-client";
  15 | 
  16 | test.describe("Admin Dashboard — GET /api/admin/dashboard", () => {
  17 | 
  18 |   test("TC-DASH-001 | dashboard returns required metric fields with correct types", async ({ request }) => {
  19 |     const client = new ApiClient(request);
  20 |     const token  = await client.adminToken();
  21 | 
  22 |     const res  = await client.get("/api/admin/dashboard", token);
  23 |     expect(res.status()).toBe(200);
  24 |     const body = await res.json();
  25 | 
  26 |     // All top-level metric fields must be present
  27 |     expect(typeof body.products).toBe("number");
  28 |     expect(typeof body.orders).toBe("number");
  29 |     expect(typeof body.revenue).toBe("number");
  30 |     expect(typeof body.low_stock).toBe("number");
  31 |     // Non-negative sanity checks
  32 |     expect(body.products).toBeGreaterThanOrEqual(0);
  33 |     expect(body.orders).toBeGreaterThanOrEqual(0);
  34 |     expect(body.revenue).toBeGreaterThanOrEqual(0);
  35 |     expect(body.low_stock).toBeGreaterThanOrEqual(0);
  36 |   });
  37 | 
  38 |   test("TC-DASH-002 | low_stock count = products where stock ≤ 5", async ({ request }) => {
  39 |     const client   = new ApiClient(request);
  40 |     const adminTok = await client.adminToken();
  41 | 
  42 |     // Fetch the full product list and count low-stock items ourselves
  43 |     const prodRes  = await client.get("/api/products");
  44 |     const products = await prodRes.json();
  45 |     const expectedLowStock = products.filter((p: { stock: number }) => p.stock <= 5).length;
  46 | 
  47 |     const dashRes = await client.get("/api/admin/dashboard", adminTok);
  48 |     const dash    = await dashRes.json();
  49 | 
  50 |     // Dashboard low_stock must match our computed count
> 51 |     expect(dash.low_stock).toBe(expectedLowStock);
     |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  52 |   });
  53 | 
  54 |   test("TC-DASH-003 | revenue ≥ 0 and is a finite number (not NaN)", async ({ request }) => {
  55 |     const client = new ApiClient(request);
  56 |     const token  = await client.adminToken();
  57 | 
  58 |     const res  = await client.get("/api/admin/dashboard", token);
  59 |     const dash = await res.json();
  60 | 
  61 |     expect(isFinite(dash.revenue)).toBe(true);
  62 |     expect(dash.revenue).toBeGreaterThanOrEqual(0);
  63 |   });
  64 | 
  65 |   test("TC-DASH-004 | customer token → 403 (admin-only endpoint)", async ({ request }) => {
  66 |     const client      = new ApiClient(request);
  67 |     const customerTok = await client.demoToken(); // role = customer
  68 | 
  69 |     const res = await client.get("/api/admin/dashboard", customerTok);
  70 |     expect(res.status()).toBe(403);
  71 |   });
  72 | });
  73 | 
```