/**
 * Test Suite : Product Catalog — Listing, Filtering & Search
 * Endpoint   : GET /api/products
 * Coverage   : TC-CAT-001 … TC-CAT-007
 *
 * Uses seeded products (no setup required — read-only suite).
 * These tests may run in parallel with other read-only suites.
 *
 * Positive: category filter; price range; search by name; sort ascending; featured filter
 * Negative: unknown category → empty list; min_price > max_price → empty list / no crash
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { SEED } from "../helpers/test-data";

// Read-only: safe to run fully in parallel
test.describe("Catalog Filtering — GET /api/products", () => {

  test("TC-CAT-001 | filter by category=Footwear → only Footwear products returned", async ({ request }) => {
    const client = new ApiClient(request);

    const res      = await client.get("/api/products?category=Footwear");
    expect(res.status()).toBe(200);
    const products = await res.json();

    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(p.category.toLowerCase()).toBe("footwear");
    }
    // AeroFit Running Shoes must be present
    expect(products.some((p: { id: number }) => p.id === SEED.products.SHOES.id)).toBe(true);
  });

  test("TC-CAT-002 | price range filter is inclusive on both bounds", async ({ request }) => {
    const client = new ApiClient(request);
    // Products between $30 and $70: Lamp $42.50, Tee $29 (excluded), Backpack $64, Riser $74 (excluded)
    // Actually: Tee $29 < $30 excluded; Riser $74 > $70 excluded
    const res      = await client.get("/api/products?min_price=30&max_price=70");
    expect(res.status()).toBe(200);
    const products = await res.json();

    for (const p of products) {
      expect(p.price).toBeGreaterThanOrEqual(30);
      expect(p.price).toBeLessThanOrEqual(70);
    }
    // Lamp ($42.50) and Backpack ($64.00) must be in range
    const ids = products.map((p: { id: number }) => p.id);
    expect(ids).toContain(SEED.products.LAMP.id);
    expect(ids).toContain(SEED.products.BACKPACK.id);
  });

  test("TC-CAT-003 | search by product name → matching product returned", async ({ request }) => {
    const client = new ApiClient(request);
    // Search for 'AeroFit' — matches AeroFit Running Shoes (id=1)
    const res      = await client.get("/api/products?q=AeroFit");
    expect(res.status()).toBe(200);
    const products = await res.json();

    expect(products.some((p: { id: number }) => p.id === SEED.products.SHOES.id)).toBe(true);
  });

  test("TC-CAT-004 | sort=price_asc → products ordered lowest to highest price", async ({ request }) => {
    const client = new ApiClient(request);

    const res      = await client.get("/api/products?sort=price_asc");
    expect(res.status()).toBe(200);
    const products = await res.json();

    for (let i = 1; i < products.length; i++) {
      expect(products[i].price).toBeGreaterThanOrEqual(products[i - 1].price);
    }
  });

  test("TC-CAT-005 | unknown category → 200 with empty list (no server error)", async ({ request }) => {
    const client = new ApiClient(request);

    const res      = await client.get("/api/products?category=ZZZ_NONEXISTENT_CATEGORY_9999");
    expect(res.status()).toBe(200);
    const products = await res.json();
    expect(products).toHaveLength(0);
  });

  test("TC-CAT-006 | min_price > max_price → empty list or 422 (no crash)", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.get("/api/products?min_price=500&max_price=10");
    // Either returns empty list (200) or rejects as invalid (422) — must not 500
    expect([200, 422]).toContain(res.status());
    if (res.status() === 200) {
      const products = await res.json();
      expect(products).toHaveLength(0);
    }
  });

  test("TC-CAT-007 | featured=true → only featured products returned", async ({ request }) => {
    const client = new ApiClient(request);

    const res      = await client.get("/api/products?featured=true");
    expect(res.status()).toBe(200);
    const products = await res.json();

    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(p.featured).toBe(true);
    }
    // Seeded featured products: SHOES(1), BACKPACK(2), HEADPHONES(4), RISER(7)
    const ids = products.map((p: { id: number }) => p.id);
    expect(ids).toContain(SEED.products.BACKPACK.id);
    expect(ids).toContain(SEED.products.HEADPHONES.id);
  });
});
