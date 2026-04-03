/**
 * Test Suite : Inventory — Stock Deduction & Validation
 * Module     : OrderService.checkout() in app/application/services.py
 * Coverage   : TC-INV-001 … TC-INV-004
 *
 * Positive: stock decremented correctly; all items in multi-product order decremented
 * Negative: out-of-stock product blocks checkout; stock never goes negative
 *
 * Strategy: admin creates a controlled-stock product per test, then deletes it after.
 * This avoids touching seeded products whose stock levels change across the test run.
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, validCheckout } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

let adminTok: string;
let userTok: string;
let client: ApiClient;

test.beforeAll(async ({ request }) => {
  client   = new ApiClient(request);
  adminTok = await client.adminToken();
  const u  = validUser();
  userTok  = await client.registerAndLogin(u.email, u.password, u.full_name);
});

test.beforeEach(async () => {
  await client.clearCart(userTok);
});

// ── Helpers ────────────────────────────────────────────────────────────────────

async function createControlledProduct(stock: number) {
  return client.createProduct(
    {
      name:        `INV_Test_${Date.now()}`,
      category:    "QA-Inventory",
      price:       10.0,
      stock,
      description: "Controlled-stock product for inventory tests.",
      image:       "/img/inv-test.jpg",
    },
    adminTok,
  );
}

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-INV-001 | stock decremented by ordered quantity after successful checkout", async () => {
  const prod = await createControlledProduct(10); // start with 10 units
  await client.addToCart(prod.id, 3, userTok);

  const orderRes = await client.post("/api/orders", validCheckout(), userTok);
  expect(orderRes.status()).toBe(201);

  // Fetch product and verify stock = 10 - 3 = 7
  const prodRes   = await client.get(`/api/products/${prod.id}`);
  const updated   = await prodRes.json();
  expect(updated.stock).toBe(7);

  await client.deleteProduct(prod.id, adminTok);
});

test("TC-INV-002 | multiple products: all stocks decremented atomically", async () => {
  const prodA = await createControlledProduct(5);
  const prodB = await createControlledProduct(8);

  await client.addToCart(prodA.id, 2, userTok);
  await client.addToCart(prodB.id, 3, userTok);

  const orderRes = await client.post("/api/orders", validCheckout(), userTok);
  expect(orderRes.status()).toBe(201);

  const resA = await client.get(`/api/products/${prodA.id}`);
  const resB = await client.get(`/api/products/${prodB.id}`);

  expect((await resA.json()).stock).toBe(3); // 5 - 2
  expect((await resB.json()).stock).toBe(5); // 8 - 3

  await client.deleteProduct(prodA.id, adminTok);
  await client.deleteProduct(prodB.id, adminTok);
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-INV-003 | out-of-stock product (stock=0) blocks checkout → 400", async () => {
  const prod = await createControlledProduct(0); // zero stock

  // Cart add may succeed (stock check timing), but checkout must fail
  // Try adding — may get 400 immediately if stock checked at add time
  const addRes = await client.post("/api/cart/items", { product_id: prod.id, quantity: 1 }, userTok);
  if (addRes.ok()) {
    // If add succeeded, checkout must reject
    const orderRes = await client.post("/api/orders", validCheckout(), userTok);
    expect(orderRes.status()).toBe(400);
  } else {
    expect(addRes.status()).toBe(400); // stock check at add-time is also acceptable
  }

  // Verify product stock is still 0 (no partial deduction)
  const check = await client.get(`/api/products/${prod.id}`);
  expect((await check.json()).stock).toBe(0);

  await client.deleteProduct(prod.id, adminTok);
});

test("TC-INV-004 | ordered quantity > stock → checkout rejected, stock does not go negative", async () => {
  const prod = await createControlledProduct(2); // only 2 units

  // Add 1 unit to cart (valid at add time)
  await client.addToCart(prod.id, 1, userTok);

  // Admin reduces stock to 0 after item was added to cart (simulate race condition)
  await client.put(`/api/admin/products/${prod.id}`, { stock: 0 }, adminTok);

  // Checkout must detect insufficient stock and reject
  const orderRes = await client.post("/api/orders", validCheckout(), userTok);
  expect(orderRes.status()).toBe(400);

  // Stock must remain at 0 — not negative
  const check = await client.get(`/api/products/${prod.id}`);
  expect((await check.json()).stock).toBeGreaterThanOrEqual(0);

  await client.deleteProduct(prod.id, adminTok);
});
