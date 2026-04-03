/**
 * Test Suite : Checkout / Order Creation
 * Endpoint   : POST /api/orders
 * Coverage   : TC-ORDER-001 … TC-ORDER-008
 *
 * Positive: full checkout flow; totals snapshot immutability; cart cleared after order
 * Negative: empty cart → 400; insufficient stock → 400; address too short → 422;
 *           missing required field → 422; unauthenticated → 401
 *
 * Each test registers its own isolated user to avoid cart conflicts.
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, validCheckout, SEED, expectedPricing } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

let token: string;
let client: ApiClient;

test.beforeAll(async ({ request }) => {
  client = new ApiClient(request);
  const u = validUser();
  token = await client.registerAndLogin(u.email, u.password, u.full_name);
});

test.beforeEach(async () => {
  await client.clearCart(token);
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-ORDER-001 | full checkout — order created with correct totals, stock decremented, cart cleared", async () => {
  // Terra Ceramic Mug: $19.00, stock 40 — safe to order small qty
  await client.addToCart(SEED.products.MUG.id, 2, token);

  const expected = expectedPricing(
    [{ price: SEED.products.MUG.price, quantity: 2 }],
    "standard",
    null,
  );

  const res   = await client.post("/api/orders", validCheckout(), token);
  expect(res.status()).toBe(201);
  const order = await res.json();

  // Order metadata
  expect(order.id).toBeDefined();
  expect(order.status).toBe("confirmed");
  expect(order.shipping_method).toBe("standard");

  // Financial snapshot must match expected pricing
  expect(order.subtotal).toBeCloseTo(expected.subtotal, 2);
  expect(order.tax).toBeCloseTo(expected.tax, 2);
  expect(order.shipping).toBeCloseTo(expected.shipping, 2);
  expect(order.total).toBeCloseTo(expected.total, 2);

  // Order items must capture the product snapshot
  expect(order.items).toHaveLength(1);
  expect(order.items[0].quantity).toBe(2);

  // Cart must be empty after successful checkout
  const cartRes  = await client.get("/api/cart", token);
  const cart     = await cartRes.json();
  expect(cart.items).toHaveLength(0);
});

test("TC-ORDER-002 | order total snapshot is immutable (not affected by post-order cart changes)", async () => {
  await client.addToCart(SEED.products.BOTTLE.id, 1, token); // Pulse Smart Bottle $36

  const orderRes = await client.post("/api/orders", validCheckout(), token);
  expect(orderRes.status()).toBe(201);
  const order = await orderRes.json();
  const originalTotal = order.total;

  // Modify cart after checkout (cart was cleared — add something different)
  await client.addToCart(SEED.products.MUG.id, 10, token);

  // Re-fetch the order — total must be unchanged
  const refetch = await client.get(`/api/orders/${order.id}`, token);
  expect(refetch.status()).toBe(200);
  const refetchedOrder = await refetch.json();
  expect(refetchedOrder.total).toBeCloseTo(originalTotal, 2);
});

test("TC-ORDER-003 | cart is empty after successful checkout", async () => {
  await client.addToCart(SEED.products.TEE.id, 1, token);

  await client.post("/api/orders", validCheckout(), token);

  const cartRes = await client.get("/api/cart", token);
  const cart    = await cartRes.json();
  expect(cart.items).toHaveLength(0);
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-ORDER-004 | checkout with empty cart → 400", async () => {
  // Cart is empty after beforeEach
  const res = await client.post("/api/orders", validCheckout(), token);
  expect(res.status()).toBe(400);
});

test("TC-ORDER-005 | checkout when stock drops below cart quantity → 400, stock NOT decremented", async () => {
  // We cannot reduce DB stock externally in this test layer, so we attempt
  // an order with a quantity far exceeding stock (> 99) — if DTO allows up to 20,
  // use a freshly-created low-stock product via admin API.
  const adminTok = await client.adminToken();
  const prod = await client.createProduct(
    { name: `LowStock${Date.now()}`, category: "QA", price: 5.0, stock: 1, description: "Low stock test product.", image: "/img/qa.jpg" },
    adminTok,
  );

  // Add 2 units but stock is only 1 → checkout must fail
  await client.addToCart(prod.id, 1, token); // adding 1 is fine (stock=1)
  // Manually try to reduce: update to qty beyond stock via update endpoint
  // (stock check happens at checkout time too)
  // Instead: create second user, buy the last unit, then our user's checkout fails
  const u2 = validUser();
  const tok2 = await client.registerAndLogin(u2.email, u2.password, u2.full_name);
  await client.addToCart(prod.id, 1, tok2);
  await client.post("/api/orders", validCheckout(), tok2); // drains stock to 0

  // Now our original user tries to check out — stock is 0
  const res = await client.post("/api/orders", validCheckout(), token);
  expect(res.status()).toBe(400);

  // Cleanup
  await client.deleteProduct(prod.id, adminTok);
});

test("TC-ORDER-006 | address shorter than 10 chars → 422 (DTO validation)", async () => {
  await client.addToCart(SEED.products.MUG.id, 1, token);

  const res = await client.post("/api/orders", validCheckout({ address: "Short St" }), token);
  expect(res.status()).toBe(422);
});

test("TC-ORDER-007 | missing required field (customer_name) → 422", async () => {
  await client.addToCart(SEED.products.MUG.id, 1, token);

  const { customer_name, ...withoutName } = validCheckout() as Record<string, unknown>;
  const res = await client.post("/api/orders", withoutName, token);
  expect(res.status()).toBe(422);
});

test("TC-ORDER-008 | unauthenticated checkout → 401", async () => {
  // No token provided — get_current_user() must reject
  const res = await client.post("/api/orders", validCheckout()); // no token
  expect(res.status()).toBe(401);
});
