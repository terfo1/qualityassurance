# Task 1: Refine Risk-Based Testing Strategy

## Evidence Basis

This analysis is based on the saved Assignment 2 evidence only. No tests were rerun for this document.

Primary evidence used:

- `docs/risk-assessment.md`
- `evidence/tests-test-artifacts/results.json`
- `evidence/test-auth-artifacts/results.json`
- `evidence/test-cart-artifacts/results.json`
- `evidence/test-orders-artifacts/results.json`
- `evidence/test-products-artifacts/results.json`
- `evidence/test-system-artifacts/results.json`
- `evidence/AUTOMATION_COVERAGE_TABLE.md`
- `evidence/DEFECTS_RISK_COMPARISON_TABLE.md`
- `logs/test-auth.log`
- `logs/test-cart.log`
- `logs/test-orders.log`
- `logs/test-products.log`
- `logs/test-system.log`

## Task 1.1 Re-evaluate High-Risk Components

| Module | Original Risk Score | Observed Issues (A2) | Updated Risk Score | Justification |
|---|---|---|---|---|
| Authentication | Critical | Login negative-path tests returned `400` instead of expected `401`; registration responses missed expected fields; registration also produced `500` in downstream setup flows; password verification negative path also failed. | Critical | This module still shows repeated failures in access-control and account-creation paths. It also destabilizes cart and order suites because user setup depends on registration. |
| Shopping Cart | Critical | Cart add/update/remove, coupon, and shipping tests failed; some failures were caused by upstream registration `500` responses and some by Playwright fixture misuse in setup. Coverage remains `86%`. | Critical | Even where some failures are automation-related, the module remains central to the buyer journey and currently has reduced detectability because setup instability blocks broad regression confidence. |
| Checkout and Order Creation | Critical | Checkout, inventory, and order-list tests failed; failures include fixture misuse and order-flow setup instability. | Critical | This is still the main transaction path. Saved evidence shows unresolved failures in checkout-related coverage, so both business impact and current execution risk remain critical. |
| Admin Product Management | High | Product creation test failed, but the saved error points to Playwright fixture reuse rather than a confirmed API business defect. Coverage remains `100%`. | High | The area remains important, but the current evidence does not justify raising it above the original level because the main observed failure is test-harness related. |
| Database Migration and Persistence | High | Rollback validation failed in `TC-DB-001`; explicit migration validation is still not directly automated; persistence coverage is partial at `80%`. | High | Data integrity remains a major concern, but the defect volume is lower than auth and checkout. Risk stays high because failures here affect transaction correctness and system trust. |

## Task 1.2 Extract Evidence from Automation Runs

### A. Failed Test Cases

Frequency below means how often the same failure appears in the preserved suite artifacts.

| Test name / ID | Module affected | Failure type | Frequency |
|---|---|---|---|
| `TC-LOGIN-003` wrong password -> expected `401`, got `400` | Authentication | Validation / auth status mismatch | `2/2` |
| `TC-LOGIN-004` non-existent email -> expected `401`, got `400` | Authentication | Validation / auth status mismatch | `2/2` |
| `TC-AUTH-001` valid registration response missing expected `email` field | Authentication | Response schema / payload mismatch | `2/2` |
| `TC-AUTH-002` registration defaults not returned as expected; focused auth log also shows registration `500` during setup-related flows | Authentication | Response schema mismatch / server error | `2/2` |
| `TC-AUTH-003` duplicate email behavior flagged in full-suite artifact set | Authentication | Validation / duplicate handling mismatch | `1/1` |
| `TC-PWD-003` wrong password verification -> expected `401`, got `400` | Authentication | Validation / auth status mismatch | `2/2` |
| `TC-CART-001` add item setup failed because registration returned `500` | Shopping Cart | Upstream server error | `2/2` |
| `TC-CART-007` update quantity setup failed because registration returned `500` | Shopping Cart | Upstream server error | `2/2` |
| `TC-CART-011` remove item failed because Playwright `request` fixture was reused from `beforeAll` | Shopping Cart | Automation defect / fixture misuse | `2/2` |
| `TC-COUPON-001` coupon application failed because Playwright `request` fixture was reused from `beforeAll` | Shopping Cart | Automation defect / fixture misuse | `2/2` |
| `TC-SHIP-001` shipping selection setup failed because registration returned `500` | Shopping Cart | Upstream server error | `2/2` |
| `TC-INV-001` inventory-on-checkout setup failed; focused orders log shows registration `500`, full suite shows fixture-related setup breakage | Checkout and Order Creation | Upstream server error / automation defect | `2/2` |
| `TC-ORD-001` user order list failed; focused orders log shows Playwright fixture misuse in `get` setup | Checkout and Order Creation | Automation defect / fixture misuse | `2/2` |
| `TC-ORDER-001` checkout flow failed because Playwright `request` fixture was reused from `beforeAll` | Checkout and Order Creation | Automation defect / fixture misuse | `2/2` |
| `TC-PROD-001` create product failed because Playwright `request` fixture was reused from `beforeAll` | Admin Product Management | Automation defect / fixture misuse | `2/2` |
| `TC-DB-001` rollback check expected stock `5` but received `undefined` | Database Migration and Persistence | Data consistency / rollback assertion failure | `2/2` |

