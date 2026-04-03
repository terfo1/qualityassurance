/**
 * Test Suite : Health Check & System Metrics
 * Endpoints  : GET /api/metrics/health
 *              GET /api/metrics/metrics
 * Coverage   : TC-HEALTH-001 … TC-HEALTH-002
 *
 * Both endpoints are public (no auth required) and used by load balancers / monitoring.
 * They must return 200 even with no Authorization header.
 */
import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";

test.describe("Health Check — GET /api/metrics/health", () => {

  test("TC-HEALTH-001 | health endpoint returns {status: ok, service: novacart} without auth", async ({ request }) => {
    const client = new ApiClient(request);

    const res  = await client.get("/api/health"); // no token; route: GET /api/health (no /metrics prefix)
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.status).toBe("ok");
    expect(body.service).toBe("novacart");
  });

  test("TC-HEALTH-002 | health endpoint accessible without Authorization header (public route)", async ({ request }) => {
    const client = new ApiClient(request);

    // Explicitly confirm no 401 is returned for public health route
    const res = await client.get("/api/health");
    expect(res.status()).not.toBe(401);
    expect(res.status()).toBe(200);
  });
});

test.describe("System Metrics — GET /api/metrics", () => {

  test("TC-METRICS-001 | metrics endpoint returns product, category, and order counts", async ({ request }) => {
    const client = new ApiClient(request);

    const res  = await client.get("/api/metrics"); // route: GET /api/metrics (no /metrics/metrics)
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Required fields and type checks
    expect(typeof body.products).toBe("number");
    expect(typeof body.categories).toBe("number");
    expect(typeof body.orders).toBe("number");

    // Seeded catalogue has 8 products across 7 categories
    expect(body.products).toBeGreaterThanOrEqual(8);
    expect(body.categories).toBeGreaterThanOrEqual(1);
  });
});
