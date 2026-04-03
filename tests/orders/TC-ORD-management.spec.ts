/**
 * Test Suite : Order Management — Retrieval & Status Updates
 * Endpoints  : GET /api/orders
 *              GET /api/orders/{order_id}
 *              PUT /api/orders/{order_id}/status
 * Coverage   : TC-ORD-001 … TC-ORD-006
 *
 * Positive: user sees only their orders; admin updates status
 * Negative: customer cannot update status → 403; invalid status → 400/422;
 *           wrong user accessing order → 403/404; nonexistent order → 404
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, validCheckout, SEED } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

let clientA: ApiClient;
let clientB: ApiClient;
let tokenA: string;
let tokenB: string;
let adminTok: string;
let orderAId: number;

test.beforeAll(async ({ request }) => {
  clientA  = new ApiClient(request);
  clientB  = new ApiClient(request); // same request context; different tokens
  adminTok = await clientA.adminToken();

  // Register two independent customers
  const uA = validUser();
  const uB = validUser();
  tokenA   = await clientA.registerAndLogin(uA.email, uA.password, uA.full_name);
  tokenB   = await clientB.registerAndLogin(uB.email, uB.password, uB.full_name);

  // User A places one order
  await clientA.clearCart(tokenA);
  await clientA.addToCart(SEED.products.MUG.id, 1, tokenA);
  const orderRes = await clientA.post("/api/orders", validCheckout(), tokenA);
  expect(orderRes.status()).toBe(201);
  const order = await orderRes.json();
  orderAId = order.id;

  // User B places a separate order
  await clientB.clearCart(tokenB);
  await clientB.addToCart(SEED.products.BOTTLE.id, 1, tokenB);
  await clientB.post("/api/orders", validCheckout(), tokenB);
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-ORD-001 | GET /api/orders — user sees only their own orders", async () => {
  const resA = await clientA.get("/api/orders", tokenA);
  expect(resA.status()).toBe(200);
  const ordersA = await resA.json();

  // All returned orders must belong to User A (no order from User B)
  for (const ord of ordersA) {
    expect(ord.id).toBe(orderAId); // there should be exactly 1 order for this fresh user
  }
  expect(ordersA.length).toBe(1);
});

test("TC-ORD-002 | admin updates order status to fulfilled → 200, status persisted", async () => {
  const res = await clientA.put(`/api/orders/${orderAId}/status`, { status: "fulfilled" }, adminTok);
  expect(res.status()).toBe(200);

  const check = await clientA.get(`/api/orders/${orderAId}`, tokenA);
  const order = await check.json();
  expect(order.status).toBe("fulfilled");
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-ORD-003 | customer cannot update order status → 403", async () => {
  const res = await clientA.put(
    `/api/orders/${orderAId}/status`,
    { status: "fulfilled" },
    tokenA, // customer token, not admin
  );
  expect(res.status()).toBe(403);
});

test("TC-ORD-004 | invalid status value → 400 or 422", async () => {
  const res = await clientA.put(
    `/api/orders/${orderAId}/status`,
    { status: "cancelled" }, // 'cancelled' is not in the valid enum
    adminTok,
  );
  expect(res.ok()).toBe(false);
  expect([400, 422]).toContain(res.status());
});

test("TC-ORD-005 | User B cannot access User A's order → 403 or 404", async () => {
  const res = await clientB.get(`/api/orders/${orderAId}`, tokenB);
  // Must not return 200 — order belongs to a different user
  expect([403, 404]).toContain(res.status());
});

test("TC-ORD-006 | GET non-existent order → 404", async () => {
  const res = await clientA.get("/api/orders/999999", tokenA);
  expect(res.status()).toBe(404);
});
