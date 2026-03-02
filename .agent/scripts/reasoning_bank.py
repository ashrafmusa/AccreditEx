#!/usr/bin/env python3
"""
Agenticana v2 — ReasoningBank CLI
Stores and retrieves past agent decisions using cosine similarity.

Usage:
    python scripts/reasoning_bank.py retrieve "build login system" --k 3
    python scripts/reasoning_bank.py record --task "X" --decision "Y" --outcome "Z" --success true
    python scripts/reasoning_bank.py distill
    python scripts/reasoning_bank.py consolidate
    python scripts/reasoning_bank.py stats
"""
import argparse
import json
import math
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
Agenticana_ROOT  = Path(__file__).parent.parent
DECISIONS_FILE = Agenticana_ROOT / "memory" / "reasoning-bank" / "decisions.json"
PATTERNS_FILE  = Agenticana_ROOT / "memory" / "reasoning-bank" / "patterns.json"

# ── Simple Text Embedding (TF-based, no external deps) ────────────────────────
def simple_embed(text: str) -> list[float]:
    """
    Lightweight bag-of-words TF vector (no external dependencies).
    Falls back gracefully when sentence-transformers is not installed.
    For production, install: pip install sentence-transformers
    """
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        model = SentenceTransformer("all-MiniLM-L6-v2")
        vec = model.encode(text).tolist()
        return vec
    except ImportError:
        # Fallback: simple word-frequency vector (works without ML deps)
        words = text.lower().split()
        freq: dict[str, int] = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        # Normalize
        total = sum(freq.values()) or 1
        return [v / total for v in list(freq.values())[:384]]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if not a or not b:
        return 0.0
    # Align lengths
    min_len = min(len(a), len(b))
    a, b = a[:min_len], b[:min_len]
    dot   = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x ** 2 for x in a))
    mag_b = math.sqrt(sum(x ** 2 for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ── Data Loaders ──────────────────────────────────────────────────────────────
def load_bank() -> dict:
    with open(DECISIONS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_bank(data: dict) -> None:
    with open(DECISIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Commands ──────────────────────────────────────────────────────────────────
def cmd_retrieve(task: str, k: int = 5, threshold: float = 0.50) -> None:
    """Find top-K similar past decisions for a given task."""
    bank = load_bank()
    decisions = bank.get("decisions", [])

    if not decisions:
        print(json.dumps({"results": [], "message": "ReasoningBank is empty"}))
        return

    query_vec = simple_embed(task)
    scored: list[tuple[float, dict]] = []

    for d in decisions:
        # Use pre-stored embedding if available, else compute on-the-fly
        ref_vec = d.get("embedding") or simple_embed(d.get("task", ""))
        sim = cosine_similarity(query_vec, ref_vec)
        if sim >= threshold:
            scored.append((sim, d))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_k = scored[:k]

    results = [
        {
            "similarity": round(sim, 4),
            "id": d["id"],
            "task": d["task"],
            "agent": d["agent"],
            "decision": d["decision"],
            "outcome": d["outcome"],
            "success": d["success"],
            "tags": d.get("tags", []),
        }
        for sim, d in top_k
    ]

    fast_path_available = bool(results and results[0]["similarity"] >= 0.85)

    output = {
        "query": task,
        "results_count": len(results),
        "fast_path_available": fast_path_available,
        "fast_path_threshold": 0.85,
        "results": results,
    }
    if fast_path_available:
        output["fast_path_recommendation"] = (
            f"High similarity ({results[0]['similarity']:.2f}) to past task. "
            "Consider reusing this pattern to skip re-planning."
        )

    print(json.dumps(output, indent=2))


def cmd_record(task: str, decision: str, outcome: str, success: bool,
               agent: str = "unknown", tags: list[str] | None = None) -> None:
    """Store a new decision in the ReasoningBank."""
    bank = load_bank()

    # Generate embedding (None = lazy, computed on retrieve)
    embedding = None
    try:
        embedding = simple_embed(task)
    except Exception:
        pass  # Will be computed lazily on next retrieve

    new_decision = {
        "id": f"rb-{str(uuid.uuid4())[:8]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "task": task,
        "task_type": "user-recorded",
        "agent": agent,
        "decision": decision,
        "outcome": outcome,
        "success": success,
        "tokens_used": 0,
        "model_used": "unknown",
        "embedding": embedding,
        "tags": tags or [],
    }

    bank["decisions"].append(new_decision)
    bank["total_decisions"] = len(bank["decisions"])
    save_bank(bank)

    print(json.dumps({
        "status": "recorded",
        "id": new_decision["id"],
        "total_decisions": bank["total_decisions"],
    }, indent=2))


def cmd_distill() -> None:
    """Extract recurring patterns from stored decisions."""
    bank = load_bank()
    decisions = bank.get("decisions", [])
    patterns  = bank.get("patterns", [])

    if len(decisions) < 3:
        print(json.dumps({"status": "skipped", "reason": "Need at least 3 decisions to distill"}))
        return

    # Simple tag-based clustering
    tag_groups: dict[str, list[dict]] = {}
    for d in decisions:
        for tag in d.get("tags", []):
            tag_groups.setdefault(tag, []).append(d)

    new_patterns = []
    for tag, group in tag_groups.items():
        if len(group) >= 2:
            success_rate = sum(1 for d in group if d.get("success")) / len(group)
            # Only distill high-success patterns
            if success_rate >= 0.7:
                # Check if pattern already exists
                existing = next((p for p in patterns if tag in p.get("tags", [])), None)
                if not existing:
                    representative = max(group, key=lambda d: d.get("success", False))
                    new_patterns.append({
                        "id": f"pat-{str(uuid.uuid4())[:8]}",
                        "name": f"{tag.replace('-', ' ').title()} Pattern",
                        "pattern": representative["decision"],
                        "frequency": len(group),
                        "avg_success_rate": round(success_rate, 2),
                        "distilled_from": [d["id"] for d in group],
                        "tags": [tag],
                    })

    bank["patterns"] = patterns + new_patterns
    save_bank(bank)

    print(json.dumps({
        "status": "distilled",
        "new_patterns": len(new_patterns),
        "total_patterns": len(bank["patterns"]),
        "patterns": [p["name"] for p in new_patterns],
    }, indent=2))


def cmd_consolidate() -> None:
    """Merge redundant patterns and remove low-signal entries."""
    bank = load_bank()
    patterns = bank.get("patterns", [])
    before = len(patterns)

    # Remove patterns with frequency < 2 or success < 0.5
    filtered = [p for p in patterns if p.get("frequency", 0) >= 2 and p.get("avg_success_rate", 0) >= 0.5]
    bank["patterns"] = filtered
    bank["last_consolidated"] = datetime.now(timezone.utc).isoformat()
    save_bank(bank)

    print(json.dumps({
        "status": "consolidated",
        "removed": before - len(filtered),
        "remaining_patterns": len(filtered),
        "last_consolidated": bank["last_consolidated"],
    }, indent=2))


def cmd_stats() -> None:
    """Show ReasoningBank statistics."""
    bank = load_bank()
    decisions = bank.get("decisions", [])
    patterns  = bank.get("patterns", [])

    success_count = sum(1 for d in decisions if d.get("success"))
    agents_used   = {}
    for d in decisions:
        agents_used[d.get("agent", "unknown")] = agents_used.get(d.get("agent", "unknown"), 0) + 1

    print(json.dumps({
        "version": bank.get("version", "2.0"),
        "total_decisions": len(decisions),
        "success_rate": round(success_count / len(decisions), 2) if decisions else 0,
        "total_patterns": len(patterns),
        "agents_by_usage": agents_used,
        "last_consolidated": bank.get("last_consolidated"),
    }, indent=2))


# ── CLI Entry Point ────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        prog="reasoning_bank.py",
        description="Agenticana v2 ReasoningBank CLI"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # retrieve
    p_retrieve = sub.add_parser("retrieve", help="Find similar past decisions")
    p_retrieve.add_argument("task", help="Task description to search for")
    p_retrieve.add_argument("--k", type=int, default=5, help="Number of results (default: 5)")
    p_retrieve.add_argument("--threshold", type=float, default=0.50, help="Min similarity (default: 0.50)")

    # record
    p_record = sub.add_parser("record", help="Record a new decision")
    p_record.add_argument("--task",     required=True, help="Task description")
    p_record.add_argument("--decision", required=True, help="Decision made")
    p_record.add_argument("--outcome",  required=True, help="Outcome description")
    p_record.add_argument("--success",  required=True, type=lambda x: x.lower() == "true", help="Was it successful? (true/false)")
    p_record.add_argument("--agent",    default="unknown", help="Agent name")
    p_record.add_argument("--tags",     nargs="*", default=[], help="Tags (space-separated)")

    # distill
    sub.add_parser("distill", help="Extract patterns from decisions")

    # consolidate
    sub.add_parser("consolidate", help="Merge redundant patterns")

    # stats
    sub.add_parser("stats", help="Show ReasoningBank statistics")

    args = parser.parse_args()

    if args.command == "retrieve":
        cmd_retrieve(args.task, args.k, args.threshold)
    elif args.command == "record":
        cmd_record(args.task, args.decision, args.outcome, args.success, args.agent, args.tags)
    elif args.command == "distill":
        cmd_distill()
    elif args.command == "consolidate":
        cmd_consolidate()
    elif args.command == "stats":
        cmd_stats()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
