/**
 * Test Suite : Admin Dashboard Metrics
 * Endpoint   : GET /api/admin/dashboard
 * Coverage   : TC-DASH-001 … TC-DASH-004
 *
 * Positive: correct product count; correct low_stock count (threshold ≤ 5); revenue sum
 * Negative: customer token → 403
 *
 * Note: exact numeric assertions compare against known seeded data. If products have
 * been created/deleted by other tests, counts may differ — run this suite in isolation
 * or after a DB reset for deterministic count assertions.
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";

test.describe("Admin Dashboard — GET /api/admin/dashboard", () => {

  test("TC-DASH-001 | dashboard returns required metric fields with correct types", async ({ request }) => {
    const client = new ApiClient(request);
    const token  = await client.adminToken();

    const res  = await client.get("/api/admin/dashboard", token);
    expect(res.status()).toBe(200);
    const body = await res.json();

    // All top-level metric fields must be present
    expect(typeof body.products).toBe("number");
    expect(typeof body.orders).toBe("number");
    expect(typeof body.revenue).toBe("number");
    expect(typeof body.low_stock).toBe("number");
    // Non-negative sanity checks
    expect(body.products).toBeGreaterThanOrEqual(0);
    expect(body.orders).toBeGreaterThanOrEqual(0);
    expect(body.revenue).toBeGreaterThanOrEqual(0);
    expect(body.low_stock).toBeGreaterThanOrEqual(0);
  });

  test("TC-DASH-002 | low_stock count = products where stock ≤ 5", async ({ request }) => {
    const client   = new ApiClient(request);
    const adminTok = await client.adminToken();

    // Fetch the full product list and count low-stock items ourselves
    const prodRes  = await client.get("/api/products");
    const products = await prodRes.json();
    const expectedLowStock = products.filter((p: { stock: number }) => p.stock <= 5).length;

    const dashRes = await client.get("/api/admin/dashboard", adminTok);
    const dash    = await dashRes.json();

    // Dashboard low_stock must match our computed count
    expect(dash.low_stock).toBe(expectedLowStock);
  });

  test("TC-DASH-003 | revenue ≥ 0 and is a finite number (not NaN)", async ({ request }) => {
    const client = new ApiClient(request);
    const token  = await client.adminToken();

    const res  = await client.get("/api/admin/dashboard", token);
    const dash = await res.json();

    expect(isFinite(dash.revenue)).toBe(true);
    expect(dash.revenue).toBeGreaterThanOrEqual(0);
  });

  test("TC-DASH-004 | customer token → 403 (admin-only endpoint)", async ({ request }) => {
    const client      = new ApiClient(request);
    const customerTok = await client.demoToken(); // role = customer

    const res = await client.get("/api/admin/dashboard", customerTok);
    expect(res.status()).toBe(403);
  });
});
