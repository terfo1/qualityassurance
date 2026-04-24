import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";

test("TC-DB-005 | migrated startup preserves seeded auth users and baseline metrics availability", async ({ request }) => {
  const client = new ApiClient(request);

  const adminToken = await client.adminToken();
  const demoToken = await client.demoToken();

  expect(adminToken).toBeTruthy();
  expect(demoToken).toBeTruthy();

  const meAdmin = await client.get("/api/auth/me", adminToken);
  expect(meAdmin.status()).toBe(200);
  const adminBody = await meAdmin.json();
  expect(adminBody.email).toBe("admin@novacart.local");
  expect(adminBody.role).toBe("admin");

  const meDemo = await client.get("/api/auth/me", demoToken);
  expect(meDemo.status()).toBe(200);
  const demoBody = await meDemo.json();
  expect(demoBody.email).toBe("demo@novacart.local");
  expect(demoBody.role).toBe("customer");

  const metrics = await client.get("/api/metrics");
  expect(metrics.status()).toBe(200);
  const metricsBody = await metrics.json();
  expect(metricsBody.products).toBeGreaterThan(0);
  expect(metricsBody.categories).toBeGreaterThan(0);
});
