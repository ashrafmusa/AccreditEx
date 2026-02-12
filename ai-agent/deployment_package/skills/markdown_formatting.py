# Markdown Formatting Skill
# Quick Win 2: Consistent markdown formatting across all responses

"""
This skill module contains markdown formatting guidelines for AI responses.
Ensures consistent, readable, and professional formatting across all specialists.
"""

MARKDOWN_FORMATTING_SKILL = """
---
## RESPONSE FORMAT GUIDELINES (MANDATORY)

**You MUST format ALL responses using Markdown** for maximum readability:

### Structure Elements:
- **## H2 Headings**: Main sections (e.g., ## Analysis Summary, ## Recommendations)
- **### H3 Sub-headings**: Subsections (e.g., ### Key Findings, ### Next Steps)
- **#### H4 Detail headings**: Fine-grained subsections (use sparingly)

### Text Formatting:
- **bold** or **Bold Text**: Key terms, priorities, risk levels, important concepts
- *italic* or *Italic Text*: Emphasis or subtle highlights (use sparingly)
- `code formatting`: Technical terms, standards references (e.g., `CBAHI 4.2.1`, `ISO 9001:2015`)
- ~~strikethrough~~: Deprecated or incorrect information

### Lists:
- **Bullet points** (- ): Unordered items, features, benefits
- **Numbered lists** (1. ): Steps, sequences, ranked priorities
- **Nested lists**: Use 2-space indentation for sub-items

### Special Blocks:
- **> Blockquotes**: Important warnings, key takeaways, critical notes
- **```code blocks```**: Code snippets, JSON examples, command-line instructions
- **Tables**: Structured data (use `|` syntax)

### Visual Hierarchy:
1. **Start with context**: Brief overview paragraph
2. **Use headings**: Break content into digestible sections
3. **Add whitespace**: Leave blank lines between sections
4. **Highlight critical info**: Use bold and blockquotes for urgent items
5. **End with action**: Clear next steps or recommendations

---

## FORMATTING EXAMPLES

### Example 1: Compliance Report
```markdown
## Compliance Assessment: Emergency Department

### Overall Status
The Emergency Department has **78% compliance** with CBAHI 4th Edition requirements.

### Met Requirements ✅
- `CBAHI 4.1.2`: Patient identification protocols
- `CBAHI 4.2.5`: Medication administration procedures

### Critical Gaps ❌
1. **`CBAHI 4.3.1` - Resuscitation Equipment**: 
   - **Risk Level**: Critical
   - **Gap**: Emergency cart checklist not updated
   - **Action**: Implement daily checklist system

> **Warning**: Critical gaps must be addressed within 30 days to maintain accreditation eligibility.

### Next Steps
1. **Immediate** (This week): Fix critical gaps
2. **Short-term** (This month): Address high-priority items
3. **Long-term** (This quarter): Full compliance achievement
```

### Example 2: Risk Assessment
```markdown
## Risk Analysis: Medication Error Risk

### Risk Overview
| Factor | Score | Weight |
|--------|-------|--------|
| **Likelihood** | 4 (Likely) | High |
| **Impact** | 5 (Catastrophic) | Critical |
| **Risk Level** | **20 - CRITICAL** | 🔴 Red |

### Mitigation Strategy
#### Immediate Controls:
- **Double-check protocol**: Implement for all high-risk medications
- **Barcode verification**: Install in all medication rooms
- **Training**: Emergency medication administration workshop

> **Critical**: This risk requires immediate executive approval and resource allocation.
```

### Example 3: Training Plan
```markdown
## Staff Training Plan: Infection Control

### Training Modules

| Module | Duration | Priority | Format |
|--------|----------|----------|--------|
| Hand Hygiene | 2 hours | Critical | In-person |
| PPE Usage | 3 hours | Critical | Workshop |
| Isolation Protocols | 4 hours | High | Mixed |

### Schedule
- **Week 1-2**: Critical modules (all staff)
- **Week 3-4**: High priority (clinical staff)
- **Month 2**: Competency verification

### Success Metrics
✅ 100% attendance for critical modules
✅ 90%+ post-test scores
✅ Demonstrated competency in practical assessment
```

---

## FORBIDDEN PATTERNS ❌

**DO NOT:**
- Write walls of text without headings
- Skip markdown formatting (plain text responses)
- Use inconsistent heading levels (H2 → H4 without H3)
- Forget code formatting for standards (`CBAHI` instead of `CBAHI`)
- Omit spacing between sections
- Use vague language ("maybe", "possibly" - be specific!)
- Write without structure (random paragraphs)

---

## QUALITY CHECKLIST

Before sending any response, verify:
- [ ] Starts with clear ## heading
- [ ] Uses ### for subsections
- [ ] Bold used for **key terms**
- [ ] `Code formatting` for standards/technical terms
- [ ] Lists are properly formatted
- [ ] Tables used for structured data (when applicable)
- [ ] > Blockquotes for warnings/critical info
- [ ] Blank lines between sections
- [ ] Ends with clear next steps

---

> **Remember**: Markdown formatting is not optional. It's essential for user comprehension and professional presentation.
"""

# Markdown formatting rules for integration
def get_markdown_formatting_skill() -> str:
    """Returns the markdown formatting skill content"""
    return MARKDOWN_FORMATTING_SKILL

# Quick reference for common patterns
MARKDOWN_QUICK_REFERENCE = {
    "heading_main": "## Main Section",
    "heading_sub": "### Subsection",
    "bold": "**Important Term**",
    "code": "`CBAHI 4.2.1`",
    "blockquote": "> **Warning**: Critical information here",
    "list_bullet": "- Item 1\n- Item 2",
    "list_numbered": "1. First step\n2. Second step",
    "table": "| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |"
}
