# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: system/TC-DB-transactions.spec.ts >> TC-DB-001 | failed checkout rolls back — no stock decremented, no order created
- Location: system/TC-DB-transactions.spec.ts:23:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 5
Received: undefined
```

# Test source

```ts
  1   | /**
  2   |  * Test Suite : Database Session & Transaction Management
  3   |  * Module     : app/presentation/api/dependencies.py — get_db()
  4   |  *              app/infrastructure/db/session.py
  5   |  * Coverage   : TC-DB-001 … TC-DB-004
  6   |  *
  7   |  * These tests verify transactional correctness observable through the API:
  8   |  *   - Failed operations roll back completely (no partial state)
  9   |  *   - Successful operations commit atomically
  10  |  *   - DB unique constraints surface as clean 4xx errors, never 5xx
  11  |  *
  12  |  * TC-DB-003 (session leak) is a load test — marked @skip for unit runs and
  13  |  * intended for a dedicated performance suite.
  14  |  */
  15  | import { test, expect } from "@playwright/test";
  16  | import { ApiClient } from "../helpers/api-client";
  17  | import { validUser, validCheckout } from "../helpers/test-data";
  18  | 
  19  | test.describe.configure({ mode: "serial" });
  20  | 
  21  | // ── TC-DB-001: Failed checkout rolls back all stock changes ───────────────────
  22  | 
  23  | test("TC-DB-001 | failed checkout rolls back — no stock decremented, no order created", async ({ request }) => {
  24  |   const client   = new ApiClient(request);
  25  |   const adminTok = await client.adminToken();
  26  |   const u        = validUser();
  27  |   const userTok  = await client.registerAndLogin(u.email, u.password, u.full_name);
  28  | 
  29  |   // Create two products: one with enough stock, one with zero stock
  30  |   const goodProd = await client.createProduct(
  31  |     { name: `TXGOOD_${Date.now()}`, category: "QA", price: 10.0, stock: 5, description: "Good stock product for TX test.", image: "/img/good.jpg" },
  32  |     adminTok,
  33  |   );
  34  |   const badProd = await client.createProduct(
  35  |     { name: `TXBAD_${Date.now()}`,  category: "QA", price: 10.0, stock: 0, description: "Zero stock product for TX test.",  image: "/img/bad.jpg" },
  36  |     adminTok,
  37  |   );
  38  | 
  39  |   // Add both to cart
  40  |   await client.addToCart(goodProd.id, 2, userTok);
  41  |   // Bad product — may fail at add-to-cart or at checkout
  42  |   const addBad = await client.post("/api/cart/items", { product_id: badProd.id, quantity: 1 }, userTok);
  43  | 
  44  |   if (addBad.ok()) {
  45  |     // Checkout must fail due to bad product
  46  |     const orderRes = await client.post("/api/orders", validCheckout(), userTok);
  47  |     expect(orderRes.status()).toBe(400);
  48  | 
  49  |     // Good product stock must NOT have been decremented (rollback)
  50  |     const goodCheck = await client.get(`/api/products/${goodProd.id}`);
  51  |     expect((await goodCheck.json()).stock).toBe(5);
  52  | 
  53  |     // No order must have been created for this user
  54  |     const ordersRes = await client.get("/api/orders", userTok);
  55  |     expect((await ordersRes.json()).length).toBe(0);
  56  |   } else {
  57  |     // Stock check at add-time is equally valid — the bad product was rejected early
  58  |     expect(addBad.status()).toBe(400);
  59  |     const goodCheck = await client.get(`/api/products/${goodProd.id}`);
> 60  |     expect((await goodCheck.json()).stock).toBe(5);
      |                                            ^ Error: expect(received).toBe(expected) // Object.is equality
  61  |   }
  62  | 
  63  |   await client.deleteProduct(goodProd.id, adminTok);
  64  |   await client.deleteProduct(badProd.id, adminTok);
  65  | });
  66  | 
  67  | // ── TC-DB-002: Successful checkout commits atomically ─────────────────────────
  68  | 
  69  | test("TC-DB-002 | successful checkout commits atomically — stock, order, and cart all updated", async ({ request }) => {
  70  |   const client  = new ApiClient(request);
  71  |   const adminTok = await client.adminToken();
  72  |   const u       = validUser();
  73  |   const userTok = await client.registerAndLogin(u.email, u.password, u.full_name);
  74  | 
  75  |   const prod = await client.createProduct(
  76  |     { name: `TXATOMIC_${Date.now()}`, category: "QA", price: 15.0, stock: 10, description: "Atomic commit test product.", image: "/img/atomic.jpg" },
  77  |     adminTok,
  78  |   );
  79  | 
  80  |   await client.addToCart(prod.id, 3, userTok);
  81  |   const orderRes = await client.post("/api/orders", validCheckout(), userTok);
  82  |   expect(orderRes.status()).toBe(201);
  83  | 
  84  |   const order = await orderRes.json();
  85  | 
  86  |   // 1. Order must exist and have correct data
  87  |   expect(order.id).toBeDefined();
  88  |   expect(order.items.length).toBe(1);
  89  | 
  90  |   // 2. Stock must be decremented
  91  |   const prodCheck = await client.get(`/api/products/${prod.id}`);
  92  |   expect((await prodCheck.json()).stock).toBe(7); // 10 - 3
  93  | 
  94  |   // 3. Cart must be cleared
  95  |   const cartCheck = await client.get("/api/cart", userTok);
  96  |   expect((await cartCheck.json()).items).toHaveLength(0);
  97  | 
  98  |   await client.deleteProduct(prod.id, adminTok);
  99  | });
  100 | 
  101 | // ── TC-DB-003: Session leak (load test — skipped by default) ─────────────────
  102 | 
  103 | test("TC-DB-003 | session closed after each request — no connection pool exhaustion", async ({ request }) => {
  104 |   // This is a simplified proxy: make 20 sequential requests and verify all succeed.
  105 |   // A true session-leak test requires monitoring the PG connection count directly.
  106 |   const client = new ApiClient(request);
  107 | 
  108 |   for (let i = 0; i < 20; i++) {
  109 |     const res = await client.get("/api/metrics/health");
  110 |     expect(res.status()).toBe(200);
  111 |   }
  112 |   // If sessions leaked, the pool would exhaust and later requests would fail.
  113 | });
  114 | 
  115 | // ── TC-DB-004: Unique constraint violation → clean 4xx, not 500 ──────────────
  116 | 
  117 | test("TC-DB-004 | duplicate email registration → 4xx (DB unique constraint, not 500)", async ({ request }) => {
  118 |   const client  = new ApiClient(request);
  119 |   const payload = validUser();
  120 | 
  121 |   const first = await client.post("/api/auth/register", payload);
  122 |   expect(first.ok()).toBe(true);
  123 | 
  124 |   const second = await client.post("/api/auth/register", payload);
  125 |   // Must be a client error, not a server crash
  126 |   expect(second.ok()).toBe(false);
  127 |   expect(second.status()).toBeGreaterThanOrEqual(400);
  128 |   expect(second.status()).toBeLessThan(500); // must NOT be 500
  129 | });
  130 | 
```