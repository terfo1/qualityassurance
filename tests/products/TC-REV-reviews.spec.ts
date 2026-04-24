/**
 * Test Suite : Product Reviews & Rating Recalculation
 * Endpoints  : POST /api/products/{id}/reviews
 *              GET  /api/products/{id}/reviews
 * Coverage   : TC-REV-001 … TC-REV-005
 *
 * Rating recalculation: the API must recompute product.rating as the average
 * of all review ratings after each new review is submitted.
 *
 * A fresh product is created by admin for each test that mutates review state,
 * so seeded product ratings are not corrupted.
 *
 * Positive: new review updates rating; first review sets rating exactly
 * Negative: rating out of 1–5 → 422; comment too short → 422; nonexistent product → 404
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validProduct } from "../helpers/test-data";

test.describe.configure({ mode: "serial" });

let client: ApiClient;
let adminTok: string;
const createdProductIds: number[] = [];

test.beforeAll(async ({ request }) => {
  client   = new ApiClient(request);
  adminTok = await client.adminToken();
});

test.afterAll(async () => {
  for (const id of createdProductIds) {
    await client.deleteProduct(id, adminTok).catch(() => {});
  }
});

async function freshProduct() {
  const prod = await client.createProduct(validProduct(), adminTok);
  createdProductIds.push(prod.id);
  return prod;
}

// ── Positive ───────────────────────────────────────────────────────────────────

test("TC-REV-001 | new review updates product average rating correctly", async () => {
  const prod = await freshProduct();
  // Fresh product has no reviews — initial rating from seed default (0 or 4.5)

  // Submit rating=4
  await client.post(`/api/products/${prod.id}/reviews`, {
    author: "Tester One",
    rating: 4,
    comment: "Great product for the price point.",
  });

  // Submit rating=2 — average should be (4+2)/2 = 3.0
  const res2  = await client.post(`/api/products/${prod.id}/reviews`, {
    author: "Tester Two",
    rating: 2,
    comment: "Decent but expected a bit more quality.",
  });
  expect(res2.status()).toBe(201);

  // Fetch the product and verify the recalculated rating
  const prodRes  = await client.get(`/api/products/${prod.id}`);
  const updated  = await prodRes.json();
  expect(updated.rating).toBeCloseTo(3.0, 1);
});

test("TC-REV-002 | first review on product sets rating exactly to that rating", async () => {
  const prod = await freshProduct();

  const res = await client.post(`/api/products/${prod.id}/reviews`, {
    author: "Solo Reviewer",
    rating: 5,
    comment: "Absolutely perfect product, no complaints at all.",
  });
  expect(res.status()).toBe(201);

  const prodRes = await client.get(`/api/products/${prod.id}`);
  const updated = await prodRes.json();
  expect(updated.rating).toBeCloseTo(5.0, 1);
});

// ── Negative ──────────────────────────────────────────────────────────────────

test("TC-REV-003 | rating = 6 (above max) → 422 (DTO: le=5)", async () => {
  const prod = await freshProduct();

  const res = await client.post(`/api/products/${prod.id}/reviews`, {
    author: "Bad Rater",
    rating: 6,
    comment: "Trying to submit an invalid rating value.",
  });
  expect(res.status()).toBe(422);
});

test("TC-REV-004 | comment shorter than 8 chars → 422 (DTO: min_length=8)", async () => {
  const prod = await freshProduct();

  const res = await client.post(`/api/products/${prod.id}/reviews`, {
    author: "Lazy User",
    rating: 3,
    comment: "Short", // 5 chars — below min_length=8
  });
  expect(res.status()).toBe(422);
});

test("TC-REV-005 | review on non-existent product → 404", async () => {
  const res = await client.post("/api/products/999999/reviews", {
    author: "Ghost Author",
    rating: 4,
    comment: "This product does not exist anywhere.",
  });
  expect(res.status()).toBe(404);
});
