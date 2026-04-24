import argparse
import json
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path


SCENARIOS = [
    {
        "name": "api_downtime_orders",
        "path": "/api/orders",
        "method": "GET",
        "body": None,
        "headers": {"X-QA-Status-Code": "503", "X-QA-Fault-Target": "/api/orders"},
        "duration_seconds": 12,
        "auth": True,
    },
    {
        "name": "cart_latency",
        "path": "/api/cart",
        "method": "GET",
        "body": None,
        "headers": {"X-QA-Delay-Ms": "1500", "X-QA-Fault-Target": "/api/cart"},
        "duration_seconds": 10,
        "auth": True,
    },
    {
        "name": "auth_partial_failure",
        "path": "/api/auth/login",
        "method": "POST",
        "body": {"email": "demo@novacart.local", "password": "Demo123!"},
        "headers": {
            "X-QA-Status-Code": "500",
            "X-QA-Fault-Probability": "0.4",
            "X-QA-Fault-Target": "/api/auth/login",
        },
        "duration_seconds": 10,
        "auth": False,
    },
]


class Client:
    def __init__(self, base_url: str, email: str, password: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.password = password
        self.local = threading.local()

    def login(self) -> str:
        payload = json.dumps({"email": self.email, "password": self.password}).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/api/auth/login",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
        self.local.token = body["token"]
        return self.local.token

    def request(self, method: str, path: str, body: dict | None, headers: dict[str, str], auth: bool) -> tuple[int, float]:
        request_headers = {"Content-Type": "application/json", **headers}
        if auth:
            token = getattr(self.local, "token", None) or self.login()
            request_headers["Authorization"] = f"Bearer {token}"
        payload = None if body is None else json.dumps(body).encode("utf-8")
        started = time.perf_counter()
        req = urllib.request.Request(f"{self.base_url}{path}", data=payload, headers=request_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                response.read()
                status = response.status
        except urllib.error.HTTPError as error:
            error.read()
            status = error.code
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        return status, elapsed


def run_scenario(client: Client, scenario: dict) -> dict:
    observations = []
    started = time.perf_counter()
    while time.perf_counter() - started < scenario["duration_seconds"]:
        status, elapsed_ms = client.request(
            scenario["method"],
            scenario["path"],
            scenario["body"],
            scenario["headers"],
            auth=scenario["auth"],
        )
        observations.append({"status": status, "elapsed_ms": elapsed_ms, "phase": "fault"})
        time.sleep(1)

    recovery_started = time.perf_counter()
    healthy_streak = 0
    while healthy_streak < 2:
        status, elapsed_ms = client.request(
            scenario["method"],
            scenario["path"],
            scenario["body"],
            {},
            auth=scenario["auth"],
        )
        observations.append({"status": status, "elapsed_ms": elapsed_ms, "phase": "recovery"})
        healthy_streak = healthy_streak + 1 if status < 400 else 0
        if healthy_streak < 2:
            time.sleep(1)

    fault_events = [entry for entry in observations if entry["phase"] == "fault"]
    failed = [entry for entry in fault_events if entry["status"] >= 400]
    availability = round(((len(fault_events) - len(failed)) / len(fault_events)) * 100, 2) if fault_events else 100.0
    return {
        "name": scenario["name"],
        "path": scenario["path"],
        "duration_seconds": scenario["duration_seconds"],
        "availability_percent": availability,
        "mttr_seconds": round(time.perf_counter() - recovery_started, 2),
        "fault_observations": fault_events,
        "recovery_observations": [entry for entry in observations if entry["phase"] == "recovery"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run opt-in QA chaos scenarios against NovaCart.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--email", default="demo@novacart.local")
    parser.add_argument("--password", default="Demo123!")
    parser.add_argument("--output", default="docs/experimental-results/chaos-report.json")
    args = parser.parse_args()

    client = Client(args.base_url, args.email, args.password)
    report = {"scenarios": [run_scenario(client, scenario) for scenario in SCENARIOS]}
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
