/**
 * Playwright configuration for the NovaCart API test suite.
 * All tests target the REST API directly (no browser required).
 * Run: npx playwright test --config=tests/playwright.config.ts
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Serial at the project level; individual describes opt into parallel where safe.
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test-results/html" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://127.0.0.1:8000",
    extraHTTPHeaders: { "Content-Type": "application/json" },
  },
});
