/**
 * Test Suite : Cart — Remove Item & Clear Cart
 * Endpoints  : DELETE /api/cart/items/{product_id}
 *              POST   /api/cart/clear
 * Coverage   : TC-CART-011 … TC-CART-014
 *
 * Positive: remove specific item; clear all items
 * Negative: remove item not in cart → 404; clear already-empty cart is idempotent
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
});

test.beforeEach(async () => {
  await client.clearCart(token);
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-CART-011 | remove existing item → 200, item absent from cart, totals updated", async () => {
  // Add two distinct products
  await client.addToCart(SEED.products.LAMP.id, 1, token);
  await client.addToCart(SEED.products.MUG.id,  2, token);

  // Remove just the lamp
  const res  = await client.del(`/api/cart/items/${SEED.products.LAMP.id}`, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  const lampEntry = cart.items.find((i: { product_id: number }) => i.product_id === SEED.products.LAMP.id);
  expect(lampEntry).toBeUndefined(); // lamp must be gone

  // Mug must still be present
  const mugEntry = cart.items.find((i: { product_id: number }) => i.product_id === SEED.products.MUG.id);
  expect(mugEntry).toBeDefined();

  // Subtotal must reflect only the mug
  expect(cart.subtotal).toBeCloseTo(SEED.products.MUG.price * 2, 2);
});

test("TC-CART-012 | clear cart → 200, empty items list, all totals zero (except possible shipping base)", async () => {
  await client.addToCart(SEED.products.LAMP.id,    1, token);
  await client.addToCart(SEED.products.BOTTLE.id,  2, token);

  const res  = await client.post("/api/cart/clear", {}, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  expect(cart.items).toHaveLength(0);
  expect(cart.subtotal).toBe(0);
  expect(cart.discount).toBe(0);
  expect(cart.tax).toBe(0);
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-CART-013 | remove product not in cart → 404 (NotFoundError)", async () => {
  // Cart is empty (cleared in beforeEach); try to remove something that was never added
  const res = await client.del(`/api/cart/items/${SEED.products.SHOES.id}`, token);
  expect(res.status()).toBe(404);
});

test("TC-CART-014 | clear already-empty cart → 200 (idempotent, no error)", async () => {
  // Cart is empty after beforeEach
  const res  = await client.post("/api/cart/clear", {}, token);
  expect(res.status()).toBe(200);

  const cart = await res.json();
  expect(cart.items).toHaveLength(0);
});
