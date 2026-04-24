/**
 * Test Suite : Cross-Cutting Input Validation & Security
 * Coverage   : TC-VAL-001 … TC-VAL-005
 *
 * These tests verify that common attack vectors and boundary conditions are
 * handled safely at the API layer (FastAPI + Pydantic + SQLAlchemy ORM).
 *
 * Positive: SQL injection via search query → safe empty result (ORM parameterises)
 *           XSS payload in product name → stored as literal string, returned as JSON
 * Negative: string exceeding max_length → 422; non-integer path param → 422;
 *           negative ID in path → 404 or 422
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";

test.describe("Input Validation — cross-cutting security checks", () => {

  test("TC-VAL-001 | SQL injection in search query → safe response (no DB error, no data leak)", async ({ request }) => {
    const client  = new ApiClient(request);
    // Classic SQL injection attempt via query string
    const payload = encodeURIComponent("'; DROP TABLE products;--");

    const res = await client.get(`/api/products?q=${payload}`);
    // SQLAlchemy parameterises queries — must return 200 with empty/normal results
    expect(res.status()).toBe(200);
    const products = await res.json();
    // Result must be an array (possibly empty) — never a DB error
    expect(Array.isArray(products)).toBe(true);
  });

  test("TC-VAL-002 | XSS payload in product name → stored as literal string, not executed", async ({ request }) => {
    const client   = new ApiClient(request);
    const adminTok = await client.adminToken();
    const xssName  = "<script>alert('xss')</script>";

    const res  = await client.post("/api/admin/products", {
      name:        xssName,
      category:    "Security",
      price:       1.0,
      stock:       1,
      description: "XSS test product for security validation.",
      image:       "/img/xss.jpg",
    }, adminTok);

    // API is JSON — script tags must be stored/returned as literals, not executed
    if (res.ok()) {
      const prod = await res.json();
      // The name must come back as a plain string, not interpreted
      expect(prod.name).toBe(xssName);
      // Cleanup
      await client.deleteProduct(prod.id, adminTok);
    } else {
      // If the API rejects XSS in name (input sanitisation), that's also acceptable
      expect([400, 422]).toContain(res.status());
    }
  });

  test("TC-VAL-003 | name field exceeding max_length=80 → 422 (DTO enforcement)", async ({ request }) => {
    const client   = new ApiClient(request);
    const adminTok = await client.adminToken();
    const longName = "A".repeat(81); // 81 chars — exceeds max_length=80

    const res = await client.post("/api/admin/products", {
      name:        longName,
      category:    "QA",
      price:       5.0,
      stock:       1,
      description: "A product with an extremely long name for validation testing.",
      image:       "/img/long.jpg",
    }, adminTok);

    expect(res.status()).toBe(422);
  });

  test("TC-VAL-004 | non-integer product_id in path → 422 (FastAPI type coercion)", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.get("/api/products/not-a-number");
    // FastAPI coerces path params; a string where int is expected → 422
    expect(res.status()).toBe(422);
  });

  test("TC-VAL-005 | negative product_id in path → 404 (no product with negative ID)", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.get("/api/products/-1");
    // No product has a negative ID; DB query returns nothing → NotFoundError → 404
    expect(res.status()).toBe(404);
  });
});
