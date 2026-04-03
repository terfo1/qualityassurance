/**
 * Test Suite : Cart — Add Item
 * Endpoint   : POST /api/cart/items
 * Coverage   : TC-CART-001 … TC-CART-006
 *
 * Each describe block registers an isolated user so cart state does not
 * bleed between tests. Tests within each block run serially.
 *
 * Positive: add in-stock product; adding same product increments quantity (upsert)
 * Negative: quantity > stock → 400; nonexistent product → 404; qty < 1 → 422; qty > 20 → 422
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, SEED } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

let token: string;
let client: ApiClient;

test.beforeAll(async ({ request }) => {
  client = new ApiClient(request);
  const u = validUser();
  token = await client.registerAndLogin(u.email, u.password, u.full_name);
  await client.clearCart(token);
});

test.afterEach(async () => {
  // Reset cart between tests so each starts from a known empty state
  await client.clearCart(token);
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-CART-001 | add valid in-stock product → 200, item appears in cart with correct line_total", async () => {
  const product = SEED.products.LAMP; // $42.50, stock 31

  const res  = await client.post("/api/cart/items", { product_id: product.id, quantity: 2 }, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  const item = cart.items.find((i: { product_id: number }) => i.product_id === product.id);
  expect(item).toBeDefined();
  expect(item.quantity).toBe(2);
  // line_total must equal unit_price × quantity
  expect(item.line_total).toBeCloseTo(product.price * 2, 2);
  // Cart totals must be recalculated
  expect(cart.subtotal).toBeCloseTo(product.price * 2, 2);
});

test("TC-CART-002 | adding same product twice increments quantity (upsert — no duplicates)", async () => {
  const product = SEED.products.MUG; // $19.00

  await client.post("/api/cart/items", { product_id: product.id, quantity: 1 }, token);
  const res  = await client.post("/api/cart/items", { product_id: product.id, quantity: 1 }, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  // Must be exactly one entry for this product
  const entries = cart.items.filter((i: { product_id: number }) => i.product_id === product.id);
  expect(entries.length).toBe(1);
  expect(entries[0].quantity).toBe(2); // 1 + 1
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-CART-003 | quantity exceeds stock → 400 (InventoryError)", async () => {
  const product = SEED.products.HEADPHONES; // stock 12

  const res = await client.post("/api/cart/items", { product_id: product.id, quantity: 999 }, token);
  expect(res.status()).toBe(400);
});

test("TC-CART-004 | non-existent product_id → 404 (NotFoundError)", async () => {
  const res = await client.post("/api/cart/items", { product_id: 999999, quantity: 1 }, token);
  expect(res.status()).toBe(404);
});

test("TC-CART-005 | quantity = 0 → 422 (DTO validation, ge=1)", async () => {
  const res = await client.post("/api/cart/items", { product_id: SEED.products.MUG.id, quantity: 0 }, token);
  expect(res.status()).toBe(422);
});

test("TC-CART-006 | quantity = 21 → 422 (DTO validation, le=20)", async () => {
  const res = await client.post("/api/cart/items", { product_id: SEED.products.MUG.id, quantity: 21 }, token);
  expect(res.status()).toBe(422);
});
