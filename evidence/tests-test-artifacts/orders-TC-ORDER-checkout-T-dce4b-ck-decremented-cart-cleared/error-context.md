# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: orders/TC-ORDER-checkout.spec.ts >> TC-ORDER-001 | full checkout — order created with correct totals, stock decremented, cart cleared
- Location: orders/TC-ORDER-checkout.spec.ts:33:5

# Error details

```
Error: apiRequestContext.post: Fixture { request } from beforeAll cannot be reused in a test.
  - Recommended fix: use a separate { request } in the test.
  - Alternatively, manually create APIRequestContext in beforeAll and dispose it in afterAll.
See https://playwright.dev/docs/api-testing#sending-api-requests-from-ui-tests for more details.
```

# Test source

```ts
  1   | /**
  2   |  * ApiClient — thin wrapper around Playwright's APIRequestContext.
  3   |  * Provides consistent auth header injection, JSON body handling, and
  4   |  * convenience helpers for obtaining seeded/registered user tokens.
  5   |  *
  6   |  * Usage:
  7   |  *   const client = new ApiClient(request);
  8   |  *   const token  = await client.adminToken();
  9   |  *   const res    = await client.get("/api/admin/dashboard", token);
  10  |  */
  11  | import { APIRequestContext } from "@playwright/test";
  12  | 
  13  | const BASE = process.env.BASE_URL || "http://127.0.0.1:8000";
  14  | 
  15  | // ── Shared token cache (per process) ────────────────────────────────────────
  16  | // Seeded users never change passwords, so we cache their tokens to avoid
  17  | // re-authenticating on every test.
  18  | const _tokenCache: Record<string, string> = {};
  19  | 
  20  | export class ApiClient {
  21  |   constructor(private req: APIRequestContext) {}
  22  | 
  23  |   // ── Low-level request helpers ─────────────────────────────────────────────
  24  | 
  25  |   private headers(token?: string) {
  26  |     return token ? { Authorization: `Bearer ${token}` } : {};
  27  |   }
  28  | 
  29  |   get(endpoint: string, token?: string) {
  30  |     return this.req.get(`${BASE}${endpoint}`, { headers: this.headers(token) });
  31  |   }
  32  | 
  33  |   post(endpoint: string, body: object = {}, token?: string) {
> 34  |     return this.req.post(`${BASE}${endpoint}`, {
      |                     ^ Error: apiRequestContext.post: Fixture { request } from beforeAll cannot be reused in a test.
  35  |       headers: this.headers(token),
  36  |       data: body,
  37  |     });
  38  |   }
  39  | 
  40  |   put(endpoint: string, body: object = {}, token?: string) {
  41  |     return this.req.put(`${BASE}${endpoint}`, {
  42  |       headers: this.headers(token),
  43  |       data: body,
  44  |     });
  45  |   }
  46  | 
  47  |   del(endpoint: string, token?: string) {
  48  |     return this.req.delete(`${BASE}${endpoint}`, { headers: this.headers(token) });
  49  |   }
  50  | 
  51  |   // ── Auth helpers ──────────────────────────────────────────────────────────
  52  | 
  53  |   /** Logs in with the given credentials and returns the raw Bearer token. */
  54  |   async login(email: string, password: string): Promise<string> {
  55  |     const res = await this.post("/api/auth/login", { email, password });
  56  |     if (!res.ok()) {
  57  |       throw new Error(`Login failed for ${email}: HTTP ${res.status()} — ${await res.text()}`);
  58  |     }
  59  |     const body = await res.json();
  60  |     return body.token as string;
  61  |   }
  62  | 
  63  |   /** Returns the seeded admin token (cached). Admin: admin@novacart.local / Admin123! */
  64  |   async adminToken(): Promise<string> {
  65  |     if (!_tokenCache["admin"]) {
  66  |       _tokenCache["admin"] = await this.login("admin@novacart.local", "Admin123!");
  67  |     }
  68  |     return _tokenCache["admin"];
  69  |   }
  70  | 
  71  |   /** Returns the seeded demo-customer token (cached). Demo: demo@novacart.local / Demo123! */
  72  |   async demoToken(): Promise<string> {
  73  |     if (!_tokenCache["demo"]) {
  74  |       _tokenCache["demo"] = await this.login("demo@novacart.local", "Demo123!");
  75  |     }
  76  |     return _tokenCache["demo"];
  77  |   }
  78  | 
  79  |   /**
  80  |    * Registers a brand-new user and immediately logs in, returning the token.
  81  |    * Use this in beforeAll blocks to get an isolated user per describe group.
  82  |    */
  83  |   async registerAndLogin(email: string, password: string, fullName: string): Promise<string> {
  84  |     const reg = await this.post("/api/auth/register", {
  85  |       email,
  86  |       password,
  87  |       full_name: fullName,
  88  |     });
  89  |     if (!reg.ok()) {
  90  |       throw new Error(`Registration failed: HTTP ${reg.status()} — ${await reg.text()}`);
  91  |     }
  92  |     return this.login(email, password);
  93  |   }
  94  | 
  95  |   // ── Cart helpers ──────────────────────────────────────────────────────────
  96  | 
  97  |   /** Clears the cart for the given token (idempotent). */
  98  |   async clearCart(token: string): Promise<void> {
  99  |     await this.post("/api/cart/clear", {}, token);
  100 |   }
  101 | 
  102 |   /**
  103 |    * Adds a product to the cart; returns the response body.
  104 |    * Throws if the request is not successful.
  105 |    */
  106 |   async addToCart(productId: number, quantity: number, token: string) {
  107 |     const res = await this.post("/api/cart/items", { product_id: productId, quantity }, token);
  108 |     if (!res.ok()) throw new Error(`addToCart failed: ${await res.text()}`);
  109 |     return res.json();
  110 |   }
  111 | 
  112 |   // ── Product helpers (admin) ───────────────────────────────────────────────
  113 | 
  114 |   /**
  115 |    * Creates a product as admin and returns the created product object.
  116 |    * Throws if creation fails.
  117 |    */
  118 |   async createProduct(payload: object, adminTok: string) {
  119 |     const res = await this.post("/api/admin/products", payload, adminTok);
  120 |     if (!res.ok()) throw new Error(`createProduct failed: ${await res.text()}`);
  121 |     return res.json();
  122 |   }
  123 | 
  124 |   /** Deletes a product by ID as admin. Tolerates 404. */
  125 |   async deleteProduct(id: number, adminTok: string): Promise<void> {
  126 |     await this.del(`/api/admin/products/${id}`, adminTok);
  127 |   }
  128 | }
  129 | 
```