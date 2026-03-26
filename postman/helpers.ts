import { expect, Page, APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "novacart_token";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
};

export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as LoginResponse;
}

export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: TOKEN_KEY, value: token }
  );
}

export async function loginAsDemo(page: Page, request: APIRequestContext): Promise<void> {
  const payload = await loginViaApi(request, "demo@novacart.local", "Demo123!");
  await setAuthToken(page, payload.token);
}

export async function loginAsAdmin(page: Page, request: APIRequestContext): Promise<void> {
  const payload = await loginViaApi(request, "admin@novacart.local", "Admin123!");
  await setAuthToken(page, payload.token);
}

export async function getFirstProductId(request: APIRequestContext): Promise<number> {
  const response = await request.get(`${BASE_URL}/api/products`);
  expect(response.ok()).toBeTruthy();

  const products = (await response.json()) as Array<{ id: number }>;
  expect(products.length).toBeGreaterThan(0);

  return products[0].id;
}

export async function addFirstProductToCart(
  request: APIRequestContext,
  token: string
): Promise<number> {
  const productId = await getFirstProductId(request);

  const response = await request.post(`${BASE_URL}/api/cart/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: {
      product_id: productId,
      quantity: 1,
    },
  });

  expect(response.ok()).toBeTruthy();
  return productId;
}