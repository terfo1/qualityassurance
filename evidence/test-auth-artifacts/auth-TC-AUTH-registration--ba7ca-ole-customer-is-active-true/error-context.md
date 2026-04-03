# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/TC-AUTH-registration.spec.ts >> Registration — POST /api/auth/register >> TC-AUTH-002 | newly registered user defaults: role=customer, is_active=true
- Location: auth/TC-AUTH-registration.spec.ts:32:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "customer"
Received: undefined
```

# Test source

```ts
  1  | /**
  2  |  * Test Suite : User Registration
  3  |  * Endpoint   : POST /api/auth/register
  4  |  * Coverage   : TC-AUTH-001 … TC-AUTH-006
  5  |  *
  6  |  * Positive: valid registration, default role/active state
  7  |  * Negative: duplicate email, short password, short email, short full_name
  8  |  */
  9  | import { test, expect } from "@playwright/test";
  10 | import { ApiClient } from "../helpers/api-client";
  11 | import { validUser, uniqueEmail } from "../helpers/test-data";
  12 | 
  13 | test.describe("Registration — POST /api/auth/register", () => {
  14 |   // ── Positive ───────────────────────────────────────────────────────────────
  15 | 
  16 |   test("TC-AUTH-001 | valid payload → 201 with user object (no password exposed)", async ({ request }) => {
  17 |     const client = new ApiClient(request);
  18 |     const payload = validUser();
  19 | 
  20 |     const res = await client.post("/api/auth/register", payload);
  21 | 
  22 |     expect(res.status()).toBe(201);
  23 |     const body = await res.json();
  24 |     expect(body.email).toBe(payload.email);
  25 |     expect(body.full_name).toBe(payload.full_name);
  26 |     expect(body.id).toBeDefined();
  27 |     // Sensitive fields must never be returned
  28 |     expect(body.password).toBeUndefined();
  29 |     expect(body.password_hash).toBeUndefined();
  30 |   });
  31 | 
  32 |   test("TC-AUTH-002 | newly registered user defaults: role=customer, is_active=true", async ({ request }) => {
  33 |     const client = new ApiClient(request);
  34 |     const payload = validUser();
  35 | 
  36 |     const res = await client.post("/api/auth/register", payload);
  37 |     expect(res.status()).toBe(201);
  38 |     const body = await res.json();
  39 | 
  40 |     // Default role must be 'customer', not admin
> 41 |     expect(body.role).toBe("customer");
     |                       ^ Error: expect(received).toBe(expected) // Object.is equality
  42 |     // Account must be immediately usable — no manual activation required
  43 |     expect(body.is_active).toBe(true);
  44 |   });
  45 | 
  46 |   // ── Negative ──────────────────────────────────────────────────────────────
  47 | 
  48 |   test("TC-AUTH-003 | duplicate email → 4xx (email already registered)", async ({ request }) => {
  49 |     const client = new ApiClient(request);
  50 |     const payload = validUser();
  51 | 
  52 |     // First registration must succeed
  53 |     const first = await client.post("/api/auth/register", payload);
  54 |     expect(first.ok()).toBe(true);
  55 | 
  56 |     // Second registration with same email must be rejected
  57 |     const second = await client.post("/api/auth/register", payload);
  58 |     expect(second.ok()).toBe(false);
  59 |     expect([400, 409]).toContain(second.status());
  60 |   });
  61 | 
  62 |   test("TC-AUTH-004 | password shorter than 8 chars → 422", async ({ request }) => {
  63 |     const client = new ApiClient(request);
  64 |     const payload = validUser({ password: "short" }); // 5 chars — below min_length=8
  65 | 
  66 |     const res = await client.post("/api/auth/register", payload);
  67 | 
  68 |     expect(res.status()).toBe(422);
  69 |   });
  70 | 
  71 |   test("TC-AUTH-005 | email shorter than 5 chars → 422", async ({ request }) => {
  72 |     const client = new ApiClient(request);
  73 |     const payload = validUser({ email: "a@b" }); // 3 chars — below min_length=5
  74 | 
  75 |     const res = await client.post("/api/auth/register", payload);
  76 | 
  77 |     expect(res.status()).toBe(422);
  78 |   });
  79 | 
  80 |   test("TC-AUTH-006 | full_name shorter than 2 chars → 422", async ({ request }) => {
  81 |     const client = new ApiClient(request);
  82 |     const payload = validUser({ full_name: "X" }); // 1 char — below min_length=2
  83 | 
  84 |     const res = await client.post("/api/auth/register", payload);
  85 | 
  86 |     expect(res.status()).toBe(422);
  87 |   });
  88 | });
  89 | 
```