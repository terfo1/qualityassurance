| Evidence ID | Module/Feature | Type | Description | File Location |
| --- | --- | --- | --- | --- |
| EV-001 | API Full Suite | Screenshot | Playwright HTML report summary for `tests` full run; 37 passed, 20 failed, 53 did not run. | /Users/marioscordia/Desktop/qualityassurance/evidence/tests-test-summary.png |
| EV-002 | API Full Suite | Log | Console log for `npm run test`; includes HTML reporter folder clash warning and failing test details. | /Users/marioscordia/Desktop/qualityassurance/logs/tests-test.log |
| EV-003 | Auth API | Screenshot | HTML report summary for `npm run test:auth`; 21 passed, 5 failed, 1 skipped. | /Users/marioscordia/Desktop/qualityassurance/evidence/test-auth-summary.png |
| EV-004 | Auth API | Log | Console log for auth-focused API suite; failures include registration and wrong-password expectations. | /Users/marioscordia/Desktop/qualityassurance/logs/test-auth.log |
| EV-005 | Cart API | Screenshot | HTML report summary for `npm run test:cart`; 5 failed and 19 did not run after early setup failures. | /Users/marioscordia/Desktop/qualityassurance/evidence/test-cart-summary.png |
| EV-006 | Cart API | Log | Console log for cart-focused API suite; failures show registration/login setup returning HTTP 500. | /Users/marioscordia/Desktop/qualityassurance/logs/test-cart.log |
| EV-007 | Orders API | Screenshot | HTML report summary for `npm run test:orders`; 3 failed and 15 did not run. | /Users/marioscordia/Desktop/qualityassurance/evidence/test-orders-summary.png |
| EV-008 | Orders API | Log | Console log for order-focused API suite; failures include Playwright `request` fixture reuse in setup. | /Users/marioscordia/Desktop/qualityassurance/logs/test-orders.log |
| EV-009 | Products API | Screenshot | HTML report summary for `npm run test:products`; 7 passed, 2 failed, 11 did not run. | /Users/marioscordia/Desktop/qualityassurance/evidence/test-products-summary.png |
| EV-010 | Products API | Log | Console log for product/admin-review API suite; failures include product creation/review setup paths. | /Users/marioscordia/Desktop/qualityassurance/logs/test-products.log |
| EV-011 | System API | Screenshot | HTML report summary for `npm run test:system`; 10 passed, 3 failed, 3 did not run. | /Users/marioscordia/Desktop/qualityassurance/evidence/test-system-summary.png |
| EV-012 | System API | Log | Console log for system/admin metrics suite; failures include dashboard metrics and DB rollback assertions. | /Users/marioscordia/Desktop/qualityassurance/logs/test-system.log |
| EV-013 | Browser Smoke | Screenshot | Playwright HTML report summary for `postman` browser smoke suite; 10 passed after installing Chromium. | /Users/marioscordia/Desktop/qualityassurance/evidence/postman-test-summary.png |
| EV-014 | Browser Smoke | Log | Console log for browser smoke suite rerun; all 10 tests passed in Chromium. | /Users/marioscordia/Desktop/qualityassurance/logs/postman-test.log |
| EV-015 | API Script Status | Other | Exit-code index for targeted API scripts (`test:auth`, `test:cart`, `test:orders`, `test:products`, `test:system`). | /Users/marioscordia/Desktop/qualityassurance/logs/tests-script-exit-codes.csv |
