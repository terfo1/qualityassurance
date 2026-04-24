import json
import shutil
import subprocess
from pathlib import Path


def main() -> None:
    output_dir = Path("docs/experimental-results/trace-output")
    if output_dir.exists():
        shutil.rmtree(output_dir)

    command = [
        "python",
        "-m",
        "trace",
        "--count",
        "--summary",
        "-C",
        str(output_dir),
        "--ignore-dir",
        r"C:\Python312",
        "--module",
        "unittest",
        "discover",
        "-s",
        "tests",
        "-p",
        "test_*.py",
    ]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        raise SystemExit(completed.stderr or completed.stdout)

    files = {}
    for line in completed.stdout.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("lines") or stripped.startswith("Ran ") or stripped == "OK":
            continue
        if "(" not in stripped or ")" not in stripped or "%" not in stripped:
            continue
        parts = stripped.split()
        if len(parts) < 4:
            continue
        module = parts[2]
        coverage_percent = float(parts[1].rstrip("%"))
        files[module] = {
            "covered_lines": int(parts[0]),
            "coverage_percent": coverage_percent,
        }

    target = files.get("app.application.services", {"covered_lines": 0, "coverage_percent": 0.0})
    report = {
        "files": {
            "app/application/services.py": target,
        },
        "overall_coverage_percent": target["coverage_percent"],
        "trace_stdout": completed.stdout,
    }

    output = Path("docs/experimental-results/coverage-report.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
