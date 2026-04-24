/**
 * test-data.ts — factories for generating unique, valid test payloads.
 *
 * Uniqueness is achieved via a monotonic counter combined with Date.now().
 * This keeps emails unique even when tests run in parallel within a process.
 *
 * Seeded reference data (from initial migration — do not modify):
 *   Products : id 1-8 (see comments below)
 *   Coupons  : WELCOME10 (10% off, min $50) | SHIPFREE ($8 off, min $40) | VIP25 (25% off, min $150)
 *   Users    : admin@novacart.local/Admin123!  |  demo@novacart.local/Demo123!
 */

let _counter = 0;
function seq() {
  return `${Date.now()}${++_counter}`;
}

// ── User factories ────────────────────────────────────────────────────────────

export function uniqueEmail(): string {
  return `qa_${seq()}@test.novacart.local`;
}

/** Returns a complete, valid registration payload with a guaranteed-unique email. */
export function validUser(overrides: Partial<{ email: string; password: string; full_name: string }> = {}) {
  return {
    email: uniqueEmail(),
    password: "TestPass99!",
    full_name: "QA Test User",
    ...overrides,
  };
}

// ── Product factories ─────────────────────────────────────────────────────────

/** Returns a complete, valid product creation payload. */
export function validProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: `QA Product ${seq()}`,
    category: "QA Category",
    price: 25.99,
    stock: 50,
    description: "Automated test product for QA purposes only.",
    image: "/img/qa-test.jpg",
    tags: ["qa", "test"],
    ...overrides,
  };
}

// ── Checkout factories ────────────────────────────────────────────────────────

/** Returns a complete, valid checkout payload. */
export function validCheckout(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    customer_name: "QA Customer",
    email: "qa-checkout@test.novacart.local",
    address: "99 QA Boulevard, Test City, TC 12345",
    shipping_method: "standard",
    ...overrides,
  };
}

// ── Seeded reference IDs ──────────────────────────────────────────────────────

/**
 * Seeded product catalogue (initial migration).
 * Stock levels reflect the DB seed; real stock changes as tests run.
 */
export const SEED = {
  products: {
    SHOES:     { id: 1, name: "AeroFit Running Shoes",    category: "Footwear",     price: 89.0,  stock: 18 },
    BACKPACK:  { id: 2, name: "Summit Travel Backpack",   category: "Accessories",  price: 64.0,  stock: 24 },
    LAMP:      { id: 3, name: "Luma Desk Lamp",           category: "Home",         price: 42.5,  stock: 31 },
    HEADPHONES:{ id: 4, name: "Mono Wireless Headphones", category: "Electronics",  price: 129.0, stock: 12 },
    MUG:       { id: 5, name: "Terra Ceramic Mug",        category: "Home",         price: 19.0,  stock: 40 },
    TEE:       { id: 6, name: "Core Performance Tee",     category: "Apparel",      price: 29.0,  stock: 26 },
    RISER:     { id: 7, name: "Oak Stand Monitor Riser",  category: "Office",       price: 74.0,  stock: 14 },
    BOTTLE:    { id: 8, name: "Pulse Smart Bottle",       category: "Wellness",     price: 36.0,  stock: 22 },
  },
  coupons: {
    WELCOME10: { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 50  },
    SHIPFREE:  { code: "SHIPFREE",  type: "fixed",   value: 8,  minSubtotal: 40  },
    VIP25:     { code: "VIP25",     type: "percent", value: 25, minSubtotal: 150 },
  },
  users: {
    ADMIN: { email: "admin@novacart.local", password: "Admin123!" },
    DEMO:  { email: "demo@novacart.local",  password: "Demo123!"  },
  },
  shipping: {
    standard: 8.0,
    express:  18.0,
    pickup:   0.0,
  },
  TAX_RATE: 0.08,
} as const;

// ── Pricing helpers ───────────────────────────────────────────────────────────

/**
 * Mirrors PricingService.calculate() from app/domain/services.py.
 * Use in tests to compute the expected totals and assert against API response.
 */
export function expectedPricing(
  items: Array<{ price: number; quantity: number }>,
  shippingMethod: "standard" | "express" | "pickup" = "standard",
  coupon?: { type: "percent" | "fixed"; value: number; minSubtotal: number } | null,
) {
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  let discount = 0;
  if (coupon && subtotal >= coupon.minSubtotal) {
    discount =
      coupon.type === "percent"
        ? round2(subtotal * (coupon.value / 100))
        : round2(Math.min(coupon.value, subtotal));
  }
  const taxable = round2(Math.max(subtotal - discount, 0));
  const tax      = round2(taxable * SEED.TAX_RATE);
  const shipping = SEED.shipping[shippingMethod];
  const total    = round2(taxable + shipping + tax);
  return { subtotal, discount, shipping, tax, total };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
