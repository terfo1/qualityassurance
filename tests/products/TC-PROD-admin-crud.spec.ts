/**
 * Test Suite : Admin Product CRUD
 * Endpoints  : POST   /api/admin/products
 *              PUT    /api/admin/products/{id}
 *              DELETE /api/admin/products/{id}
 * Coverage   : TC-PROD-001 … TC-PROD-008
 *
 * Products created during tests are cleaned up in afterAll to avoid polluting
 * the catalogue for other tests.
 *
 * Positive: create and verify in catalog; partial update preserves untouched fields; delete removes product
 * Negative: price ≤ 0 → 422; negative stock → 422; update nonexistent → 404; delete nonexistent → 404
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validProduct } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

let client: ApiClient;
let adminTok: string;
const createdIds: number[] = [];

test.beforeAll(async ({ request }) => {
  client   = new ApiClient(request);
  adminTok = await client.adminToken();
});

test.afterAll(async () => {
  for (const id of createdIds) {
    await client.deleteProduct(id, adminTok).catch(() => {/* already gone */});
  }
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-PROD-001 | create product with valid payload → 201, all fields persisted correctly", async () => {
  const payload = validProduct();

  const res  = await client.post("/api/admin/products", payload, adminTok);
  expect(res.status()).toBe(201);
  const prod = await res.json();

  expect(prod.id).toBeDefined();
  expect(prod.name).toBe(payload.name);
  expect(prod.category).toBe(payload.category);
  expect(prod.price).toBeCloseTo(payload.price as number, 2);
  expect(prod.stock).toBe(payload.stock);

  createdIds.push(prod.id);
});

test("TC-PROD-002 | created product appears in GET /api/products catalog", async () => {
  const payload = validProduct();
  const res     = await client.post("/api/admin/products", payload, adminTok);
  const prod    = await res.json();
  createdIds.push(prod.id);

  // Fetch entire product list and find the new product
  const listRes  = await client.get("/api/products");
  expect(listRes.status()).toBe(200);
  const products = await listRes.json();

  const found = products.find((p: { id: number }) => p.id === prod.id);
  expect(found).toBeDefined();
  expect(found.name).toBe(payload.name);
});

test("TC-PROD-005 | partial update (price only) → 200, other fields unchanged", async () => {
  const payload  = validProduct();
  const createRes = await client.post("/api/admin/products", payload, adminTok);
  const created  = await createRes.json();
  createdIds.push(created.id);

  const updateRes = await client.put(
    `/api/admin/products/${created.id}`,
    { price: 99.99 },
    adminTok,
  );
  expect(updateRes.status()).toBe(200);
  const updated = await updateRes.json();

  expect(updated.price).toBeCloseTo(99.99, 2);
  // All other fields must be preserved
  expect(updated.name).toBe(payload.name);
  expect(updated.category).toBe(payload.category);
  expect(updated.stock).toBe(payload.stock);
  expect(updated.description).toBe(payload.description);
});

test("TC-PROD-007 | delete product → removed from catalog", async () => {
  const payload  = validProduct();
  const createRes = await client.post("/api/admin/products", payload, adminTok);
  const created  = await createRes.json();

  const delRes = await client.del(`/api/admin/products/${created.id}`, adminTok);
  expect(delRes.ok()).toBe(true);

  // Verify it no longer appears in the catalog
  const listRes  = await client.get("/api/products");
  const products = await listRes.json();
  const found    = products.find((p: { id: number }) => p.id === created.id);
  expect(found).toBeUndefined();
  // Do NOT push to createdIds since already deleted
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-PROD-003 | price = 0 → 422 (DTO: gt=0)", async () => {
  const res = await client.post("/api/admin/products", validProduct({ price: 0 }), adminTok);
  expect(res.status()).toBe(422);
});

test("TC-PROD-004 | negative stock → 422 (DTO: ge=0)", async () => {
  const res = await client.post("/api/admin/products", validProduct({ stock: -1 }), adminTok);
  expect(res.status()).toBe(422);
});

test("TC-PROD-006 | update non-existent product → 404", async () => {
  const res = await client.put("/api/admin/products/999999", { price: 10.0 }, adminTok);
  expect(res.status()).toBe(404);
});

test("TC-PROD-008 | delete non-existent product → 404", async () => {
  const res = await client.del("/api/admin/products/999999", adminTok);
  expect(res.status()).toBe(404);
});
