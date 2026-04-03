/**
 * Test Suite : Authorization Middleware
 * Module     : app/presentation/api/dependencies.py
 *              get_optional_current_user, get_current_user, get_admin_user
 * Coverage   : TC-AUTHZ-001 … TC-AUTHZ-005
 *
 * Positive: valid token grants access; admin token passes admin guard
 * Negative: missing token → 401; customer on admin route → 403; invalid token → 401
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser } from "../helpers/test-data";

test.describe("Authorization Middleware — get_current_user / get_admin_user", () => {
  // ── Positive ───────────────────────────────────────────────────────────────

  test("TC-AUTHZ-001 | valid customer token → 200 on customer-protected route", async ({ request }) => {
    const client = new ApiClient(request);
    const token  = await client.demoToken();

    const res = await client.get("/api/auth/me", token);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.email).toBeDefined();
  });

  test("TC-AUTHZ-002 | valid admin token → 200 on admin dashboard", async ({ request }) => {
    const client = new ApiClient(request);
    const token  = await client.adminToken();

    const res = await client.get("/api/admin/dashboard", token);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Dashboard must return these key metric fields
    expect(body.products).toBeDefined();
    expect(body.orders).toBeDefined();
    expect(body.revenue).toBeDefined();
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("TC-AUTHZ-003 | missing Authorization header → 401 on protected route", async ({ request }) => {
    const client = new ApiClient(request);

    // No token passed — get_current_user() must raise HTTP 401
    const res = await client.get("/api/auth/me");
    expect(res.status()).toBe(401);
  });

  test("TC-AUTHZ-004 | customer token on admin route → 403 (role check)", async ({ request }) => {
    const client      = new ApiClient(request);
    const customerTok = await client.demoToken(); // role = customer

    // get_admin_user() checks role == 'admin'; customer must be rejected with 403
    const res = await client.get("/api/admin/dashboard", customerTok);
    expect(res.status()).toBe(403);
  });

  test("TC-AUTHZ-005 | invalid/corrupted token → 401 on protected route", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.get("/api/auth/me", "Bearer invalid.token.here");
    expect(res.status()).toBe(401);
  });

  test("TC-AUTHZ-006 | newly registered customer cannot access admin routes", async ({ request }) => {
    const client  = new ApiClient(request);
    const payload = validUser();
    await client.post("/api/auth/register", payload);
    const token   = await client.login(payload.email, payload.password);

    // No matter how freshly registered, role must default to 'customer'
    const adminRes = await client.get("/api/admin/dashboard", token);
    expect(adminRes.status()).toBe(403);
  });
});
