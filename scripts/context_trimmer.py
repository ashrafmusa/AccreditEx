#!/usr/bin/env python3
import sys
import os
import re
from pathlib import Path

def trim_file_context(file_path, target_pattern=None, window=50):
    """
    Trims a file to only include the relevant sections, reducing tokens.
    If no pattern is provided, it returns the first 'window' lines.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        total_lines = len(lines)
        if total_lines <= window * 2:
            return "".join(lines)

        if not target_pattern:
            return "".join(lines[:window]) + "\n... [Lines 50+ Truncated to Save Tokens] ...\n"

        # Find line numbers matching pattern
        matches = [i for i, line in enumerate(lines) if re.search(target_pattern, line, re.IGNORECASE)]

        if not matches:
            return "".join(lines[:window]) + "\n... [Pattern Not Found, Returning Head] ...\n"

        # Calculate range
        start = max(0, matches[0] - window // 2)
        end = min(total_lines, matches[0] + window // 2)

        trimmed = []
        if start > 0:
            trimmed.append(f"// ... [Truncated Lines 1-{start}] ...\n")

        trimmed.extend(lines[start:end])

        if end < total_lines:
            trimmed.append(f"\n// ... [Truncated Lines {end}-{total_lines}] ...\n")

        return "".join(trimmed)

    except Exception as e:
        return f"// Error trimming file: {str(e)}"

if __name__ == "__main__":
    # Ensure UTF-8 output on Windows
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print("Usage: python context_trimmer.py <file_path> [pattern] [window_size]")
        sys.exit(1)

    path = sys.argv[1]
    pat = sys.argv[2] if len(sys.argv) > 2 else None
    win = int(sys.argv[3]) if len(sys.argv) > 3 else 50

    print(trim_file_context(path, pat, win))
