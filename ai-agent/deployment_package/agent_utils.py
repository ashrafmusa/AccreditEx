"""
Shared utilities for specialist agents.

- AgentConfig: centralized, environment-driven configuration
- InputValidator: sanitization of user input / prompt-injection mitigation
- ResponseValidator: LLM JSON response schema validation
- RateLimiter: per-user sliding-window rate limiting
- AgentLogger: structured, ASCII-only logging
"""

import logging
import os
import re
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Any, Deque, Dict, Iterable, List, Mapping, Optional, Tuple, Union

DEFAULT_MODEL = "openai/gpt-oss-120b"
DEFAULT_FALLBACK_MODEL = "llama-3.1-8b-instant"


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# ==================== Configuration ====================

@dataclass(frozen=True)
class AgentConfig:
    """Centralized agent configuration (read from environment variables)."""

    model: str = DEFAULT_MODEL
    fallback_model: str = DEFAULT_FALLBACK_MODEL
    temperature: float = 0.7
    max_tokens: int = 1536
    cache_ttl_seconds: int = 600
    cache_max_entries: int = 256
    rate_limit_requests: int = 10
    rate_limit_window_seconds: int = 60
    max_input_length: int = 10000

    @classmethod
    def from_env(cls, agent_prefix: Optional[str] = None,
                 default_temperature: Optional[float] = None) -> "AgentConfig":
        """
        Build config from environment variables.

        Variables: GROQ_MODEL, GROQ_FALLBACK_MODEL, AGENT_TEMPERATURE,
        <PREFIX>_TEMPERATURE (e.g. COMPLIANCE_TEMPERATURE), AGENT_MAX_TOKENS,
        AGENT_CACHE_TTL, AGENT_CACHE_MAX_ENTRIES, AGENT_RATE_LIMIT_REQUESTS,
        AGENT_RATE_LIMIT_WINDOW, AGENT_MAX_INPUT_LENGTH.
        """
        base_temp = default_temperature if default_temperature is not None else cls.temperature
        temperature = _env_float("AGENT_TEMPERATURE", base_temp)
        if agent_prefix:
            temperature = _env_float(f"{agent_prefix.upper()}_TEMPERATURE", temperature)
        temperature = min(max(temperature, 0.0), 2.0)
        return cls(
            model=os.getenv("GROQ_MODEL") or DEFAULT_MODEL,
            fallback_model=os.getenv("GROQ_FALLBACK_MODEL") or DEFAULT_FALLBACK_MODEL,
            temperature=temperature,
            max_tokens=max(1, _env_int("AGENT_MAX_TOKENS", cls.max_tokens)),
            cache_ttl_seconds=max(0, _env_int("AGENT_CACHE_TTL", cls.cache_ttl_seconds)),
            cache_max_entries=max(1, _env_int("AGENT_CACHE_MAX_ENTRIES", cls.cache_max_entries)),
            rate_limit_requests=max(1, _env_int("AGENT_RATE_LIMIT_REQUESTS", cls.rate_limit_requests)),
            rate_limit_window_seconds=max(1, _env_int("AGENT_RATE_LIMIT_WINDOW", cls.rate_limit_window_seconds)),
            max_input_length=max(1, _env_int("AGENT_MAX_INPUT_LENGTH", cls.max_input_length)),
        )


# ==================== Input validation ====================

class InputValidationError(ValueError):
    """Raised when user input is invalid."""


