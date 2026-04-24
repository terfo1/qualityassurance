# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/TC-AUTH-login.spec.ts >> Login — POST /api/auth/login >> TC-LOGIN-003 | wrong password → 401 (no token in response)
- Location: auth/TC-AUTH-login.spec.ts:45:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 400
```

# Test source

```ts
  1  | /**
  2  |  * Test Suite : User Login
  3  |  * Endpoint   : POST /api/auth/login
  4  |  * Coverage   : TC-LOGIN-001 … TC-LOGIN-006
  5  |  *
  6  |  * Positive: valid credentials return token; token structure is valid
  7  |  * Negative: wrong password, unknown email, inactive user, empty credentials
  8  |  */
  9  | import { test, expect } from "@playwright/test";
  10 | import { ApiClient } from "../helpers/api-client";
  11 | import { validUser, SEED } from "../helpers/test-data";
  12 | 
  13 | test.describe("Login — POST /api/auth/login", () => {
  14 |   // ── Positive ───────────────────────────────────────────────────────────────
  15 | 
  16 |   test("TC-LOGIN-001 | valid credentials → 200 with token string", async ({ request }) => {
  17 |     const client = new ApiClient(request);
  18 | 
  19 |     const res = await client.post("/api/auth/login", {
  20 |       email: SEED.users.DEMO.email,
  21 |       password: SEED.users.DEMO.password,
  22 |     });
  23 | 
  24 |     expect(res.status()).toBe(200);
  25 |     const body = await res.json();
  26 |     expect(typeof body.token).toBe("string");
  27 |     expect(body.token.length).toBeGreaterThan(20);
  28 |   });
  29 | 
  30 |   test("TC-LOGIN-002 | token encodes user identity (GET /api/auth/me returns correct user)", async ({ request }) => {
  31 |     const client = new ApiClient(request);
  32 |     const token  = await client.demoToken();
  33 | 
  34 |     const me = await client.get("/api/auth/me", token);
  35 |     expect(me.status()).toBe(200);
  36 |     const body = await me.json();
  37 | 
  38 |     // Token must resolve to the demo user
  39 |     expect(body.email).toBe(SEED.users.DEMO.email);
  40 |     expect(body.role).toBe("customer");
  41 |   });
  42 | 
  43 |   // ── Negative ──────────────────────────────────────────────────────────────
  44 | 
  45 |   test("TC-LOGIN-003 | wrong password → 401 (no token in response)", async ({ request }) => {
  46 |     const client = new ApiClient(request);
  47 | 
  48 |     const res = await client.post("/api/auth/login", {
  49 |       email: SEED.users.DEMO.email,
  50 |       password: "absolutely_wrong_password",
  51 |     });
  52 | 
> 53 |     expect(res.status()).toBe(401);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  54 |     const body = await res.json();
  55 |     expect(body.token).toBeUndefined();
  56 |   });
  57 | 
  58 |   test("TC-LOGIN-004 | non-existent email → 401 (must not reveal whether email exists)", async ({ request }) => {
  59 |     const client = new ApiClient(request);
  60 | 
  61 |     const res = await client.post("/api/auth/login", {
  62 |       email: "ghost@nowhere.novacart.local",
  63 |       password: "SomePassword1",
  64 |     });
  65 | 
  66 |     // 401, not 404 — prevents user enumeration
  67 |     expect(res.status()).toBe(401);
  68 |   });
  69 | 
  70 |   test("TC-LOGIN-005 | inactive user → 401", async ({ request }) => {
  71 |     // NOTE: This test registers a new user then requires the DB is_active flag
  72 |     // to be set to false externally (manual step or admin API if available).
  73 |     // Here we verify the *login path* rejects an inactive account.
  74 |     // If no admin deactivation endpoint exists, mark this test as @skip and
  75 |     // cover it via a direct DB integration test.
  76 |     test.skip(true, "Requires DB-level deactivation; cover in integration test layer.");
  77 |   });
  78 | 
  79 |   test("TC-LOGIN-006 | empty credentials → 422 (DTO validation)", async ({ request }) => {
  80 |     const client = new ApiClient(request);
  81 | 
  82 |     const res = await client.post("/api/auth/login", { email: "", password: "" });
  83 | 
  84 |     expect(res.status()).toBe(422);
  85 |   });
  86 | });
  87 | 
```