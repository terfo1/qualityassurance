import argparse
import json
import statistics
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


SCENARIOS = {
    "normal": {"users": 4, "iterations": 5, "ramp_seconds": 1},
    "peak": {"users": 12, "iterations": 8, "ramp_seconds": 2},
    "spike": {"users": 24, "iterations": 4, "ramp_seconds": 0},
    "endurance": {"users": 6, "iterations": 30, "ramp_seconds": 2},
}


class Client:
    def __init__(self, base_url: str, email: str, password: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.password = password
        self.local = threading.local()

    def request(self, method: str, path: str, payload: dict | None = None, auth: bool = False) -> tuple[int, float]:
        headers = {"Content-Type": "application/json"}
        if auth:
            token = getattr(self.local, "token", None) or self.login()
            headers["Authorization"] = f"Bearer {token}"
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        started = time.perf_counter()
        req = urllib.request.Request(f"{self.base_url}{path}", data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response.read()
                status = response.status
        except urllib.error.HTTPError as error:
            error.read()
            status = error.code
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        return status, elapsed_ms

    def login(self) -> str:
        headers = {"Content-Type": "application/json"}
        payload = json.dumps({"email": self.email, "password": self.password}).encode("utf-8")
        request = urllib.request.Request(f"{self.base_url}/api/auth/login", data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(request, timeout=15) as response:
            body = json.loads(response.read().decode("utf-8"))
        self.local.token = body["token"]
        return self.local.token


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((len(ordered) - 1) * ratio)))
    return ordered[index]


def sample(client: Client, name: str, method: str, path: str, payload: dict | None = None, auth: bool = False) -> dict:
    status, elapsed_ms = client.request(method, path, payload=payload, auth=auth)
    return {"operation": name, "status": status, "elapsed_ms": elapsed_ms}


def worker(client: Client, user_index: int, total_users: int, iterations: int, ramp_seconds: int) -> list[dict]:
    if ramp_seconds:
        time.sleep((user_index / max(1, total_users)) * ramp_seconds)

    results: list[dict] = []
    for iteration in range(iterations):
        results.append(sample(client, "auth_login", "POST", "/api/auth/login", {"email": client.email, "password": client.password}))
        results.append(sample(client, "cart_get", "GET", "/api/cart", auth=True))
        results.append(sample(client, "cart_add", "POST", "/api/cart/items", {"product_id": 1, "quantity": 1}, auth=True))
        results.append(sample(client, "cart_shipping", "POST", "/api/cart/shipping", {"shipping_method": "express"}, auth=True))
        results.append(sample(client, "orders_get", "GET", "/api/orders", auth=True))
        if iteration == iterations - 1:
            results.append(sample(client, "cart_clear", "POST", "/api/cart/clear", auth=True))
    return results


def summarize(results: list[dict], started: float, finished: float) -> dict:
    latencies = [entry["elapsed_ms"] for entry in results]
    failures = [entry for entry in results if entry["status"] >= 400]
    elapsed_seconds = max(finished - started, 0.001)
    by_operation: dict[str, dict] = {}
    for operation in sorted({entry["operation"] for entry in results}):
        operation_results = [entry for entry in results if entry["operation"] == operation]
        op_latencies = [entry["elapsed_ms"] for entry in operation_results]
        by_operation[operation] = {
            "requests": len(operation_results),
            "avg_ms": round(statistics.mean(op_latencies), 2),
            "median_ms": round(statistics.median(op_latencies), 2),
            "p95_ms": round(percentile(op_latencies, 0.95), 2),
            "error_rate_percent": round((len([entry for entry in operation_results if entry["status"] >= 400]) / len(operation_results)) * 100, 2),
        }

    return {
        "requests": len(results),
        "throughput_rps": round(len(results) / elapsed_seconds, 2),
        "avg_ms": round(statistics.mean(latencies), 2),
        "median_ms": round(statistics.median(latencies), 2),
        "p95_ms": round(percentile(latencies, 0.95), 2),
        "error_rate_percent": round((len(failures) / len(results)) * 100, 2),
        "operations": by_operation,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Lightweight NovaCart API load runner.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--email", default="demo@novacart.local")
    parser.add_argument("--password", default="Demo123!")
    parser.add_argument("--scenario", choices=sorted(SCENARIOS), default="normal")
    parser.add_argument("--output", default="docs/experimental-results/performance-summary.json")
    args = parser.parse_args()

    scenario = SCENARIOS[args.scenario]
    client = Client(args.base_url, args.email, args.password)
    started = time.perf_counter()
    all_results: list[dict] = []
    with ThreadPoolExecutor(max_workers=scenario["users"]) as executor:
        futures = [
            executor.submit(worker, client, index, scenario["users"], scenario["iterations"], scenario["ramp_seconds"])
            for index in range(scenario["users"])
        ]
        for future in as_completed(futures):
            all_results.extend(future.result())
    finished = time.perf_counter()

    summary = {
        "scenario": args.scenario,
        "config": scenario,
        "summary": summarize(all_results, started, finished),
        "raw_results": all_results,
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary["summary"], indent=2))


if __name__ == "__main__":
    main()
