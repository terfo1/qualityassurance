import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Authentication smoke", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/auth");

    await expect(page).toHaveTitle(/NovaCart Platform/i);
    await expect(page.getByRole("heading", { name: /login to continue/i })).toBeVisible();
  });

  test("invalid login shows validation or error message", async ({ page }) => {
    await page.goto("/auth");

    const inputs = page.locator("input");
    await inputs.nth(0).fill("demo@novacart.local");
    await inputs.nth(1).fill("wrongpass");

    await page.getByRole("button", { name: /^login$/i }).click();

    await expect(page.getByText(/error|invalid|incorrect/i)).toBeVisible();
  });

  test("authenticated user is shown as signed in", async ({ page, request }) => {
    await loginAsDemo(page, request);
    await page.goto("/auth");

    await expect(page.getByRole("heading", { name: /you are signed in/i })).toBeVisible();
    await expect(page.getByText(/demo@novacart\.local/i)).toBeVisible();
  });
});