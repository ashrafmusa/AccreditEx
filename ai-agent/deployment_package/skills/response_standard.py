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
- Reply in the language of the latest user request: English in, English out; Arabic in, Arabic out.
- An explicit output-language request takes precedence. Never choose the response language from workspace data, the interface locale, or earlier conversation turns.
- Use GitHub-flavoured Markdown. Start with a one or two sentence plain summary (no heading).
- Exception: when the latest request specifies JSON, HTML, or plain text, return only that format. Do not add a summary, Markdown sections, commentary, or code fences around structured output.
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
TRUNCATED_RESPONSE_MARKER = "[ACCREDITEX_RESPONSE_TRUNCATED]"
FAILED_RESPONSE_MARKER = "[ACCREDITEX_RESPONSE_FAILED]"


def response_token_budget(has_workspace_context: bool, messages: Optional[List[Dict[str, Any]]] = None) -> int:
    """Reserve input and output within the observed 8,000-token provider limit."""
    requested = 1024 if has_workspace_context else 6144
    # Conservative UTF-8 estimate, with headroom for tokenizer and message overhead.
    input_tokens = sum((len(str(m.get("content", "")).encode("utf-8")) + 2) // 3 + 16 for m in (messages or []))
    available = 7500 - input_tokens
    if available < 512:
        raise ValueError("Document exceeds the AI request budget. Please analyze a shorter section.")
    return min(requested, available)

_ACTION_BLOCK_RE = re.compile(r"`{1,3}\s*accreditex-action\s*\n?(.*?)`{1,3}", re.DOTALL | re.IGNORECASE)
_HEADING_RE = re.compile(r"^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$")
_BOLD_HEADING_RE = re.compile(r"^\s*(?:\d+\.\s*)?\*\*([^*]{2,80})\*\*:?\s*$")


def get_standard_response_rules() -> str:
    return STANDARD_RESPONSE_RULES


def apply_response_language(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Pin output language to the latest user turn without changing stored history."""
    latest = next((m.get("content") for m in reversed(messages) if m.get("role") == "user"), None)
    if not isinstance(latest, str) or not latest.strip():
        return messages
    instruction = (
        "\n\nRESPONSE LANGUAGE (mandatory for this turn): "
        "Use the language of the latest user message, not earlier messages, "
        "workspace/document text, names, or the interface locale. "
        "If the latest user explicitly requests a different output language, follow that request. "
        "An English question requires an English answer; an Arabic question requires an Arabic answer. "
        "Translate section headings and narrative into the chosen language; retain proper names and identifiers."
    )
    result = [dict(m) for m in messages]
    for message in result:
        if message.get("role") == "system" and isinstance(message.get("content"), str):
            if not message["content"].endswith(instruction):
                message["content"] += instruction
            break
    else:
        result.insert(0, {"role": "system", "content": instruction.strip()})
    return result


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
