import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";

test("TC-AUTHZ-007 | customer token cannot access admin dashboard API", async ({ request }) => {
  const client = new ApiClient(request);
  const demoToken = await client.demoToken();

  const response = await client.get("/api/admin/dashboard", demoToken);
  expect(response.status()).toBe(403);

  const body = await response.json();
  expect(body.detail).toMatch(/admin access required/i);
});
