# Experimental Engineering for NovaCart

## 1. Purpose

This document adapts Assignment 3 to the current **NovaCart** repository. It covers reproducible performance testing, controlled mutation testing, and chaos or fault injection testing for the highest-risk modules identified in `docs/risk-assessment.md`.

The selected target modules are:

1. Authentication
2. Shopping cart
3. Checkout and order creation

These modules were chosen because they were classified as critical in the project risk matrix and they directly affect access control, transaction flow, and data integrity.

## 2. Experimental Setup

### Environment

Record the following before every execution run:

| Item | Value to Record |
|---|---|
| OS | Windows 11 or CI runner image |
| Python | `python --version` |
| Node.js | `node --version` |
| Database | PostgreSQL 16 via Docker Compose |
| App server | `uvicorn app.main:app --host 127.0.0.1 --port 8000` |
| Base URL | `http://127.0.0.1:8000` |
| Seed users | `demo@novacart.local`, `admin@novacart.local` |

### Repository Assets Used

| Area | Asset |
|---|---|
| Service tests | `tests/test_auth_service.py`, `tests/test_cart_service.py`, `tests/test_order_service.py` |
| Coverage summary | `scripts/coverage_runner.py` |
| Performance testing | `scripts/load_test.py` |
| Mutation testing | `scripts/mutation_runner.py` |
| Chaos testing | `scripts/chaos_runner.py` |
| Fault injection hook | `app/presentation/api/chaos.py` |

## 3. Performance Testing

### High-Risk Components Under Load

| Component | Endpoint Coverage | Why It Is High Risk |
|---|---|---|
| Authentication | `POST /api/auth/login` | Blocks all protected workflows when degraded |
| Shopping Cart | `GET /api/cart`, `POST /api/cart/items`, `POST /api/cart/shipping`, `POST /api/cart/clear` | Central user flow with inventory and pricing logic |
| Checkout Preparation Path | Cart and order-adjacent state updates | Sensitive because it drives the transition into order creation |

### Scenarios

| Scenario | Users | Iterations per User | Intent | Expected Threshold |
|---|---|---|---|---|
| Normal | 4 | 5 | Baseline daily load | p95 under 500 ms, errors under 2% |
| Peak | 12 | 8 | Sustained busy period | p95 under 900 ms, errors under 5% |
| Spike | 24 | 4 | Sudden traffic surge | p95 under 1500 ms, errors under 10% |
| Endurance | 6 | 30 | Stability over time | stable throughput, no increasing error trend |

### Execution

Start the application first, then run one of the scenarios:

```powershell
python scripts/load_test.py --scenario normal
python scripts/load_test.py --scenario peak
python scripts/load_test.py --scenario spike
python scripts/load_test.py --scenario endurance
```

The script writes JSON output to `docs/experimental-results/performance-summary.json`.

### Metrics Captured

- Average response time
- Median response time
- 95th percentile response time
- Throughput in requests per second
- Error rate percentage
- Per-operation latency breakdown

### Result Table Template

| Scenario | Requests | Throughput (RPS) | Avg (ms) | Median (ms) | P95 (ms) | Error Rate % |
|---|---|---|---|---|---|---|
| Normal | | | | | | |
| Peak | | | | | | |
| Spike | | | | | | |
| Endurance | | | | | | |

### Performance Analysis Guidance

Review the per-operation block in the JSON report. If `auth_login` has the highest p95, the likely bottleneck is password hashing and token generation. If `cart_add` or `cart_shipping` shows the slowest trend, inspect inventory lookups, pricing recalculation, and database commit frequency. If throughput drops sharply in the spike scenario, note that the application currently runs as a single Uvicorn process and does not include caching or asynchronous background processing.

## 4. Mutation Testing

### Automated Test Suite Used

Mutation testing in this repository is based on backend service-level unit tests rather than UI smoke tests. This keeps execution fast and makes surviving mutants easier to analyze.

Run the baseline suite:

```powershell
python -m unittest discover -s tests -p "test_*.py"
python scripts/coverage_runner.py
```

### Mutants Introduced

`scripts/mutation_runner.py` applies realistic source mutations to `app/application/services.py` across the three critical modules:

| Mutant ID | Module | Mutant Type | Intent |
|---|---|---|---|
| AUTH-001 | Authentication | Logical operator change | Weakens login validation |
| AUTH-002 | Authentication | Condition inversion | Breaks active-user check |
| CART-001 | Shopping Cart | Boundary mutation | Changes stock acceptance behavior |
| ORDER-001 | Checkout and Order Creation | Condition inversion | Breaks empty-cart validation |
| ORDER-002 | Checkout and Order Creation | Return value modification | Changes created order state |
| ORDER-003 | Checkout and Order Creation | Arithmetic mutation | Corrupts stock update behavior |

