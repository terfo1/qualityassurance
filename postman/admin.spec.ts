import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsDemo } from "./helpers";

test.describe("Admin smoke", () => {
  test("non-admin user is blocked from admin page", async ({ page, request }) => {
    await loginAsDemo(page, request);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /admin access required/i })).toBeVisible();
  });

  test("admin user can open admin control room", async ({ page, request }) => {
    await loginAsAdmin(page, request);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /admin control room/i })).toBeVisible();
    await expect(page.getByText(/low stock watchlist/i)).toBeVisible();
    await expect(page.getByText(/status management/i)).toBeVisible();
    await expect(page.getByText(/current products/i)).toBeVisible();
  });
});