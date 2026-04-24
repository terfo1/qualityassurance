# Task 2: Expand Automation & Coverage

## Evidence Basis

This Task 2 deliverable uses the same evidence sources as Task 1 plus the newly added Task 2 test artifacts in the repository.

Primary references:

- `docs/task1-risk-refinement.md`
- `docs/QA_Test_Strategy_Assignment2.md`
- `github-actions-ci.yml`
- `tests/`
- `postman/`
- `evidence/`
- `logs/`

## Task 2.1 Extend Test Suite

The existing suite already covered most high-risk API workflows, but Task 1 identified four important weaknesses:

- no direct automation for coupon removal
- no clearly separated unit-test layer
- weak detectability in cart and checkout because some API suites reused Playwright request fixtures incorrectly
- no explicit Task 2 inventory of new high-risk tests across failure, edge, concurrency, and invalid-user scenarios

To address those gaps, 8 new test cases were added.

| Test ID | Level | Target module | Scenario type | Input data | Expected output | Actual result |
|---|---|---|---|---|---|---|
| `TC-UNIT-PRICE-EDGE-001` | Unit | Shopping Cart / Pricing | Edge | Inactive coupon with subtotal `64.0` | `discount = 0`, normal tax/shipping totals preserved | Passed in local `unittest` run |
| `TC-UNIT-CART-EDGE-002` | Unit | Shopping Cart | Edge | Cart with backpack item and applied `WELCOME10`, then coupon removal | `coupon_code = null`, `discount = 0`, totals recalculated upward | Passed in local `unittest` run |
| `TC-UNIT-CART-INVALID-003` | Unit | Shopping Cart | Invalid input | Shipping method `teleport` | `ValidationError` raised | Passed in local `unittest` run |
| `TC-COUPON-007` | Integration | Shopping Cart | Failure / edge | Apply then delete coupon for seeded demo user | Coupon removed and pricing returns to uncapped totals | Added; execution not performed in this session |
| `TC-CART-RACE-001` | Integration | Shopping Cart | Concurrency / repeated action | Two parallel add-item requests for the same seeded product | One cart line remains with merged quantity `2` | Added; execution not performed in this session |
| `TC-DB-005` | Integration | Database Migration and Persistence | Failure / baseline validation | Seeded admin and demo login plus `/api/metrics` call | Migrated startup exposes seeded users and working baseline metrics | Added; execution not performed in this session |
| `TC-AUTHZ-007` | Integration | Admin Access Control | Invalid user behavior | Customer token requests `/api/admin/dashboard` | `403` with admin access denial | Added; execution not performed in this session |
| `TC-E2E-CART-001` | E2E | Frontend Delivery / Cart Access | Invalid user behavior | Unauthenticated navigation to `/cart` | Login-required gate visible and checkout action unavailable | Added; execution not performed in this session |

Mandatory category coverage:

- Failure scenarios:
  - `TC-COUPON-007`
  - `TC-DB-005`
- Edge cases:
  - `TC-UNIT-PRICE-EDGE-001`
  - `TC-UNIT-CART-EDGE-002`
- Concurrency / race conditions:
  - `TC-CART-RACE-001`
- Invalid user behavior:
  - `TC-UNIT-CART-INVALID-003`
  - `TC-AUTHZ-007`
  - `TC-E2E-CART-001`

New repository artifacts added for Task 2:

- `backend_tests/test_task2_unit.py`
- `tests/cart/TC-COUPON-removal.spec.ts`
- `tests/cart/TC-CART-concurrency.spec.ts`
- `tests/system/TC-DB-seeded-baseline.spec.ts`
- `tests/admin/TC-AUTHZ-admin-api.spec.ts`
- `postman/cart-guard.spec.ts`

## Task 2.2 Required Test Types

### A. Unit Tests

Unit coverage is now explicitly represented by backend Python tests against service-layer logic:

- `PricingService.calculate()`
- `CartService.remove_coupon()`
- `CartService.set_shipping_method()`

These tests isolate business rules without relying on FastAPI routing, Playwright, browser state, or database setup. This closes the earlier academic gap where the repo had integration and E2E evidence but no clearly separated unit-test layer.

### B. Integration Tests

Playwright API tests in `tests/` remain the integration layer because they exercise:

- FastAPI routes
- dependency wiring
- authentication and authorization
- service logic
- persistence-backed workflows

