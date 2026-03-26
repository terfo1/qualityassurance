import { test, expect } from "@playwright/test";
import { loginViaApi, setAuthToken, addFirstProductToCart } from "./helpers";

test.describe("Cart and checkout smoke", () => {
  test("unauthenticated user sees login required on cart page", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByRole("heading", { name: /login required/i })).toBeVisible();
  });

  test("authenticated user can see cart page and pricing engine", async ({ page, request }) => {
    const payload = await loginViaApi(request, "demo@novacart.local", "Demo123!");
    await setAuthToken(page, payload.token);

    await addFirstProductToCart(request, payload.token);

    await page.goto("/cart");

    await expect(page.getByRole("heading", { name: /cart and pricing engine/i })).toBeVisible();
    await expect(page.getByText(/order summary/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /place order/i })).toBeVisible();
  });
});