#!/usr/bin/env python3
import sys
import subprocess
import json
from pathlib import Path

def get_soul_memory(task_description, k=3):
    """
    Retrieves the top K relevant patterns/decisions from the ReasoningBank
    and formats them as a 'Soul Memory' block for agent injection.
    """
    try:
        # Run the retrieval script
        cmd = ["python", "scripts/reasoning_bank.py", "retrieve", task_description, "--k", str(k)]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return f"<!-- Soul Retrieval Error: {result.stderr} -->"

        data = json.loads(result.stdout)
        matches = data.get("results", [])

        if not matches:
            return ""

        soul_block = [
            "## SOUL MEMORY (Past Wisdom)",
            "Based on your past successful decisions, apply these patterns to the current task:",
            ""
        ]

        for match in matches:
            decision = match.get("decision", "N/A")
            task = match.get("task", "N/A")
            similarity = match.get("similarity", 0)
            soul_block.append(f"### Pattern: {task}")
            soul_block.append(f"- **Wisdom**: {decision}")
            soul_block.append(f"- **Context**: Similarity {similarity:.2f}")
            soul_block.append("")

        return "\n".join(soul_block)

    except Exception as e:
        return f"<!-- Soul Injection Failed: {str(e)} -->"

if __name__ == "__main__":
    # Ensure UTF-8 output on Windows
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print("Usage: python soul_inject.py 'task description'")
        sys.exit(1)

    task = sys.argv[1]
    print(get_soul_memory(task))
