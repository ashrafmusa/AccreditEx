#!/usr/bin/env python3
"""
Agenticana v2 — Model Router CLI
Python bridge to call the Node.js Model Router from GEMINI.md and scripts.

Usage:
    python scripts/router_cli.py "fix the login button color"
    python scripts/router_cli.py "build a distributed microservices payment platform" --agent orchestrator
    python scripts/router_cli.py --stats
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

Agenticana_ROOT = Path(__file__).parent.parent
ROUTER_JS     = Agenticana_ROOT / "router" / "router.js"


def call_router(task: str, agent: str = "orchestrator", skills: list[str] | None = None,
                rb_similarity: float = 0.0) -> dict:
    """Call the Node.js router via a small inline script."""
    skills_list = skills or []

    node_script = f"""
const router = require({json.dumps(str(ROUTER_JS).replace(chr(92), '/'))});
const decision = router.route({{
  task: {json.dumps(task)},
  agentName: {json.dumps(agent)},
  skills: {json.dumps(skills_list)},
  rb_similarity: {rb_similarity},
  AgenticanaRoot: {json.dumps(str(Agenticana_ROOT).replace(chr(92), '/'))},
}});
router.recordStats(decision);
console.log(JSON.stringify(decision, null, 2));
"""

    try:
        result = subprocess.run(
            ["node", "--input-type=module", "-e", node_script],
            capture_output=True, text=True, timeout=15,
            cwd=str(Agenticana_ROOT)
        )
        # Try CommonJS if module mode fails
        if result.returncode != 0:
            result = subprocess.run(
                ["node", "-e", node_script.replace("require(", "require(")],
                capture_output=True, text=True, timeout=15,
                cwd=str(Agenticana_ROOT)
            )
        if result.returncode != 0:
            return {"error": result.stderr.strip(), "fallback": True, **_fallback_route(task)}
        return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        # Node.js not available — use Python fallback
        return {"fallback": True, **_fallback_route(task)}
    except json.JSONDecodeError as e:
        return {"error": f"JSON parse error: {e}", "fallback": True, **_fallback_route(task)}


def _fallback_route(task: str) -> dict:
    """Pure Python fallback when Node.js is unavailable."""
    task_lower = task.lower()

    high_kw = ["architect", "distributed", "enterprise", "microservices", "platform", "rebuild", "system design"]
    low_kw  = ["fix", "typo", "rename", "color", "text", "add comment", "change label", "minor"]

    if any(k in task_lower for k in high_kw):
        tier, model = "pro", "gemini-2.5-pro"
        score = 8
    elif any(k in task_lower for k in low_kw):
        tier, model = "flash", "gemini-2.0-flash"
        score = 2
    else:
        tier, model = "pro", "gemini-2.5-pro"
        score = 5

    return {
        "model": model,
        "tier": tier,
        "strategy": "FULL",
        "complexity_score": score,
        "estimated_tokens": 15000,
        "note": "Python fallback — install Node.js for full router capability",
    }


def main():
    parser = argparse.ArgumentParser(
        prog="router_cli.py",
        description="Agenticana v2 Model Router CLI"
    )
    parser.add_argument("task", nargs="?", help="Task description to route")
    parser.add_argument("--agent", default="orchestrator", help="Agent to invoke (default: orchestrator)")
    parser.add_argument("--skills", nargs="*", default=[], help="Skills to load (space-separated)")
    parser.add_argument("--rb-similarity", type=float, default=0.0,
                        help="ReasoningBank similarity score (0-1), if already retrieved")
    parser.add_argument("--stats", action="store_true", help="Show router session stats")
    parser.add_argument("--compact", action="store_true", help="Show compact one-line output")

    args = parser.parse_args()

    if args.stats:
        # Emit basic stats (session stats require persistent process, show config instead)
        config_path = Agenticana_ROOT / "router" / "config.json"
        with open(config_path) as f:
            config = json.load(f)
        print(json.dumps({
            "models": config["models"],
            "thresholds": config["thresholds"],
            "savings_estimates": config["savings"],
        }, indent=2))
        return

    if not args.task:
        parser.print_help()
        sys.exit(1)

    decision = call_router(
        task=args.task,
        agent=args.agent,
        skills=args.skills,
        rb_similarity=args.rb_similarity,
    )

    if args.compact:
        # One-liner for quick consumption in scripts
        print(f"MODEL={decision.get('tier','pro')} STRATEGY={decision.get('strategy','FULL')} "
              f"TOKENS~{decision.get('estimated_tokens',0)} SCORE={decision.get('complexity_score',5)}")
    else:
        print(json.dumps(decision, indent=2))


if __name__ == "__main__":
    main()
