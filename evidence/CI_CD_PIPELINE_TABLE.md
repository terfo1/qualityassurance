| Pipeline Step | Description | Tool/Framework | Trigger | Notes |
|---|---|---|---|---|
| Checkout code | Pulls the current repository content into the runner workspace | GitHub Actions `actions/checkout@v4` | On `push`, `pull_request`, `workflow_dispatch` | Required baseline step before dependency install or test execution |
| Set up Python | Installs Python `3.13` for backend dependencies and Alembic migrations | GitHub Actions `actions/setup-python@v5` | Same workflow trigger | Uses Python `3.13` to align with the current dependency set, including `psycopg[binary]` |
| Set up Node.js | Installs Node.js `20` and enables npm caching for both test suites | GitHub Actions `actions/setup-node@v4` | Same workflow trigger | Cache paths point to both `tests` and `postman` lockfiles |
| Install backend dependencies | Installs FastAPI, Uvicorn, SQLAlchemy, Alembic, and Psycopg | `pip`, `requirements.txt` | After environment setup | Backend must be available before API and smoke tests run |
| Run database migrations | Creates the CI schema state expected by the application and tests | Alembic | After backend dependency install | Uses the pipeline `DATABASE_URL` against the PostgreSQL service container |
| Start API service | Launches the FastAPI application in the background for test access | Uvicorn | After migrations | Writes server output to `uvicorn.log` for later upload |
| Wait for API health | Polls `/api/health` until the app is ready or fails fast | `curl` | Immediately after API startup | Prevents false negatives from tests starting before the service is live |
| Install API test dependencies | Installs the Playwright API test suite packages | npm / Playwright | After API health check | Uses the `tests/` workspace |
| Run API automated tests | Executes all API tests and emits HTML plus JUnit XML reports | Playwright | After API test dependency install | Uses a separate output directory to avoid the current reporter/output-folder clash |
| Install smoke test dependencies | Installs the browser smoke suite packages and Chromium | npm / Playwright | After API test execution | Uses the `postman/` workspace and installs the required browser binary |
| Run smoke tests | Executes browser smoke coverage and emits HTML plus JUnit XML reports | Playwright | After smoke dependency install | Produces browser-oriented artifacts for pass/fail inspection |
| Upload API reports | Stores HTML, JUnit, and raw API test artifacts in the workflow run | GitHub Actions `actions/upload-artifact@v4` | `always()` | Preserves evidence even on failed runs |
| Upload smoke reports | Stores smoke suite HTML and raw artifacts in the workflow run | GitHub Actions `actions/upload-artifact@v4` | `always()` | Keeps browser test evidence accessible from the CI run |
| Upload server logs | Publishes application startup/runtime logs for debugging | GitHub Actions `actions/upload-artifact@v4` | `always()` | Useful when health checks or API tests fail |
| Alert on pipeline failure | Sends a failure notification to a webhook endpoint | `curl` webhook call | `failure()` only | Requires repository secret `FAILURE_WEBHOOK_URL`; suitable for Slack, Teams, or similar |
| Stop API service | Terminates the background FastAPI process before job exit | shell | `always()` | Prevents orphaned processes in longer workflows |
