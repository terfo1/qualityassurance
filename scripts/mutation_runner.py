import argparse
import json
import shutil
import subprocess
from pathlib import Path


MUTANTS = [
    {
        "id": "AUTH-001",
        "module": "Authentication",
        "type": "Logical operator change",
        "target_file": "app/application/services.py",
        "search": 'if not user or not verify_password(command.password, user.password_hash):',
        "replace": 'if not user and not verify_password(command.password, user.password_hash):',
    },
    {
        "id": "AUTH-002",
        "module": "Authentication",
        "type": "Condition inversion",
        "target_file": "app/application/services.py",
        "search": "if not user.is_active:",
        "replace": "if user.is_active:",
    },
    {
        "id": "CART-001",
        "module": "Shopping Cart",
        "type": "Boundary mutation",
        "target_file": "app/application/services.py",
        "search": "if quantity > product.stock:",
        "replace": "if quantity >= product.stock:",
    },
    {
        "id": "ORDER-001",
        "module": "Checkout and Order Creation",
        "type": "Condition inversion",
        "target_file": "app/application/services.py",
        "search": 'if not snapshot["items"]:',
        "replace": 'if snapshot["items"]:',
    },
    {
        "id": "ORDER-002",
        "module": "Checkout and Order Creation",
        "type": "Return value modification",
        "target_file": "app/application/services.py",
        "search": "status=OrderStatus.confirmed,",
        "replace": "status=OrderStatus.pending,",
    },
    {
        "id": "ORDER-003",
        "module": "Checkout and Order Creation",
        "type": "Arithmetic mutation",
        "target_file": "app/application/services.py",
        "search": 'product.stock -= item["quantity"]',
        "replace": 'product.stock += item["quantity"]',
    },
]


def run_command(command: list[str], cwd: Path) -> tuple[int, str]:
    completed = subprocess.run(command, cwd=str(cwd), capture_output=True, text=True, check=False)
    output = (completed.stdout or "") + (completed.stderr or "")
    return completed.returncode, output


def main() -> None:
    parser = argparse.ArgumentParser(description="Run controlled source mutations against the NovaCart unit tests.")
    parser.add_argument("--root", default=".")
    parser.add_argument("--output", default="docs/experimental-results/mutation-report.json")
    parser.add_argument(
        "--test-command",
        nargs="+",
        default=["python", "-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py"],
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    report = []
    for mutant in MUTANTS:
        target = root / mutant["target_file"]
        original = target.read_text(encoding="utf-8")
        if mutant["search"] not in original:
            report.append({**mutant, "status": "skipped", "reason": "search text not found"})
            continue

        backup = target.with_suffix(target.suffix + ".bak")
        shutil.copyfile(target, backup)
        try:
            target.write_text(original.replace(mutant["search"], mutant["replace"], 1), encoding="utf-8")
            code, output = run_command(args.test_command, root)
            report.append(
                {
                    **mutant,
                    "status": "killed" if code != 0 else "survived",
                    "exit_code": code,
                    "test_output": output,
                }
            )
        finally:
            shutil.move(str(backup), str(target))

    total = len([entry for entry in report if entry["status"] in {"killed", "survived"}])
    killed = len([entry for entry in report if entry["status"] == "killed"])
    survived = len([entry for entry in report if entry["status"] == "survived"])
    summary = {
        "mutants_created": total,
        "mutants_killed": killed,
        "mutants_survived": survived,
        "mutation_score_percent": round((killed / total) * 100, 2) if total else 0.0,
        "report": report,
    }

    output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
