import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { SEED } from "../helpers/test-data";

test("TC-CART-RACE-001 | repeated add requests keep one line item and merged quantity for the same product", async ({ request }) => {
  const client = new ApiClient(request);
  const token = await client.demoToken();

  await client.clearCart(token);

  const [first, second] = await Promise.all([
    client.post("/api/cart/items", { product_id: SEED.products.MUG.id, quantity: 1 }, token),
    client.post("/api/cart/items", { product_id: SEED.products.MUG.id, quantity: 1 }, token),
  ]);

  expect(first.status()).toBe(201);
  expect(second.status()).toBe(201);

  const cartRes = await client.get("/api/cart", token);
  expect(cartRes.status()).toBe(200);
  const cart = await cartRes.json();

  const mugLines = cart.items.filter((item: { product: { id: number }; quantity: number }) => item.product.id === SEED.products.MUG.id);
  expect(mugLines).toHaveLength(1);
  expect(mugLines[0].quantity).toBe(2);

  await client.clearCart(token);
});