### B. Flaky Tests (Instability Analysis)

No flaky tests were recorded in the saved evidence set.

- `evidence/tests-test-artifacts/results.json` reports `flaky: 0`
- `evidence/test-auth-artifacts/results.json` reports `flaky: 0`
- `evidence/test-cart-artifacts/results.json` reports `flaky: 0`
- `evidence/test-orders-artifacts/results.json` reports `flaky: 0`
- `evidence/test-products-artifacts/results.json` reports `flaky: 0`
- `evidence/test-system-artifacts/results.json` reports `flaky: 0`

Interpretation:

- There is no preserved pass/fail inconsistency across runs that supports labeling any saved test as flaky.
- The main instability in the evidence is not flakiness; it is deterministic failure caused by product issues and test-harness misuse.

### C. Coverage Gaps

| High-risk module | Coverage | Gap |
|---|---:|---|
| Authentication | `100%` | No direct high-risk function gap recorded in the current model. |
| Shopping Cart | `86%` | `DELETE /api/cart/coupon` is not directly automated. |
| Checkout and Order Creation | `100%` | No direct high-risk function gap recorded in the current model. |
| Admin Product Management | `100%` | No direct high-risk function gap recorded in the current model. |
| Database Migration and Persistence | `80%` | No direct test validates Alembic migration success as a test case; migration verification is only operational in setup/CI. |

Required highlight:

- No selected high-risk module is below `70%` coverage.
- Remaining coverage concerns still reduce confidence because the missing scenarios sit in meaningful high-risk behavior:
  - coupon removal
  - explicit migration validation

### D. Unexpected System Behavior

Observed unexpected behavior not cleanly predicted in Assignment 1:

- Registration returned `HTTP 500` during several cart and order setup flows, causing cascaded failures outside the auth suite.
- Admin dashboard `low_stock` behaved like an array/object rather than a numeric count expected by the tests.
- The rollback validation in `TC-DB-001` returned `undefined` stock for the follow-up product check, which suggests a persistence or response-shape issue during transaction verification.
- Multiple suites failed because Playwright reused the `request` fixture from `beforeAll`, which introduced false negatives unrelated to confirmed product logic.
- Playwright also reported that the HTML reporter output folder clashes with the test-results folder, creating risk of artifact loss during report generation.

## Task 1.3 Map Evidence to Risk Dimensions

| Module | Likelihood | Impact | Detectability | Rationale |
|---|---|---|---|---|
| Authentication | High | High | Medium | Repeated direct failures were observed in login and registration behavior. Detectability is only medium because the suite finds defects, but auth instability also pollutes downstream setup. |
| Shopping Cart | Medium-High | High | Low | Failures exist across add/update/remove/coupon/shipping, but some are caused by auth setup and fixture misuse. Detectability is low because the saved suite cannot cleanly separate product defects from automation defects. |
| Checkout and Order Creation | Medium-High | Very High | Low | Checkout, order retrieval, and inventory coverage failed in the saved runs. Detectability is low because fixture misuse blocks clean execution of several critical transaction tests. |
| Admin Product Management | Medium | High | Low-Medium | Business impact stays high because admin CRUD affects catalog integrity. Likelihood is lower than core purchase flow because the main recorded failure is automation-related rather than a confirmed product bug. |
| Database Migration and Persistence | Medium | High | Medium-Low | Transaction integrity is business-critical and one rollback test failed. Detectability remains weaker than desired because explicit migration validation is still not directly automated. |

## Conclusion

The saved Assignment 2 evidence supports keeping the original high-risk priorities intact rather than lowering them. Authentication, Shopping Cart, and Checkout/Order Creation remain the most critical modules because they combine high business impact with unresolved failures and reduced regression confidence. Admin Product Management and Database Migration/Persistence remain high risk because the observed evidence still shows either automation instability or incomplete verification in areas that affect catalog integrity and data consistency.

The strongest Task 1 insight is that the current risk picture is shaped by both product defects and automation quality problems. This means risk prioritization should not be reduced simply because coverage exists. In several modules, detectability is weakened by test-harness defects and incomplete coverage, which increases practical testing risk even when the nominal coverage percentage is acceptable.
