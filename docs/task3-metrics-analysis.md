# Task 3: Metrics Collection

## Evidence Basis

This Task 3 report uses preserved repository evidence only. No tests were rerun for this document, and no post-Task-2 metric is presented as verified unless it already exists in the saved artifacts.

Primary evidence used:

- `docs/task1-risk-refinement.md`
- `docs/task2-automation-expansion.md`
- `docs/QA_Test_Strategy_Assignment2.md`
- `evidence/AUTOMATION_COVERAGE_TABLE.md`
- `evidence/DEFECTS_RISK_COMPARISON_TABLE.md`
- `evidence/EXECUTION_TIME_TABLE.md`
- `evidence/QUALITY_GATE_TABLE.md`
- `evidence/tests-test-artifacts/results.json`
- `evidence/test-auth-artifacts/results.json`
- `evidence/test-cart-artifacts/results.json`
- `evidence/test-orders-artifacts/results.json`
- `evidence/test-products-artifacts/results.json`
- `evidence/test-system-artifacts/results.json`
- `logs/`

## Task 3.1 Coverage Metrics

### High-Risk Module Coverage

| High-risk module | Measured coverage | Metric interpretation |
|---|---:|---|
| Authentication | `100%` | All selected high-risk auth functions were automated in the preserved baseline. |
| Shopping Cart | `86%` | Coverage is strong, but one meaningful cart behavior remained uncovered in the baseline model. |
| Checkout and Order Creation | `100%` | The main transaction flow is fully represented in the baseline automation model. |
| Admin Product Management | `100%` | Admin CRUD coverage is complete in the preserved baseline model. |
| Database Migration and Persistence | `80%` | Transaction behavior is covered, but migration validation remained only operational, not test-script based. |

Overall automation coverage across high-risk functions: `92%` (`23/25`).

Coverage conclusions:

- No selected high-risk module is below `70%`.
- The baseline evidence still shows two important gaps:
  - coupon removal
  - explicit migration validation
- Task 2 implemented tests for these areas, but a fresh rerun is still required before the measured percentages can be updated.

## Task 3.2 Defect Metrics

### Defects Found by Module

| Module/Feature | Risk level | Defects found | Pass/Fail vs expected range | Notes |
|---|---|---:|---|---|
| Authentication | High | `6` | Fail | Exceeded expected range and concentrated failures in core access-control behavior. |
| Shopping Cart | High | `3` | Pass | Defects were found, but the module stayed within the preserved expected range. |
| Coupon Handling | Medium | `1` | Pass | One coupon-path defect was recorded. |
| Shipping Selection | Medium | `1` | Pass | One shipping-path defect was recorded. |
| Checkout and Order Creation | High | `2` | Pass | Failures were recorded in the main transaction flow. |
| Order History and Order Details | Medium | `1` | Pass | One order-retrieval defect was recorded. |
| Order Status Updates | High | `0` | Pass | No saved failure was recorded for status update coverage. |
| Admin Product Management | High | `1` | Pass | One failure was recorded, but still within expected range. |
| Admin Dashboard | Medium | `2` | Fail | Exceeded expected range; this was the main medium-risk outlier. |
| Product Catalog and Search/Filter | Medium | `0` | Pass | No saved defect was recorded. |
| Product Details | Medium | `0` | Pass | No saved defect was recorded. |
| Product Reviews | Medium | `1` | Pass | One rating/review defect was recorded. |
| Health Endpoint | Low | `0` | Pass | No saved defect was recorded. |
| Metrics Endpoint | Low | `0` | Pass | No saved defect was recorded. |
| Database Migration and Persistence | High | `1` | Pass | One rollback/persistence defect was recorded. |
| Frontend Delivery and UI Integration | Medium | `0` | Pass | The saved browser smoke suite recorded no failures. |

### Defects Mapped to Risk Level

| Risk band | Defect pattern from saved evidence | Interpretation |
|---|---|---|
| High | Highest defect concentration appeared in authentication, cart, checkout, admin product management, and persistence-related areas. | This supports the original risk model: the most business-critical modules produced the most meaningful failures. |
| Medium | Most medium-risk modules stayed within expected range, but Admin Dashboard exceeded expectation with `2` defects. | The dashboard is the clearest medium-risk outlier in the preserved baseline. |
| Low | `0` defects recorded. | Low-risk technical endpoints behaved as expected in the saved evidence. |

Defect interpretation:

