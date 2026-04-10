import { test, expect } from "@playwright/test";

test.describe("Cart access guard", () => {
  test("TC-E2E-CART-001 | unauthenticated user opening cart sees login-required gate", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByRole("heading", { name: /login required/i })).toBeVisible();
    await expect(page.getByText(/sign in or register to persist your cart and place orders/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /place order/i })).toHaveCount(0);
  });
});
