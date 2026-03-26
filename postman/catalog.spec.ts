import { test, expect } from "@playwright/test";

test.describe("Catalog smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/NovaCart Platform/i);
    await expect(page.getByText(/novacart/i)).toBeVisible();
  });

  test("catalog page loads and shows product explorer", async ({ page }) => {
    await page.goto("/catalog");

    await expect(page.getByRole("heading", { name: /catalog explorer/i })).toBeVisible();
    await expect(page.getByText(/products matched/i)).toBeVisible();
  });

  test("product details page opens for seeded product", async ({ page, request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/products`);
    expect(response.ok()).toBeTruthy();

    const products = await response.json();
    expect(products.length).toBeGreaterThan(0);

    const firstProduct = products[0];

    await page.goto(`/product?id=${firstProduct.id}`);

    await expect(page.getByText(new RegExp(firstProduct.name, "i"))).toBeVisible();
  });
});