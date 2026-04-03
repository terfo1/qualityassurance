# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/TC-TOKEN-security.spec.ts >> Password Hashing — hash_password / verify_password (via API) >> TC-PWD-003 | wrong password fails verification → 401
- Location: auth/TC-TOKEN-security.spec.ts:112:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 400
```

# Test source

```ts
  22  | 
  23  |     const res  = await client.get("/api/auth/me", token);
  24  |     expect(res.status()).toBe(200);
  25  |     const body = await res.json();
  26  |     expect(body.email).toBe(SEED.users.ADMIN.email);
  27  |     expect(body.role).toBe("admin");
  28  |   });
  29  | 
  30  |   test("TC-TOKEN-002 | two logins for same user produce different tokens (nonce uniqueness)", async ({ request }) => {
  31  |     const client  = new ApiClient(request);
  32  |     const tokenA  = await client.login(SEED.users.DEMO.email, SEED.users.DEMO.password);
  33  |     const tokenB  = await client.login(SEED.users.DEMO.email, SEED.users.DEMO.password);
  34  | 
  35  |     // Nonce segment ensures tokens never repeat, preventing replay attacks
  36  |     expect(tokenA).not.toBe(tokenB);
  37  |   });
  38  | 
  39  |   // ── Negative ──────────────────────────────────────────────────────────────
  40  | 
  41  |   test("TC-TOKEN-003 | tampered signature → 401 on protected endpoint", async ({ request }) => {
  42  |     const client = new ApiClient(request);
  43  |     const token  = await client.demoToken();
  44  | 
  45  |     // Flip the last two characters of the token to corrupt the HMAC signature
  46  |     const tampered = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
  47  | 
  48  |     const res = await client.get("/api/auth/me", tampered);
  49  |     expect(res.status()).toBe(401);
  50  |   });
  51  | 
  52  |   test("TC-TOKEN-004 | fully fabricated token → 401 (must not raise 500)", async ({ request }) => {
  53  |     const client = new ApiClient(request);
  54  | 
  55  |     const res = await client.get("/api/auth/me", "totally.fabricated.token.value");
  56  |     // Must return 401, NOT 500 — decode_token() must handle garbage gracefully
  57  |     expect(res.status()).toBe(401);
  58  |   });
  59  | 
  60  |   test("TC-TOKEN-005 | token with wrong segment count → 401", async ({ request }) => {
  61  |     const client = new ApiClient(request);
  62  | 
  63  |     // Valid format is base64(userId:timestamp:nonce:signature) — feed 3 segments
  64  |     const res = await client.get("/api/auth/me", "a:b:c");
  65  |     expect(res.status()).toBe(401);
  66  |   });
  67  | });
  68  | 
  69  | test.describe("Password Hashing — hash_password / verify_password (via API)", () => {
  70  |   // Direct unit testing of security.py is done via pytest; here we exercise
  71  |   // the same code paths indirectly through the registration + login surface.
  72  | 
  73  |   test("TC-PWD-001 | same password registered twice produces different stored hashes (salt uniqueness)", async ({ request }) => {
  74  |     // We cannot read password_hash from the API (it's never returned),
  75  |     // but we can confirm both accounts work with the same password —
  76  |     // proving hashing is applied correctly and independently per user.
  77  |     const client   = new ApiClient(request);
  78  |     const password = "SharedPass99!";
  79  |     const userA    = validUser({ password });
  80  |     const userB    = validUser({ password });
  81  | 
  82  |     const regA = await client.post("/api/auth/register", userA);
  83  |     const regB = await client.post("/api/auth/register", userB);
  84  |     expect(regA.status()).toBe(201);
  85  |     expect(regB.status()).toBe(201);
  86  | 
  87  |     // Both accounts must be independently loginable with the same plaintext password
  88  |     const tokA = await client.login(userA.email, password);
  89  |     const tokB = await client.login(userB.email, password);
  90  |     expect(typeof tokA).toBe("string");
  91  |     expect(typeof tokB).toBe("string");
  92  |     // And their tokens must differ (different user IDs)
  93  |     expect(tokA).not.toBe(tokB);
  94  |   });
  95  | 
  96  |   test("TC-PWD-002 | correct password verifies successfully (register → login round-trip)", async ({ request }) => {
  97  |     const client  = new ApiClient(request);
  98  |     const payload = validUser();
  99  | 
  100 |     await client.post("/api/auth/register", payload);
  101 |     // If verify_password() works correctly this must return 200
  102 |     const res = await client.post("/api/auth/login", {
  103 |       email: payload.email,
  104 |       password: payload.password,
  105 |     });
  106 | 
  107 |     expect(res.status()).toBe(200);
  108 |     const body = await res.json();
  109 |     expect(body.token).toBeDefined();
  110 |   });
  111 | 
  112 |   test("TC-PWD-003 | wrong password fails verification → 401", async ({ request }) => {
  113 |     const client  = new ApiClient(request);
  114 |     const payload = validUser();
  115 | 
  116 |     await client.post("/api/auth/register", payload);
  117 |     const res = await client.post("/api/auth/login", {
  118 |       email: payload.email,
  119 |       password: "WrongPassword99!",
  120 |     });
  121 | 
> 122 |     expect(res.status()).toBe(401);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  123 |   });
  124 | 
  125 |   test("TC-PWD-004 | malformed/corrupted credential does not raise 500", async ({ request }) => {
  126 |     const client = new ApiClient(request);
  127 |     // Send a non-standard email-like string to stress the lookup path
  128 |     const res = await client.post("/api/auth/login", {
  129 |       email: "not-a-real-email",
  130 |       password: "SomePassword1!",
  131 |     });
  132 | 
  133 |     // Must be a client error (4xx), never a server error (5xx)
  134 |     expect(res.status()).toBeGreaterThanOrEqual(400);
  135 |     expect(res.status()).toBeLessThan(500);
  136 |   });
  137 | });
  138 | 
```