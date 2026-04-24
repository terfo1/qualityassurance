| Module/Feature | Number of Test Cases | Execution Time per Test Case (sec) | Total Execution Time (sec) | Notes |
|---|---:|---:|---:|---|
| Authentication | 27 | 0.038 | 1.036 | Based on saved module run in `evidence/test-auth-artifacts/results.json`; includes 21 passed, 5 failed, 1 skipped. |
| Cart | 24 | 0.018 | 0.421 | Based on saved module run in `evidence/test-cart-artifacts/results.json`; many tests were skipped after early setup failures. |
| Orders | 18 | 0.032 | 0.571 | Based on saved module run in `evidence/test-orders-artifacts/results.json`; execution stopped early on fixture misuse failures. |
| Products | 20 | 0.023 | 0.463 | Based on saved module run in `evidence/test-products-artifacts/results.json`; 7 passed before failures blocked the rest. |
| System/Admin | 16 | 0.075 | 1.195 | Based on saved module run in `evidence/test-system-artifacts/results.json`; this is the slowest module by both total time and average time per case. |
| Full Suite | 111 | 0.018 | 1.955 | Based on saved full-run artifact in `evidence/tests-test-artifacts/results.json`; includes all implemented `/tests` specs. |

Slowest module: `System/Admin` at `1.195 sec` total and `0.075 sec` average per test case.

Suggested optimization:
- Isolate dashboard and transaction-heavy tests behind deterministic fixtures or dedicated seed resets so they do less repeated setup and fewer cross-module data reads; this should reduce repeated API/database work and make the slowest module more stable as well as faster.

Calculation notes:
- Test-case counts were taken from implemented specs under `/tests` by counting declared `test(...)` cases.
- Per-test execution time was calculated as `total module duration / number of test cases`.
- All timings come from existing Playwright JSON artifacts in `evidence/`; no tests were rerun.