### Execution

```powershell
python scripts/mutation_runner.py
```

The script restores the original source after every mutant and writes the full report to `docs/experimental-results/mutation-report.json`.

### Mutation Score Formula

```text
Mutation Score (%) = (Killed Mutants / Total Non-Skipped Mutants) * 100
```

### Result Table Template

| Module / Component | Mutant Type | Mutants Created | Mutants Killed | Mutants Survived | Mutation Score (%) |
|---|---|---|---|---|---|
| Authentication | Logic and condition mutations | | | | |
| Shopping Cart | Boundary mutations | | | | |
| Checkout and Order Creation | Condition, status, arithmetic mutations | | | | |
| Overall | All mutants | | | | |

### Analysis Guidance

Surviving mutants indicate that the automated suite did not assert a critical behavior strongly enough. For example:

- A surviving authentication mutant means the tests did not fully protect login rules.
- A surviving cart mutant means stock or pricing edge cases are under-asserted.
- A surviving order mutant means checkout side effects, such as cart clearing or stock reduction, are not sufficiently validated.

This repository is intentionally useful for the final analysis because the current service tests can report high line coverage while still allowing a surviving mutant. That gives a concrete paper-ready example of why coverage percentage alone is not enough to judge test effectiveness.

## 5. Chaos and Fault Injection Testing

### Fault Injection Design

NovaCart now includes an opt-in middleware for QA fault injection. It is disabled by default and only activates when `QA_FAULT_INJECTION_ENABLED=true`.

Supported injected behaviors:

- Response delay through `X-QA-Delay-Ms`
- Forced HTTP failure through `X-QA-Status-Code`
- Partial failure rate through `X-QA-Fault-Probability`
- Path scoping through `X-QA-Fault-Target`

### Enable Chaos Mode

```powershell
$env:QA_FAULT_INJECTION_ENABLED="true"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Scenarios

| Scenario | Injected Fault | Target | Duration | Expected Observation |
|---|---|---|---|---|
| API downtime | Forced `503` | `/api/orders` | 12 seconds | Requests fail cleanly and recover after fault removal |
| Network latency | 1500 ms delay | `/api/cart` | 10 seconds | Higher latency with continued availability |
| Partial auth failure | 40% forced `500` | `/api/auth/login` | 10 seconds | Some requests fail while service remains partially available |

### Execution

```powershell
python scripts/chaos_runner.py
```

The script writes results to `docs/experimental-results/chaos-report.json`.

### Metrics Captured

- Availability percentage during the fault window
- Mean time to recovery after the fault is removed
- Fault versus recovery observations per scenario

### Result Table Template

| Scenario | Fault Type | Availability % | MTTR (s) | Error Propagation Notes |
|---|---|---|---|---|
| API downtime | 503 on `/api/orders` | | | |
| Cart latency | Delay on `/api/cart` | | | |
| Partial auth failure | 500 on `/api/auth/login` | | | |

### Lessons-Learned Prompt

Use the report to answer:

1. Did the system fail fast with clear status codes, or did it hang?
2. Did authentication, cart, and order APIs degrade independently or propagate faults?
3. Was recovery immediate after fault removal, or did requests keep failing?
4. Which missing safeguards should be recommended next: retries, backoff, health-aware routing, or better telemetry?

## 6. Documentation Deliverables for the Assignment Report

For the 4 to 6 page experimental report, include:

1. The selected NovaCart modules and the rationale from the existing risk assessment.
2. The exact commands used to execute load, mutation, and chaos testing.
3. A short environment section with versions, local hardware, and database setup.
4. Tables populated from the three JSON reports in `docs/experimental-results/`.
5. The service-layer coverage percentage from `docs/experimental-results/coverage-report.json`.
6. A comparison between expected thresholds and observed values.
7. Recommendations tied to specific bottlenecks, surviving mutants, and resilience gaps.

## 7. Recommended Project-Specific Conclusions

These are the most likely evidence-backed conclusions for NovaCart once the experiments are run:

- Authentication performance will be sensitive to password hashing under concurrent load.
- Cart behavior is a good candidate for optimization because every mutation and load step passes through pricing and stock checks.
- Checkout side effects are the most important mutation target because they affect stock integrity and order correctness.
- The current service is functionally simple but not fault-tolerant by design; injected failures should be surfaced clearly, not silently retried.
