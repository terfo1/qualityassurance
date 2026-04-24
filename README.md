# NovaCart

NovaCart is a FastAPI commerce demo with a PostgreSQL database and a frontend served by the same backend process.

## Stack

- Python 3.12
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL 16
- Node.js 20
- Playwright

## Project Structure

- `app/` backend application code
- `frontend/` static frontend assets
- `alembic/` database migrations and seeded data
- `postman/` Playwright smoke tests
- `.github/workflows/qa.yml` CI smoke test workflow

## Prerequisites

Install these before starting:

- Python 3.12
- Node.js 20
- Docker Desktop or Docker Engine

## Environment Setup

1. Create a virtual environment:

```powershell
python -m venv .venv
```

2. Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

3. Install Python dependencies:

```powershell
pip install -r requirements.txt
```

4. Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Default values in `.env.example` already match the local Docker database:

```env
DATABASE_URL=postgresql+psycopg://novacart:novacart@localhost:5432/novacart
AUTH_SECRET=change-me-in-production
DEMO_EMAIL=demo@novacart.local
ADMIN_EMAIL=admin@novacart.local
```

## Start the Database

Run PostgreSQL with Docker Compose:

```powershell
docker compose up -d
```

## Apply Database Migrations

The first migration creates the schema and seeds demo data used by the app and smoke tests.

```powershell
alembic upgrade head
```

## Run the Application

Start the FastAPI server from the repository root:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open the app at:

- `http://127.0.0.1:8000`

Useful API endpoints:

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/metrics`
- `http://127.0.0.1:8000/docs`

## Seeded Accounts

These accounts are inserted by the Alembic migration and are used by the smoke tests:

- Admin: `admin@novacart.local` / `Admin123!`
- Demo user: `demo@novacart.local` / `Demo123!`

## Run UI Smoke Tests

The Playwright tests live in `postman/`.

1. Install Node dependencies:

```powershell
Set-Location postman
npm ci
```

2. Install Playwright Chromium:

```powershell
npx playwright install --with-deps chromium
```

3. Run the smoke suite:

```powershell
npx playwright test
```

The tests assume the app is already running at `http://127.0.0.1:8000`.

If your app runs on a different URL, set `BASE_URL` before running the tests:

```powershell
$env:BASE_URL="http://127.0.0.1:8001"
npx playwright test
```

## Run the Full Local Flow

From the repository root:

```powershell
docker compose up -d
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env -Force
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
Set-Location postman
npm ci
npx playwright install --with-deps chromium
npx playwright test
```

## Troubleshooting

### Playwright says browser executable does not exist

Install browsers in the same user context that runs the tests:

```powershell
npx playwright install --with-deps chromium
```

Do not install Playwright browsers with `sudo` in CI if the tests run as a normal user.

### The app does not start

Check that:

- Docker PostgreSQL is running
- `.env` exists
- `alembic upgrade head` completed successfully
- port `8000` is free

### Tests fail immediately with connection errors

Check that:

- `uvicorn` is running
- `http://127.0.0.1:8000/api/health` returns `{"status":"ok","service":"novacart"}`
- `BASE_URL` points to the running app

## Experimental Testing

Assignment 3 assets are included in this repository for the project’s critical modules: authentication, shopping cart, and checkout.

Baseline backend service tests:

```powershell
python -m unittest discover -s tests -p "test_*.py"
python scripts/coverage_runner.py
```

Performance scenarios:

```powershell
python scripts/load_test.py --scenario normal
python scripts/load_test.py --scenario peak
python scripts/load_test.py --scenario spike
python scripts/load_test.py --scenario endurance
```

Mutation testing:

```powershell
python scripts/mutation_runner.py
```

Chaos testing with opt-in fault injection:

```powershell
$env:QA_FAULT_INJECTION_ENABLED="true"
uvicorn app.main:app --host 127.0.0.1 --port 8000
python scripts/chaos_runner.py
```

Detailed assignment methodology, scenario tables, and reporting guidance are documented in `docs/experimental-engineering.md`.
