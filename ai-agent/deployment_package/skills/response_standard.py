"""
Standard AI response contract for AccreditEx.

Every AI feature in the app (chat, workflow endpoints, specialists) should:
  * follow STANDARD_RESPONSE_RULES in its system prompt, and
  * return payloads built by build_standard_response() so the frontend can
    render them with a single component.
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

STANDARD_RESPONSE_RULES = """

RESPONSE STANDARD (AccreditEx - mandatory):
- Reply in the same language as the user's request (Arabic in, Arabic out).
- Use GitHub-flavoured Markdown. Start with a one or two sentence plain summary (no heading).
- For analyses, plans and assessments use "## " sections in this order, skipping any that do not apply:
  ## Findings, ## Recommended Actions, ## Next Steps
  Domain sections (e.g. ## Root Cause, ## Timeline) may sit between Findings and Recommended Actions.
- Use bullet or numbered lists, **bold** for key terms and `code` for standard references (e.g. `CBAHI LB.12`).
- Use a markdown table only for genuinely tabular data; never wrap the whole answer in a code block.
- Never invent statistics, scores, dates, names or standard numbers that are not in the provided data; say what is unknown instead.
- Prefer the organization's own workspace data over generic advice.
- Be concise: at most about 400 words unless the user asks for a full document.
"""

SCHEMA_VERSION = "ai-response/1"

_ACTION_BLOCK_RE = re.compile(r"`{1,3}\s*accreditex-action\s*\n?(.*?)`{1,3}", re.DOTALL | re.IGNORECASE)
_HEADING_RE = re.compile(r"^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$")
_BOLD_HEADING_RE = re.compile(r"^\s*(?:\d+\.\s*)?\*\*([^*]{2,80})\*\*:?\s*$")


def get_standard_response_rules() -> str:
    return STANDARD_RESPONSE_RULES


def _normalize_text(content: Any) -> str:
    if content is None:
        return ""
    if not isinstance(content, str):
        try:
            content = json.dumps(content, ensure_ascii=False)
        except (TypeError, ValueError):
            content = str(content)
    text = content.strip()
    if "\\n" in text and text.count("\\n") > text.count("\n"):
        text = text.replace("\\n", "\n")
    return text


def _unwrap_json_payload(text: str) -> str:
    """Specialists may return JSON like {"summary_text": "..."}; use its narrative."""
    candidate = text.strip()
    fence = re.match(r"^`{1,3}(?:json)?\s*(.*?)\s*`{1,3}$", candidate, re.DOTALL)
    if fence:
        candidate = fence.group(1).strip()
    if not candidate.startswith("{"):
        return text
    try:
        data = json.loads(candidate, strict=False)
    except (ValueError, TypeError):
        return text
    if not isinstance(data, dict):
        return text
    for key in ("summary_text", "summary", "response", "content", "analysis"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return _normalize_text(value)
    return text


def extract_actions(text: str) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []
    for match in _ACTION_BLOCK_RE.finditer(text or ""):
        raw = match.group(1).strip()
        try:
            parsed = json.loads(raw, strict=False)
        except (ValueError, TypeError):
            continue
        if isinstance(parsed, dict) and parsed.get("type"):
            actions.append(parsed)
    return actions


def strip_actions(text: str) -> str:
    return _ACTION_BLOCK_RE.sub("", text or "").strip()


def parse_sections(text: str) -> List[Dict[str, str]]:
    """Split markdown into [{heading, body}] using '#' headings or bold-only lines."""
    sections: List[Dict[str, str]] = []
    heading: Optional[str] = None
    buffer: List[str] = []

    def flush() -> None:
        body = "\n".join(buffer).strip()
        if heading is not None or body:
            sections.append({"heading": heading or "", "body": body})

    for line in (text or "").splitlines():
        match = _HEADING_RE.match(line)
        if match:
            flush()
            heading = match.group(2).strip().rstrip(":")
            buffer = []
            continue
        bold = _BOLD_HEADING_RE.match(line)
        if bold:
            flush()
            heading = bold.group(1).strip().rstrip(":")
            buffer = []
            continue
        buffer.append(line)
    flush()
    return [s for s in sections if s["heading"] or s["body"]]


def extract_summary(text: str, max_chars: int = 320) -> str:
    """First non-heading paragraph, stripped of markdown emphasis."""
    for block in re.split(r"\n\s*\n", text or ""):
        lines = [ln for ln in block.strip().splitlines() if ln.strip()]
        lines = [ln for ln in lines if not _HEADING_RE.match(ln) and not _BOLD_HEADING_RE.match(ln)]
        if not lines or lines[0].lstrip().startswith("|"):
            continue
        candidate = " ".join(re.sub(r"^[\s>*\-\d.]+", "", ln).strip() for ln in lines[:3])
        candidate = re.sub(r"[*_`#]", "", candidate).strip()
        if len(candidate) < 12:
            continue
        if len(candidate) > max_chars:
            candidate = candidate[: max_chars - 1].rsplit(" ", 1)[0] + "…"
        return candidate
    return ""


def estimate_confidence(text: str) -> float:
    if not text:
        return 0.4
    length = len(text)
    sections = sum(1 for marker in ("1.", "2.", "3.", "- ", "**", "## ") if marker in text)
    if length > 1200 and sections >= 4:
        return 0.9
    if length > 700 and sections >= 3:
        return 0.82
    if length > 350:
        return 0.74
    return 0.62


def build_standard_response(
    response_type: str,
    content: Any,
    *,
    title: Optional[str] = None,
    model: Optional[str] = None,
    legacy_field: Optional[str] = None,
    grounded: bool = False,
    route_mode: str = "endpoint",
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Build the standard AI payload. Legacy field names are kept for old clients."""
    raw_text = _unwrap_json_payload(_normalize_text(content))
    actions = extract_actions(raw_text)
    markdown = strip_actions(raw_text)
    confidence = estimate_confidence(markdown)
    now = datetime.now().isoformat()

    payload: Dict[str, Any] = {
        "status": "completed" if markdown else "empty",
        "type": response_type,
        "title": title or "",
        "summary": extract_summary(markdown),
        "content_markdown": markdown,
        "sections": parse_sections(markdown),
        "actions": actions,
        "confidence": confidence,
        "grounded": grounded,
        "model": model or "",
        "generated_at": now,
        "timestamp": now,
        "meta": {
            "route_mode": route_mode,
            "model": model or "",
            "quality_confidence": confidence,
            "schema_version": SCHEMA_VERSION,
        },
    }
    if legacy_field:
        payload[legacy_field] = markdown
    if extra:
        for key, value in extra.items():
            payload.setdefault(key, value)
    return payload


def standardize_payload(result: Optional[Dict[str, Any]], response_type: str, legacy_field: str) -> Dict[str, Any]:
    """Upgrade an existing (possibly legacy) result dict to the standard contract."""
    data = dict(result or {})
    meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
    if meta.get("schema_version") == SCHEMA_VERSION and data.get("content_markdown") is not None:
        data.setdefault(legacy_field, data.get("content_markdown", ""))
        return data
    content = data.get(legacy_field) or data.get("content_markdown") or data.get("response") or ""
    standard = build_standard_response(
        response_type,
        content,
        title=data.get("title"),
        model=data.get("model") or meta.get("model"),
        legacy_field=legacy_field,
        route_mode=meta.get("route_mode", "endpoint"),
    )
    for key, value in data.items():
        if key not in standard and key != "meta":
            standard[key] = value
    standard["meta"] = {**meta, **standard["meta"]}
    return standard