The new integration cases deliberately avoid the old `beforeAll` request-fixture misuse by creating `ApiClient` inside each test and relying on seeded credentials where possible.

### C. End-to-End Tests

Browser tests under `postman/` remain the E2E layer. The new cart-guard scenario adds explicit user-facing evidence that unauthenticated users cannot proceed to checkout UI actions without authentication.

### D. Required Evidence

Code evidence:

- unit tests: `backend_tests/test_task2_unit.py`
- integration tests: `tests/cart/TC-COUPON-removal.spec.ts`, `tests/cart/TC-CART-concurrency.spec.ts`, `tests/system/TC-DB-seeded-baseline.spec.ts`, `tests/admin/TC-AUTHZ-admin-api.spec.ts`
- E2E test: `postman/cart-guard.spec.ts`

Execution evidence available in this implementation session:

- local backend unit-test execution completed successfully
- Playwright API and browser test discovery completed successfully for the newly added specs

Execution evidence still inherited from Assignment 2:

- API logs and summaries under `logs/` and `evidence/`
- browser smoke logs and summaries under `logs/postman-test.log` and `evidence/postman-test-summary.png`

## Task 2.3 CI/CD Execution

The CI/CD baseline remains `github-actions-ci.yml`. Task 2 extends it by adding a dedicated backend unit-test stage before migrations and Playwright execution.

Updated pipeline behavior:

1. checkout repository
2. set up Python and Node.js
3. install backend dependencies
4. run backend unit tests
5. run Alembic migrations
6. start FastAPI
7. verify API health
8. install API test dependencies
9. run Playwright API integration tests with HTML and JUnit output
10. install smoke/E2E dependencies
11. run browser smoke/E2E tests with HTML and JUnit output
12. upload artifacts and logs
13. alert on failure
14. stop the service

This directly satisfies the Task 2 CI/CD requirement that automation run in a pipeline rather than manually only.

Evidence links for CI/CD interpretation:

- workflow file: `github-actions-ci.yml`
- prior CI/CD explanation: `docs/QA_Test_Strategy_Assignment2.md`
- prior pipeline evidence references: `evidence/CI_CD_PIPELINE_TABLE.md`

## Task 2.4 Quality Gates

Task 2 uses the following measurable gates:

| Quality Gate ID | Metric | Threshold | Current interpretation |
|---|---|---|---|
| `QG-001` | High-risk automation coverage | `>= 80%` overall and no high-risk module below `70%` | Still defensible; coupon removal gap is now addressed in code, but fresh execution evidence is still pending |
| `QG-002` | Critical failures | `0` allowed in auth, checkout, persistence, and admin access control | Still blocked by unresolved Assignment 2 failures until rerun confirms fixes or remaining product defects |
| `QG-003` | Regression pass rate | `100%` for approved regression suite | Not yet demonstrated after Task 2 additions because full rerun was not performed in this session |
| `QG-004` | CI completeness | unit + integration + E2E all executed in pipeline | Workflow now includes an explicit unit-test step and retains API + browser stages |

### Critical Analysis

The thresholds are mostly appropriate, but the previous pipeline evidence showed that the suite was not yet a clean release gate because:

- some failures were real product/API mismatches
- some failures were caused by test-harness misuse
- some high-risk scenarios were still uncovered

Task 2 improves that position by:

- adding the missing unit-test layer
- adding direct coupon-removal coverage
- adding migration/baseline validation coverage
- adding user-behavior and access-control expansion
- adding an explicit CI unit-test stage

However, the strictest gate remains the regression-pass gate. It is correct academically, but it will continue to fail until the old unstable Playwright suites are cleaned up or rerun successfully.

## Verification Summary

Completed in this implementation session:

- added 8 new tests across all 3 required levels
- updated `github-actions-ci.yml` with a backend unit-test step
- created this Task 2 Markdown deliverable

Validation performed:

- backend unit tests executed locally
- new Playwright API tests parsed through test discovery
- new Playwright E2E test parsed through test discovery

Not completed in this session:

- full live rerun of the API integration and browser E2E suites against a running migrated service stack

## Conclusion

Task 2 is now implemented at the repository level: the suite has been expanded with new high-risk scenarios, the required unit/integration/E2E structure is explicit, and CI/CD has been updated to include backend unit testing. The remaining limitation is not design completeness but execution completeness: a fresh end-to-end pipeline run is still needed to convert the new tests from implemented coverage into final pass/fail evidence for submission.
