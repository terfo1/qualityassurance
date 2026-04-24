/**
 * ApiClient — thin wrapper around Playwright's APIRequestContext.
 * Provides consistent auth header injection, JSON body handling, and
 * convenience helpers for obtaining seeded/registered user tokens.
 *
 * Usage:
 *   const client = new ApiClient(request);
 *   const token  = await client.adminToken();
 *   const res    = await client.get("/api/admin/dashboard", token);
 */
import { APIRequestContext } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8000";

// ── Shared token cache (per process) ────────────────────────────────────────
// Seeded users never change passwords, so we cache their tokens to avoid
// re-authenticating on every test.
const _tokenCache: Record<string, string> = {};

export class ApiClient {
  constructor(private req: APIRequestContext) {}

  // ── Low-level request helpers ─────────────────────────────────────────────

  private headers(token?: string) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  get(endpoint: string, token?: string) {
    return this.req.get(`${BASE}${endpoint}`, { headers: this.headers(token) });
  }

  post(endpoint: string, body: object = {}, token?: string) {
    return this.req.post(`${BASE}${endpoint}`, {
      headers: this.headers(token),
      data: body,
    });
  }

  put(endpoint: string, body: object = {}, token?: string) {
    return this.req.put(`${BASE}${endpoint}`, {
      headers: this.headers(token),
      data: body,
    });
  }

  del(endpoint: string, token?: string) {
    return this.req.delete(`${BASE}${endpoint}`, { headers: this.headers(token) });
  }

  // ── Auth helpers ──────────────────────────────────────────────────────────

  /** Logs in with the given credentials and returns the raw Bearer token. */
  async login(email: string, password: string): Promise<string> {
    const res = await this.post("/api/auth/login", { email, password });
    if (!res.ok()) {
      throw new Error(`Login failed for ${email}: HTTP ${res.status()} — ${await res.text()}`);
    }
    const body = await res.json();
    return body.token as string;
  }

  /** Returns the seeded admin token (cached). Admin: admin@novacart.local / Admin123! */
  async adminToken(): Promise<string> {
    if (!_tokenCache["admin"]) {
      _tokenCache["admin"] = await this.login("admin@novacart.local", "Admin123!");
    }
    return _tokenCache["admin"];
  }

  /** Returns the seeded demo-customer token (cached). Demo: demo@novacart.local / Demo123! */
  async demoToken(): Promise<string> {
    if (!_tokenCache["demo"]) {
      _tokenCache["demo"] = await this.login("demo@novacart.local", "Demo123!");
    }
    return _tokenCache["demo"];
  }

  /**
   * Registers a brand-new user and immediately logs in, returning the token.
   * Use this in beforeAll blocks to get an isolated user per describe group.
   */
  async registerAndLogin(email: string, password: string, fullName: string): Promise<string> {
    const reg = await this.post("/api/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    if (!reg.ok()) {
      throw new Error(`Registration failed: HTTP ${reg.status()} — ${await reg.text()}`);
    }
    return this.login(email, password);
  }

  // ── Cart helpers ──────────────────────────────────────────────────────────

  /** Clears the cart for the given token (idempotent). */
  async clearCart(token: string): Promise<void> {
    await this.post("/api/cart/clear", {}, token);
  }

  /**
   * Adds a product to the cart; returns the response body.
   * Throws if the request is not successful.
   */
  async addToCart(productId: number, quantity: number, token: string) {
    const res = await this.post("/api/cart/items", { product_id: productId, quantity }, token);
    if (!res.ok()) throw new Error(`addToCart failed: ${await res.text()}`);
    return res.json();
  }

  // ── Product helpers (admin) ───────────────────────────────────────────────

  /**
   * Creates a product as admin and returns the created product object.
   * Throws if creation fails.
   */
  async createProduct(payload: object, adminTok: string) {
    const res = await this.post("/api/admin/products", payload, adminTok);
    if (!res.ok()) throw new Error(`createProduct failed: ${await res.text()}`);
    return res.json();
  }

  /** Deletes a product by ID as admin. Tolerates 404. */
  async deleteProduct(id: number, adminTok: string): Promise<void> {
    await this.del(`/api/admin/products/${id}`, adminTok);
  }
}
