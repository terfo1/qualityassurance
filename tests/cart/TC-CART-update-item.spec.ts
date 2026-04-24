/**
 * Test Suite : Cart — Update Item Quantity
 * Endpoint   : PUT /api/cart/items/{product_id}
 * Coverage   : TC-CART-007 … TC-CART-010
 *
 * Positive: update quantity of existing item; update to minimum valid quantity
 * Negative: new quantity exceeds stock → 400; product not in cart → 404
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
  // Seed cart with one product so update tests have something to act on
  await client.addToCart(SEED.products.LAMP.id, 1, token); // Luma Desk Lamp, $42.50, stock 31
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-CART-007 | update quantity of existing item → 200, totals recalculated", async () => {
  const product = SEED.products.LAMP;

  const res  = await client.put(`/api/cart/items/${product.id}`, { quantity: 5 }, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  const item = cart.items.find((i: { product_id: number }) => i.product_id === product.id);
  expect(item.quantity).toBe(5);
  expect(item.line_total).toBeCloseTo(product.price * 5, 2);
  expect(cart.subtotal).toBeCloseTo(product.price * 5, 2);
});

test("TC-CART-008 | update to quantity = 1 (boundary minimum) → 200, accepted", async () => {
  const product = SEED.products.LAMP;

  const res = await client.put(`/api/cart/items/${product.id}`, { quantity: 1 }, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  const item = cart.items.find((i: { product_id: number }) => i.product_id === product.id);
  expect(item.quantity).toBe(1);
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-CART-009 | new quantity exceeds available stock → 400 (InventoryError)", async () => {
  // LAMP stock = 31; request 99
  const res = await client.put(`/api/cart/items/${SEED.products.LAMP.id}`, { quantity: 99 }, token);
  expect(res.status()).toBe(400);
});

test("TC-CART-010 | product not in cart → 404 (NotFoundError)", async () => {
  const notInCart = SEED.products.SHOES.id; // not added in beforeEach
  await client.clearCart(token); // ensure truly empty

  const res = await client.put(`/api/cart/items/${notInCart}`, { quantity: 2 }, token);
  expect(res.status()).toBe(404);
});
