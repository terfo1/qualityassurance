| Module/Feature | High-Risk Level (High/Medium/Low) | Expected Defects | Defects Found | Pass/Fail | Notes |
|---|---|---|---:|---|---|
| Authentication | High | `2-5` defects typically expected in a high-risk access-control area during initial QA | 6 | Fail | Exceeded expectation. Failures were concentrated in login, registration, duplicate-email handling, and password-verification behavior from the saved full-suite artifact. |
| Shopping Cart | High | `2-5` defects expected because cart logic is transaction-sensitive and stateful | 3 | Pass | Failures were found in add/update/remove cart setup flows. The saved cart module run also shows registration-related setup failures causing some cases not to proceed. |
| Coupon Handling | Medium | `0-1` defect expected | 1 | Pass | One coupon-path failure was captured in the cart suite, but it appears coupled to upstream registration/setup instability rather than isolated coupon business logic. |
| Shipping Selection | Medium | `0-1` defect expected | 1 | Pass | One shipping-path failure was captured; the saved log points to setup failure during user registration before the shipping assertion itself. |
| Checkout and Order Creation | High | `2-5` defects expected because checkout is the main transaction flow | 2 | Pass | Failures were found in checkout creation and pricing coverage. One is a Playwright fixture misuse in the order suite, so not all discovered defects are confirmed product defects. |
| Order History and Order Details | Medium | `0-1` defect expected | 1 | Pass | One defect was found in order retrieval coverage (`GET /api/orders`) from the saved orders artifact. |
| Order Status Updates | High | `1-3` defects expected in admin workflow validation | 0 | Pass | No failing status-update test was recorded in the saved results. This means observed defects did not exceed expectation, not that the feature is proven defect-free. |
| Admin Product Management | High | `1-3` defects expected | 1 | Pass | One failure was found in admin product CRUD coverage. The saved product suite indicates an early failure blocked part of the remaining flow. |
| Admin Dashboard | Medium | `0-1` defect expected | 2 | Fail | Exceeded expectation. Two dashboard metric failures were recorded in the saved full-suite artifact, affecting required fields and low-stock count validation. |
| Product Catalog and Search/Filter | Medium | `0-1` defect expected | 0 | Pass | No catalog/filtering defect was recorded in the saved test results. |
| Product Details | Medium | `0-1` defect expected | 0 | Pass | No direct product-detail defect was recorded in the saved test results. |
| Product Reviews | Medium | `0-1` defect expected | 1 | Pass | One review/rating recalculation failure was recorded in the saved product-suite artifact. |
| Health Endpoint | Low | `0` defects expected | 0 | Pass | No health-endpoint defect was recorded; saved system results show health checks passing. |
| Metrics Endpoint | Low | `0` defects expected | 0 | Pass | No metrics-endpoint defect was recorded in the saved system results. |
| Database Migration and Persistence | High | `1-3` defects expected because persistence failures affect data integrity | 1 | Pass | One transaction/persistence defect was recorded in the saved system artifact. No separate automated migration-script failure was captured in `/tests`. |
| Frontend Delivery and UI Integration | Medium | `0-1` defect expected | 0 | Pass | The saved browser smoke suite passed `10/10`, so no UI smoke defect was observed in the existing evidence. |

Comparison rule used:
- `High` risk modules were treated as having an expected defect range of `2-5` for the most critical transactional/access areas, or `1-3` for narrower admin/persistence functions.
- `Medium` risk modules were treated as having an expected defect range of `0-1`.
- `Low` risk modules were treated as having an expected defect range of `0`.

Modules where actual defects exceeded expectations:
- Authentication
- Admin Dashboard

Evidence basis:
- Counts were taken from the saved Playwright artifact `evidence/tests-test-artifacts/results.json` and the existing module logs in `logs/`.
- This comparison reflects defects surfaced by the automated suite, including both product-behavior defects and some test-implementation defects such as Playwright fixture misuse.
