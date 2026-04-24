/**
 * Test Suite : Cart — Shipping Method
 * Endpoint   : POST /api/cart/shipping
 * Coverage   : TC-SHIP-001 … TC-SHIP-004
 *
 * Shipping prices (PricingService): standard=$8, express=$18, pickup=$0
 *
 * Positive: express → $18; pickup → $0
 * Negative: invalid method name; empty string
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
  // Add one product so shipping cost calculation has a non-zero subtotal
  await client.clearCart(token);
  await client.addToCart(SEED.products.MUG.id, 1, token);
});

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-SHIP-001 | shipping_method=express → shipping cost = $18.00", async () => {
  const res  = await client.post("/api/cart/shipping", { shipping_method: "express" }, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  expect(cart.shipping).toBeCloseTo(SEED.shipping.express, 2); // 18.00
  expect(cart.shipping_method).toBe("express");
});

test("TC-SHIP-002 | shipping_method=pickup → shipping cost = $0.00 (free)", async () => {
  const res  = await client.post("/api/cart/shipping", { shipping_method: "pickup" }, token);
  expect(res.status()).toBe(200);
  const cart = await res.json();

  expect(cart.shipping).toBe(SEED.shipping.pickup); // 0.00
  expect(cart.shipping_method).toBe("pickup");
  // Total must only include subtotal + tax (no shipping cost)
  const subtotal = cart.subtotal - cart.discount;
  const tax      = Math.round(Math.max(subtotal, 0) * 0.08 * 100) / 100;
  expect(cart.total).toBeCloseTo(Math.max(subtotal, 0) + tax, 2);
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-SHIP-003 | invalid shipping method → 400 or 422", async () => {
  const res = await client.post("/api/cart/shipping", { shipping_method: "drone_delivery" }, token);
  expect(res.ok()).toBe(false);
  expect([400, 422]).toContain(res.status());
});

test("TC-SHIP-004 | empty shipping method string → 400 or 422", async () => {
  const res = await client.post("/api/cart/shipping", { shipping_method: "" }, token);
  expect(res.ok()).toBe(false);
  expect([400, 422]).toContain(res.status());
});
