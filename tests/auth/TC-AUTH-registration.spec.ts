/**
 * Test Suite : User Registration
 * Endpoint   : POST /api/auth/register
 * Coverage   : TC-AUTH-001 … TC-AUTH-006
 *
 * Positive: valid registration, default role/active state
 * Negative: duplicate email, short password, short email, short full_name
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { validUser, uniqueEmail } from "../helpers/test-data";

test.describe("Registration — POST /api/auth/register", () => {
  // ── Positive ───────────────────────────────────────────────────────────────

  test("TC-AUTH-001 | valid payload → 201 with user object (no password exposed)", async ({ request }) => {
    const client = new ApiClient(request);
    const payload = validUser();

    const res = await client.post("/api/auth/register", payload);

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(payload.email);
    expect(body.full_name).toBe(payload.full_name);
    expect(body.id).toBeDefined();
    // Sensitive fields must never be returned
    expect(body.password).toBeUndefined();
    expect(body.password_hash).toBeUndefined();
  });

  test("TC-AUTH-002 | newly registered user defaults: role=customer, is_active=true", async ({ request }) => {
    const client = new ApiClient(request);
    const payload = validUser();

    const res = await client.post("/api/auth/register", payload);
    expect(res.status()).toBe(201);
    const body = await res.json();

    // Default role must be 'customer', not admin
    expect(body.role).toBe("customer");
    // Account must be immediately usable — no manual activation required
    expect(body.is_active).toBe(true);
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("TC-AUTH-003 | duplicate email → 4xx (email already registered)", async ({ request }) => {
    const client = new ApiClient(request);
    const payload = validUser();

    // First registration must succeed
    const first = await client.post("/api/auth/register", payload);
    expect(first.ok()).toBe(true);

    // Second registration with same email must be rejected
    const second = await client.post("/api/auth/register", payload);
    expect(second.ok()).toBe(false);
    expect([400, 409]).toContain(second.status());
  });

  test("TC-AUTH-004 | password shorter than 8 chars → 422", async ({ request }) => {
    const client = new ApiClient(request);
    const payload = validUser({ password: "short" }); // 5 chars — below min_length=8

    const res = await client.post("/api/auth/register", payload);

    expect(res.status()).toBe(422);
  });

  test("TC-AUTH-005 | email shorter than 5 chars → 422", async ({ request }) => {
    const client = new ApiClient(request);
    const payload = validUser({ email: "a@b" }); // 3 chars — below min_length=5

    const res = await client.post("/api/auth/register", payload);

    expect(res.status()).toBe(422);
  });

  test("TC-AUTH-006 | full_name shorter than 2 chars → 422", async ({ request }) => {
    const client = new ApiClient(request);
    const payload = validUser({ full_name: "X" }); // 1 char — below min_length=2

    const res = await client.post("/api/auth/register", payload);

    expect(res.status()).toBe(422);
  });
});
