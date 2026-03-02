#!/usr/bin/env python3
"""
Agentica v2 — Pattern Distillation Script
Reads stored trajectories and decisions → clusters by task type → 
extracts winning decision patterns → updates patterns.json

Usage:
    python scripts/distill_patterns.py
    python scripts/distill_patterns.py --min-frequency 3 --min-success 0.8
"""
import argparse
import json
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

AGENTICA_ROOT  = Path(__file__).parent.parent
DECISIONS_FILE = AGENTICA_ROOT / "memory" / "reasoning-bank" / "decisions.json"
TRAJECTORIES_DIR = AGENTICA_ROOT / "memory" / "trajectories"


def load_bank() -> dict:
    with open(DECISIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_bank(data: dict) -> None:
    with open(DECISIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_trajectories() -> list[dict]:
    """Load all trajectory JSON files from memory/trajectories/"""
    trajectories = []
    if not TRAJECTORIES_DIR.exists():
        return trajectories
    for file in TRAJECTORIES_DIR.glob("*.json"):
        try:
            with open(file) as f:
                data = json.load(f)
                if isinstance(data, list):
                    trajectories.extend(data)
                elif isinstance(data, dict):
                    trajectories.append(data)
        except (json.JSONDecodeError, IOError):
            pass
    return trajectories


def distill_patterns(decisions: list[dict], min_frequency: int, min_success: float) -> list[dict]:
    """Extract patterns from decisions by clustering on tags."""
    tag_groups: dict[str, list[dict]] = defaultdict(list)
    for d in decisions:
        for tag in d.get("tags", []):
            tag_groups[tag].append(d)

    new_patterns = []
    for tag, group in tag_groups.items():
        if len(group) < min_frequency:
            continue

        success_count = sum(1 for d in group if d.get("success", False))
        success_rate  = success_count / len(group)

        if success_rate < min_success:
            continue

        # Pick the most representative decision (highest success, lowest tokens)
        successful = [d for d in group if d.get("success", False)]
        if not successful:
            continue
        best = min(successful, key=lambda d: d.get("tokens_used", 9999))

        new_patterns.append({
            "id": f"pat-{str(uuid.uuid4())[:8]}",
            "name": f"{tag.replace('-', ' ').title()} Pattern",
            "pattern": best["decision"],
            "example_task": best["task"],
            "example_outcome": best["outcome"],
            "frequency": len(group),
            "avg_success_rate": round(success_rate, 2),
            "avg_tokens": round(sum(d.get("tokens_used", 0) for d in group) / len(group)),
            "distilled_from": [d["id"] for d in group],
            "tags": [tag],
            "distilled_at": datetime.now(timezone.utc).isoformat(),
        })

    return new_patterns


def main():
    parser = argparse.ArgumentParser(description="Agentica Pattern Distillation")
    parser.add_argument("--min-frequency", type=int, default=2,
                        help="Minimum occurrences to form a pattern (default: 2)")
    parser.add_argument("--min-success", type=float, default=0.7,
                        help="Minimum success rate (default: 0.70)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview patterns without saving")
    args = parser.parse_args()

    bank      = load_bank()
    decisions = bank.get("decisions", [])

    # Also include trajectories as weak signal
    trajectories = load_trajectories()
    print(f"[distill] Loaded {len(decisions)} decisions, {len(trajectories)} trajectories")

    existing_pattern_tags = set()
    for p in bank.get("patterns", []):
        existing_pattern_tags.update(p.get("tags", []))

    new_patterns = distill_patterns(decisions, args.min_frequency, args.min_success)

    # Filter out patterns for tags already covered
    truly_new = [p for p in new_patterns if not any(t in existing_pattern_tags for t in p.get("tags", []))]

    print(json.dumps({
        "new_patterns_found": len(truly_new),
        "patterns": [{"name": p["name"], "frequency": p["frequency"],
                      "success_rate": p["avg_success_rate"]} for p in truly_new],
        "dry_run": args.dry_run,
    }, indent=2))

    if not args.dry_run and truly_new:
        bank["patterns"] = bank.get("patterns", []) + truly_new
        save_bank(bank)
        print(f"[distill] ✅ Saved {len(truly_new)} new patterns to decisions.json")
    elif args.dry_run:
        print("[distill] ℹ Dry run — no changes written")
    else:
        print("[distill] ℹ No new patterns found")


if __name__ == "__main__":
    main()
