"""Shared compliance score calculations for the AI backend."""

from typing import Any, Dict, List


def calculate_checklist_compliance(
    checklist: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Calculate the project score while excluding not-applicable items."""
    counts = {
        "compliant": 0,
        "non_compliant": 0,
        "partially_compliant": 0,
        "not_started": 0,
        "not_applicable": 0,
    }
    for item in checklist:
        status = item.get("status")
        if status == "Compliant":
            counts["compliant"] += 1
        elif status == "Non-Compliant":
            counts["non_compliant"] += 1
        elif status == "Partially Compliant":
            counts["partially_compliant"] += 1
        elif status == "Not Applicable":
            counts["not_applicable"] += 1
        elif status == "Not Started":
            counts["not_started"] += 1

    applicable_count = len(checklist) - counts["not_applicable"]
    score = counts["compliant"] + 0.5 * counts["partially_compliant"]
    return {
        **counts,
        "applicable_count": applicable_count,
        "compliance_rate": score / applicable_count * 100 if applicable_count else 0,
        "is_all_not_applicable": bool(checklist) and applicable_count == 0,
    }
