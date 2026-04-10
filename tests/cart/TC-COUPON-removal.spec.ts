import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { SEED } from "../helpers/test-data";

test("TC-COUPON-007 | remove applied coupon -> coupon cleared and pricing returns to uncapped subtotal totals", async ({ request }) => {
  const client = new ApiClient(request);
  const token = await client.demoToken();

  await client.clearCart(token);
  await client.addToCart(SEED.products.BACKPACK.id, 1, token);

  const applyRes = await client.post("/api/cart/coupon", { code: "WELCOME10" }, token);
  expect(applyRes.status()).toBe(200);
  const applied = await applyRes.json();
  expect(applied.coupon_code).toBe("WELCOME10");
  expect(applied.pricing.discount).toBeGreaterThan(0);

  const removeRes = await client.del("/api/cart/coupon", token);
  expect(removeRes.status()).toBe(200);
  const removed = await removeRes.json();

  expect(removed.coupon_code).toBeNull();
  expect(removed.pricing.discount).toBe(0);
  expect(removed.pricing.subtotal).toBeCloseTo(SEED.products.BACKPACK.price, 2);
  expect(removed.pricing.total).toBeGreaterThan(applied.pricing.total);

  await client.clearCart(token);
});
