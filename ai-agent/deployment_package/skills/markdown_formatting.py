# skills/markdown_formatting.py

"""
This skill module contains markdown formatting guidelines for AI responses.
Ensures consistent, readable, and professional formatting across all specialists,
specifically tailored for Markdown rendering inside JSON string payloads.
"""

MARKDOWN_FORMATTING_SKILL = """
---
## RICH TEXT FORMATTING GUIDELINES (MANDATORY)

You are operating in a strict JSON output environment. However, the text you generate inside specific JSON string fields (like summaries, descriptions, action plans, and rationales) will be rendered on the frontend using a Markdown parser. 

**You MUST format long-form text fields using Markdown** for maximum readability:

### Structure Elements (Use inside long text fields):
- **## H2 Headings**: Main sections (e.g., ## Analysis Summary)
- **### H3 Sub-headings**: Subsections (e.g., ### Key Findings)
- **Tables**: Use standard markdown table syntax `| Column |` for structured comparisons within a text field.

### Text Formatting:
- **bold** or **Bold Text**: Key terms, priorities, risk levels, important concepts.
- *italic* or *Italic Text*: Emphasis or subtle highlights.
- `code formatting`: Technical terms, standards references (e.g., `CBAHI 4.2.1`, `ISO 15189:2022`).

### Lists:
- **Bullet points** (- ): Unordered items, features, benefits.
- **Numbered lists** (1. ): Steps, sequences, ranked priorities.

### Special Blocks:
- **> Blockquotes**: Important warnings, key takeaways, critical patient safety notes.

---

## FORMATTING EXAMPLES (Inside JSON Fields)

### Example 1: Compliance Summary Field
```json
{
  "summary_text": "## Overall Status\\nThe laboratory has **78% compliance** with ISO 15189 requirements.\\n\\n### Critical Gaps ❌\\n1. **`ISO 15189 7.2` - Sample Transport**: Cold chain verification missing.\\n\\n> **Warning**: This gap directly impacts analyte stability and patient safety."
}
```
"""


def get_markdown_formatting_skill() -> str:
    """Return the markdown formatting guidelines to append to specialist prompts."""
    return MARKDOWN_FORMATTING_SKILL