class InputValidator:
    """Sanitize user supplied values before they are interpolated into prompts."""

    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)?\s*(instructions?|prompts?|rules?)",
        r"disregard\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)?\s*(instructions?|prompts?|rules?)",
        r"forget\s+(all\s+|everything\s+|your\s+)?(previous\s+|prior\s+)?(instructions?|rules?)",
        r"override\s+(the\s+|your\s+)?(system\s+)?(instructions?|prompt|rules?)",
        r"you\s+are\s+now\s+(a|an|in)\b",
        r"(reveal|show|print|repeat)\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions)",
        r"\[\s*/?\s*(system|assistant|inst)\s*[:\]]",
        r"<\s*/?\s*(system|assistant|im_start|im_end)\s*>",
        r"<\|[a-z_]+\|>",
        r"^\s*(system|assistant)\s*:",
    ]
    _COMPILED = [re.compile(p, re.IGNORECASE | re.MULTILINE) for p in INJECTION_PATTERNS]
    _CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
    REDACTION = "[FILTERED]"

    def __init__(self, default_max_length: Optional[int] = None) -> None:
        self.default_max_length = default_max_length or AgentConfig.max_input_length

    def detect_injection(self, text: Any) -> bool:
        """Return True if text matches a known prompt-injection pattern."""
        if not isinstance(text, str):
            return False
        return any(p.search(text) for p in self._COMPILED)

    def sanitize(self, value: Any, max_length: Optional[int] = None,
                 field_name: str = "input", allow_empty: bool = True) -> str:
        """Return a safe string: coerced, control chars removed, injection phrases filtered, truncated."""
        if value is None:
            value = ""
        if not isinstance(value, str):
            value = str(value)
        limit = max_length or self.default_max_length
        text = self._CONTROL_CHARS.sub("", value).replace("\r\n", "\n")
        text = text[:limit]
        for pattern in self._COMPILED:
            text = pattern.sub(self.REDACTION, text)
        # Prevent breaking out of the surrounding prompt structure
        text = text.replace("```", "'''").strip()
        if not allow_empty and not text:
            raise InputValidationError(f"{field_name} must not be empty")
        return text

    def sanitize_list(self, values: Optional[Iterable[Any]], max_items: int = 100,
                      max_length: int = 200) -> List[str]:
        """Sanitize each element of a list (non-iterables yield an empty list)."""
        if values is None or isinstance(values, (str, bytes, dict)):
            return []
        return [self.sanitize(v, max_length=max_length) for v in list(values)[:max_items]]

    def sanitize_dict(self, data: Optional[Mapping[str, Any]], max_length: int = 1000) -> Dict[str, str]:
        """Sanitize keys and values of a flat dict."""
        if not isinstance(data, Mapping):
            return {}
        return {
            self.sanitize(k, max_length=100): self.sanitize(v, max_length=max_length)
            for k, v in data.items()
        }


# ==================== Response validation ====================

SchemaType = Union[type, Tuple[type, ...]]


class ResponseValidator:
    """Validate parsed LLM JSON against an expected structure."""

    @staticmethod
    def _type_name(t: SchemaType) -> str:
        return "/".join(x.__name__ for x in t) if isinstance(t, tuple) else t.__name__

    @classmethod
    def validate(cls, data: Any, required: Mapping[str, SchemaType],
                 list_item_keys: Optional[Mapping[str, Iterable[str]]] = None) -> Tuple[bool, List[str]]:
        """
        Args:
            data: parsed JSON value
            required: top-level required keys mapped to expected type(s)
            list_item_keys: for list-valued keys, keys each item (dict) must have
        Returns:
            (is_valid, list_of_error_messages)
        """
        errors: List[str] = []
        if not isinstance(data, dict):
            return False, ["response is not a JSON object"]
        for key, expected in required.items():
            if key not in data:
                errors.append(f"missing key '{key}'")
                continue
            value = data[key]
            # bool is an int subclass; reject it where numbers are expected
            numeric = expected in (int, float) or (isinstance(expected, tuple) and (int in expected or float in expected))
            if (isinstance(value, bool) and numeric) or not isinstance(value, expected):
                errors.append(f"key '{key}' must be {cls._type_name(expected)}")
        for key, item_keys in (list_item_keys or {}).items():
            items = data.get(key)
            if not isinstance(items, list):
                continue
            for i, item in enumerate(items):
                if not isinstance(item, dict):
                    errors.append(f"'{key}[{i}]' must be an object")
                    continue
                for k in item_keys:
                    if k not in item:
                        errors.append(f"'{key}[{i}]' missing key '{k}'")
        return (not errors), errors


# ==================== Rate limiting ====================

class RateLimitExceeded(Exception):
    """Raised when a user exceeds the configured request rate."""

    def __init__(self, user_id: str, retry_after: float) -> None:
        super().__init__(f"Rate limit exceeded for user '{user_id}'. Retry in {retry_after:.0f}s")
        self.user_id = user_id
        self.retry_after = retry_after


