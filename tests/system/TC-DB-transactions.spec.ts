/**
 * Test Suite : Database Session & Transaction Management
 * Module     : app/presentation/api/dependencies.py — get_db()
 *              app/infrastructure/db/session.py
 * Coverage   : TC-DB-001 … TC-DB-004
 *
 * These tests verify transactional correctness observable through the API:
 *   - Failed operations roll back completely (no partial state)
 *   - Successful operations commit atomically
 *   - DB unique constraints surface as clean 4xx errors, never 5xx
 *
 * TC-DB-003 (session leak) is a load test — marked @skip for unit runs and
 * intended for a dedicated performance suite.
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, validCheckout } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

// ── TC-DB-001: Failed checkout rolls back all stock changes ───────────────────

test("TC-DB-001 | failed checkout rolls back — no stock decremented, no order created", async ({ request }) => {
  const client   = new ApiClient(request);
  const adminTok = await client.adminToken();
  const u        = validUser();
  const userTok  = await client.registerAndLogin(u.email, u.password, u.full_name);

  // Create two products: one with enough stock, one with zero stock
  const goodProd = await client.createProduct(
    { name: `TXGOOD_${Date.now()}`, category: "QA", price: 10.0, stock: 5, description: "Good stock product for TX test.", image: "/img/good.jpg" },
    adminTok,
  );
  const badProd = await client.createProduct(
    { name: `TXBAD_${Date.now()}`,  category: "QA", price: 10.0, stock: 0, description: "Zero stock product for TX test.",  image: "/img/bad.jpg" },
    adminTok,
  );

  // Add both to cart
  await client.addToCart(goodProd.id, 2, userTok);
  // Bad product — may fail at add-to-cart or at checkout
  const addBad = await client.post("/api/cart/items", { product_id: badProd.id, quantity: 1 }, userTok);

  if (addBad.ok()) {
    // Checkout must fail due to bad product
    const orderRes = await client.post("/api/orders", validCheckout(), userTok);
    expect(orderRes.status()).toBe(400);

    // Good product stock must NOT have been decremented (rollback)
    const goodCheck = await client.get(`/api/products/${goodProd.id}`);
    expect((await goodCheck.json()).stock).toBe(5);

    // No order must have been created for this user
    const ordersRes = await client.get("/api/orders", userTok);
    expect((await ordersRes.json()).length).toBe(0);
  } else {
    // Stock check at add-time is equally valid — the bad product was rejected early
    expect(addBad.status()).toBe(400);
    const goodCheck = await client.get(`/api/products/${goodProd.id}`);
    expect((await goodCheck.json()).stock).toBe(5);
  }

  await client.deleteProduct(goodProd.id, adminTok);
  await client.deleteProduct(badProd.id, adminTok);
});

// ── TC-DB-002: Successful checkout commits atomically ─────────────────────────

test("TC-DB-002 | successful checkout commits atomically — stock, order, and cart all updated", async ({ request }) => {
  const client  = new ApiClient(request);
  const adminTok = await client.adminToken();
  const u       = validUser();
  const userTok = await client.registerAndLogin(u.email, u.password, u.full_name);

  const prod = await client.createProduct(
    { name: `TXATOMIC_${Date.now()}`, category: "QA", price: 15.0, stock: 10, description: "Atomic commit test product.", image: "/img/atomic.jpg" },
    adminTok,
  );

  await client.addToCart(prod.id, 3, userTok);
  const orderRes = await client.post("/api/orders", validCheckout(), userTok);
  expect(orderRes.status()).toBe(201);

  const order = await orderRes.json();

  // 1. Order must exist and have correct data
  expect(order.id).toBeDefined();
  expect(order.items.length).toBe(1);

  // 2. Stock must be decremented
  const prodCheck = await client.get(`/api/products/${prod.id}`);
  expect((await prodCheck.json()).stock).toBe(7); // 10 - 3

  // 3. Cart must be cleared
  const cartCheck = await client.get("/api/cart", userTok);
  expect((await cartCheck.json()).items).toHaveLength(0);

  await client.deleteProduct(prod.id, adminTok);
});

// ── TC-DB-003: Session leak (load test — skipped by default) ─────────────────

test("TC-DB-003 | session closed after each request — no connection pool exhaustion", async ({ request }) => {
  // This is a simplified proxy: make 20 sequential requests and verify all succeed.
  // A true session-leak test requires monitoring the PG connection count directly.
  const client = new ApiClient(request);

  for (let i = 0; i < 20; i++) {
    const res = await client.get("/api/metrics/health");
    expect(res.status()).toBe(200);
  }
  // If sessions leaked, the pool would exhaust and later requests would fail.
});

// ── TC-DB-004: Unique constraint violation → clean 4xx, not 500 ──────────────

test("TC-DB-004 | duplicate email registration → 4xx (DB unique constraint, not 500)", async ({ request }) => {
  const client  = new ApiClient(request);
  const payload = validUser();

  const first = await client.post("/api/auth/register", payload);
  expect(first.ok()).toBe(true);

  const second = await client.post("/api/auth/register", payload);
  // Must be a client error, not a server crash
  expect(second.ok()).toBe(false);
  expect(second.status()).toBeGreaterThanOrEqual(400);
  expect(second.status()).toBeLessThan(500); // must NOT be 500
});
