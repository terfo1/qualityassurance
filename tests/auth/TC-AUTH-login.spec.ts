/**
 * Test Suite : User Login
 * Endpoint   : POST /api/auth/login
 * Coverage   : TC-LOGIN-001 … TC-LOGIN-006
 *
 * Positive: valid credentials return token; token structure is valid
 * Negative: wrong password, unknown email, inactive user, empty credentials
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, SEED } from "../helpers/test-data";

test.describe("Login — POST /api/auth/login", () => {
  // ── Positive ───────────────────────────────────────────────────────────────

  test("TC-LOGIN-001 | valid credentials → 200 with token string", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.post("/api/auth/login", {
      email: SEED.users.DEMO.email,
      password: SEED.users.DEMO.password,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(20);
  });

  test("TC-LOGIN-002 | token encodes user identity (GET /api/auth/me returns correct user)", async ({ request }) => {
    const client = new ApiClient(request);
    const token  = await client.demoToken();

    const me = await client.get("/api/auth/me", token);
    expect(me.status()).toBe(200);
    const body = await me.json();

    // Token must resolve to the demo user
    expect(body.email).toBe(SEED.users.DEMO.email);
    expect(body.role).toBe("customer");
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("TC-LOGIN-003 | wrong password → 401 (no token in response)", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.post("/api/auth/login", {
      email: SEED.users.DEMO.email,
      password: "absolutely_wrong_password",
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.token).toBeUndefined();
  });

  test("TC-LOGIN-004 | non-existent email → 401 (must not reveal whether email exists)", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.post("/api/auth/login", {
      email: "ghost@nowhere.novacart.local",
      password: "SomePassword1",
    });

    // 401, not 404 — prevents user enumeration
    expect(res.status()).toBe(401);
  });

  test("TC-LOGIN-005 | inactive user → 401", async ({ request }) => {
    // NOTE: This test registers a new user then requires the DB is_active flag
    // to be set to false externally (manual step or admin API if available).
    // Here we verify the *login path* rejects an inactive account.
    // If no admin deactivation endpoint exists, mark this test as @skip and
    // cover it via a direct DB integration test.
    test.skip(true, "Requires DB-level deactivation; cover in integration test layer.");
  });

  test("TC-LOGIN-006 | empty credentials → 422 (DTO validation)", async ({ request }) => {
    const client = new ApiClient(request);

    const res = await client.post("/api/auth/login", { email: "", password: "" });

    expect(res.status()).toBe(422);
  });
});