- The baseline defect distribution broadly matches the original risk priorities.
- The strongest exceptions are:
  - Authentication, which exceeded expected defect volume
  - Admin Dashboard, which exceeded expected medium-risk defect volume
- The evidence includes both product defects and automation defects, so defect count should be read as discovered quality risk rather than confirmed product-only fault count.

## Task 3.3 Execution Time and Efficiency

| Module run | Total execution time (sec) | Average time per test case (sec) | Efficiency interpretation |
|---|---:|---:|---|
| Authentication | `1.036` | `0.038` | Fast enough for frequent CI use. |
| Cart | `0.421` | `0.018` | Very fast, though some tests stopped early after setup failures. |
| Orders | `0.571` | `0.032` | Efficient runtime, but not a stable regression signal because of setup issues. |
| Products | `0.463` | `0.023` | Fast module runtime with partial downstream blockage after early failures. |
| System/Admin | `1.195` | `0.075` | Slowest preserved module run, but still far below the CI threshold. |
| Full suite | `1.955` | `0.018` | The full suite is operationally efficient from a feedback-speed perspective. |

Execution-time conclusions:

- `System/Admin` is the slowest measured module run.
- Even the slowest module is far below the `<= 10 minutes` quality gate.
- This means the main execution problem is not speed; it is regression trustworthiness in the presence of deterministic failures and test-harness defects.

## Task 3.4 Stability / Flaky Test Rate

### Preserved Result Stability

| Artifact | Passed | Failed | Skipped | Flaky | Flaky rate |
|---|---:|---:|---:|---:|---:|
| Full suite | `37` | `20` | `54` | `0` | `0%` |
| Auth module | `21` | `5` | `1` | `0` | `0%` |
| Cart module | `0` | `5` | `19` | `0` | `0%` |
| Orders module | `0` | `3` | `15` | `0` | `0%` |
| Products module | `7` | `2` | `11` | `0` | `0%` |
| System/Admin module | `10` | `3` | `3` | `0` | `0%` |

Stability conclusions:

- Every preserved Playwright artifact reports `flaky: 0`.
- No saved rerun evidence supports labeling any recorded case as flaky.
- The instability in the baseline comes from deterministic failures, setup breakage, and automation misuse rather than intermittent pass/fail behavior.

## Task 3.5 Comparative View: Baseline vs Post-Task-2 State

### Evidence-Based Comparison

| Metric area | Assignment 2 baseline | Post-Task-2 state | Evidence status |
|---|---|---|---|
| Coverage breadth | `92%` overall high-risk automation coverage | Additional tests for coupon removal, migration baseline validation, access control, concurrency, and unit coverage were implemented | Structural improvement implemented, but no fresh measured percentage yet |
| Defect count | Baseline defect counts are preserved in evidence tables | No valid post-Task-2 defect delta can be claimed without rerun evidence | Baseline only |
| Runtime efficiency | Full suite `1.955 sec`; all modules far below CI time gate | No valid post-Task-2 runtime delta can be claimed without rerun evidence | Baseline only |
| Stability / flaky rate | `0%` flaky rate across preserved artifacts | No valid post-Task-2 flaky-rate delta can be claimed without rerun evidence | Baseline only |
| CI completeness | Baseline CI covered integration and browser execution | Task 2 added an explicit backend unit-test stage to `github-actions-ci.yml` | Structural improvement implemented |

Comparison conclusion:

- A measured before-versus-after comparison is not yet available for:
  - runtime
  - defect count
  - flaky rate
  - regression pass rate
- What can be claimed from the repository state is narrower:
  - Task 2 improved test structure
  - Task 2 implemented missing high-risk scenarios
  - Task 2 improved CI completeness by adding backend unit tests
- A fresh pipeline rerun is still required before those changes can be translated into verified comparative metrics.

## Conclusion

The saved evidence shows that the NovaCart automation effort is already strong in coverage breadth and execution efficiency. High-risk coverage reached `92%`, every critical module is represented in the automation model, and all preserved module runs are fast enough for CI use.

The main weakness is not speed or flakiness. It is confidence in regression correctness. Authentication and Admin Dashboard exceeded expected defect levels, several critical-path modules still contain deterministic failures, and some failures were caused by automation misuse rather than business behavior alone. Task 2 improved the suite structurally, but Task 3 must still conclude from measured evidence that release readiness remains blocked until the updated suite is rerun and the new implementation state is converted into verified metrics.
