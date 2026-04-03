| Module/Feature | High-Risk Function | Test Automated? (Yes/No) | Coverage % | Notes |
|---|---|---|---|---|
| Authentication | User registration (`POST /api/auth/register`) | Yes | 100% | Covered by `tests/auth/TC-AUTH-registration.spec.ts` and duplicate-email persistence handling in `tests/system/TC-DB-transactions.spec.ts`. |
| Authentication | User login (`POST /api/auth/login`) | Yes | 100% | Covered by `tests/auth/TC-AUTH-login.spec.ts` including positive and negative credential paths. |
| Authentication | Session identity lookup (`GET /api/auth/me`) | Yes | 100% | Covered by `tests/auth/TC-AUTH-login.spec.ts`, `tests/auth/TC-AUTHZ-authorization.spec.ts`, and token-security tests. |
| Authentication | Authorization guards for protected/admin routes | Yes | 100% | Covered by `tests/auth/TC-AUTHZ-authorization.spec.ts` against customer and admin routes. |
| Authentication | Token/password security behavior | Yes | 100% | Covered by `tests/auth/TC-TOKEN-security.spec.ts` through token tampering and password round-trip checks. |
| Shopping Cart | Add item to cart (`POST /api/cart/items`) | Yes | 86% | Covered by `tests/cart/TC-CART-add-item.spec.ts`. Module coverage is `6/7` because one cart function lacks direct automation. |
| Shopping Cart | Update cart item quantity (`PUT /api/cart/items/{product_id}`) | Yes | 86% | Covered by `tests/cart/TC-CART-update-item.spec.ts`. |
| Shopping Cart | Remove cart item (`DELETE /api/cart/items/{product_id}`) | Yes | 86% | Covered by `tests/cart/TC-CART-remove-clear.spec.ts`. |
| Shopping Cart | Clear cart (`POST /api/cart/clear`) | Yes | 86% | Covered by `tests/cart/TC-CART-remove-clear.spec.ts`. |
| Shopping Cart | Apply coupon (`POST /api/cart/coupon`) | Yes | 86% | Covered by `tests/cart/TC-COUPON-coupon.spec.ts`. |
| Shopping Cart | Remove coupon (`DELETE /api/cart/coupon`) | No | 86% | No direct test script in `/tests` exercises coupon removal; current automation only covers coupon application. |
| Shopping Cart | Set shipping method (`POST /api/cart/shipping`) | Yes | 86% | Covered by `tests/cart/TC-SHIP-shipping.spec.ts`. |
| Checkout and Order Creation | Create order / checkout (`POST /api/orders`) | Yes | 100% | Covered by `tests/orders/TC-ORDER-checkout.spec.ts`. |
| Checkout and Order Creation | Retrieve user order list (`GET /api/orders`) | Yes | 100% | Covered by `tests/orders/TC-ORD-management.spec.ts`. |
| Checkout and Order Creation | Retrieve order details (`GET /api/orders/{order_id}`) | Yes | 100% | Covered by `tests/orders/TC-ORD-management.spec.ts` and snapshot validation in checkout tests. |
| Checkout and Order Creation | Inventory deduction and stock protection during checkout | Yes | 100% | Covered by `tests/orders/TC-INV-inventory.spec.ts` and transaction checks in `tests/system/TC-DB-transactions.spec.ts`. |
| Admin Product Management | Create product (`POST /api/admin/products`) | Yes | 100% | Covered by `tests/products/TC-PROD-admin-crud.spec.ts`. |
| Admin Product Management | Update product (`PUT /api/admin/products/{id}`) | Yes | 100% | Covered by `tests/products/TC-PROD-admin-crud.spec.ts`. |
| Admin Product Management | Delete product (`DELETE /api/admin/products/{id}`) | Yes | 100% | Covered by `tests/products/TC-PROD-admin-crud.spec.ts`. |
| Order Status Updates | Update order status (`PUT /api/orders/{order_id}/status`) | Yes | 100% | Covered by `tests/orders/TC-ORD-management.spec.ts` for admin success and customer rejection. |
| Database Migration and Persistence | Schema migration applies cleanly before test execution | No | 80% | This is high risk in the assessment, but there is no dedicated `/tests` script validating Alembic migration success; it is handled operationally in setup/CI instead. |
| Database Migration and Persistence | Failed transaction rolls back cleanly | Yes | 80% | Covered by `tests/system/TC-DB-transactions.spec.ts` (`TC-DB-001`). |
| Database Migration and Persistence | Successful transaction commits atomically | Yes | 80% | Covered by `tests/system/TC-DB-transactions.spec.ts` (`TC-DB-002`). |
| Database Migration and Persistence | DB sessions close cleanly across repeated requests | Yes | 80% | Covered by `tests/system/TC-DB-transactions.spec.ts` (`TC-DB-003`), though it is a lightweight proxy rather than deep pool instrumentation. |
| Database Migration and Persistence | DB unique constraints surface as controlled 4xx errors | Yes | 80% | Covered by `tests/system/TC-DB-transactions.spec.ts` (`TC-DB-004`). |

Overall automation coverage across high-risk functions: `23 / 25 x 100 = 92%`

Coverage model used:
- High-risk modules were taken from `docs/risk-assessment.md` section "High-Priority Testing Areas".
- Coverage was calculated at the high-risk function level by matching implemented `/tests` scripts to the corresponding API route or persistence behavior.
- A function was counted as automated when at least one implemented test script exercised it directly.