class RateLimiter:
    """Thread-safe per-user sliding window rate limiter."""

    def __init__(self, max_requests: int = 10, window_seconds: float = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, user_id: str) -> None:
        """Record a request for user_id or raise RateLimitExceeded."""
        now = time.monotonic()
        with self._lock:
            q = self._requests[user_id]
            while q and q[0] <= now - self.window_seconds:
                q.popleft()
            if len(q) >= self.max_requests:
                raise RateLimitExceeded(user_id, self.window_seconds - (now - q[0]))
            q.append(now)

    def allow(self, user_id: str) -> bool:
        """Boolean variant of check()."""
        try:
            self.check(user_id)
            return True
        except RateLimitExceeded:
            return False

    def reset(self, user_id: Optional[str] = None) -> None:
        with self._lock:
            if user_id is None:
                self._requests.clear()
            else:
                self._requests.pop(user_id, None)


# ==================== Logging ====================

class AgentLogger:
    """Structured logger producing ASCII-only 'key=value' lines (no emojis)."""

    _NON_ASCII = re.compile(r"[^\x20-\x7e]")

    def __init__(self, component: str) -> None:
        self.component = component.upper().replace(" ", "_")
        self._logger = logging.getLogger(f"agents.{component}")

    def _format(self, event: str, fields: Mapping[str, Any]) -> str:
        parts = [f"[{self.component}] {event}"] + [f"{k}={v}" for k, v in fields.items()]
        return self._NON_ASCII.sub("?", " ".join(parts))

    def debug(self, event: str, **fields: Any) -> None:
        self._logger.debug(self._format(event, fields))

    def info(self, event: str, **fields: Any) -> None:
        self._logger.info(self._format(event, fields))

    def warning(self, event: str, **fields: Any) -> None:
        self._logger.warning(self._format(event, fields))

    def error(self, event: str, **fields: Any) -> None:
        self._logger.error(self._format(event, fields))


def build_workspace_snapshot(context: Optional[Mapping[str, Any]]) -> str:
    """Render the caller's live workspace data (sent by their own session) as a prompt block."""
    if not isinstance(context, Mapping):
        return ""
    data = context.get("current_data") or {}
    if not isinstance(data, Mapping):
        return ""
    projects = data.get("workspace_projects") or []
    if not projects and data.get("total_projects") is None:
        return ""

    def _n(value: Any) -> int:
        return value if isinstance(value, int) else 0

    lines = [
        "\n\nLIVE WORKSPACE SNAPSHOT (authoritative; answer from this data and never claim you lack access to it):",
        f"- Projects: {_n(data.get('total_projects')) or len(projects)} | Documents: {_n(data.get('total_documents'))} | "
        f"Departments: {_n(data.get('total_departments'))} | Users: {_n(data.get('total_users'))} | "
        f"Open risks: {_n(data.get('open_risks_count'))}",
    ]
    for p in list(projects)[:25]:
        if not isinstance(p, Mapping):
            continue
        total, done = _n(p.get("checklist_total")), _n(p.get("compliant"))
        pct = round(100 * done / total) if total else 0
        lead = f", lead: {str(p['lead'])[:60]}" if p.get("lead") else ", no lead assigned"
        lines.append(
            f"- {str(p.get('name', 'Unnamed'))[:80]} [{str(p.get('status', '?'))[:30]}]: {pct}% compliant "
            f"({done}/{total} items; partial {_n(p.get('partial'))}, non-compliant {_n(p.get('non_compliant'))}, "
            f"not started {_n(p.get('not_started'))}){lead}"
        )
    return "\n".join(lines) + ACTION_INSTRUCTIONS


ACTION_INSTRUCTIONS = (
    "\n\nPROPOSING ACTIONS: only when the user explicitly asks you to log or register a risk, "
    "end your reply with exactly one fenced block so the app can show a confirm button. Never claim "
    "the risk was already created; the user must press the button. Format:\n"
    "```accreditex-action\n"
    '{"type":"create_risk","title":"short title","description":"details","likelihood":1-5,'
    '"impact":1-5,"mitigationPlan":"proposed mitigation"}\n'
    "```"
)
