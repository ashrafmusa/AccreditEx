"""
Shared reliability and security helpers for the Unified AccrediTex agent.

- InputValidator: sanitizes user-controlled text before it is placed in prompts
- ConversationManager: dict-like conversation store with TTL + max size
- ErrorHandler: consistent error logging / user-facing messages
"""
import logging
import os
import re
import time
from typing import Any, Dict, Iterable, List, Optional

logger = logging.getLogger(__name__)


def env_number(name: str, default, cast=int):
    """Read a numeric env var, falling back to the default with a warning if invalid."""
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return cast(raw)
    except ValueError:
        logger.warning("Invalid value for %s; using default %s", name, default)
        return default


class InputValidator:
    """Sanitization helpers to reduce prompt-injection risk."""

    DEFAULT_MAX_LENGTH = 500
    LONG_MAX_LENGTH = 4000

    _CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
    _ROLE_MARKERS = re.compile(
        r"\[\s{0,5}/?\s{0,5}(?:SYSTEM|INST|ASSISTANT|USER)\b[^\]]{0,500}\]"
        r"|<\|[^|>]*\|>"
        r"|<\s{0,5}/?\s{0,5}(?:system|assistant|user)\s{0,5}>",
        re.IGNORECASE,
    )
    _INJECTION_PHRASES = re.compile(
        r"ignore\s+(?:all\s+|any\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)"
        r"|disregard\s+(?:all\s+|any\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)"
        r"|forget\s+(?:all\s+)?(?:your|previous|prior)\s+(?:instructions?|rules?)"
        r"|reveal\s+(?:your\s+)?system\s+prompt",
        re.IGNORECASE,
    )
    _MARKDOWN_HEADER_BREAK = re.compile(r"(?m)^\s*#{1,6}\s*(?=system\b)", re.IGNORECASE)
    _THREAD_ID = re.compile(r"^[A-Za-z0-9_.:\-]{1,128}$")

    @classmethod
    def sanitize_text(cls, text: Any, max_length: int = DEFAULT_MAX_LENGTH) -> str:
        """Return a safe, truncated string; non-strings yield an empty string."""
        if text is None or not isinstance(text, str):
            return ""
        # Bound input size before running regexes (ReDoS protection)
        text = text[: max(max_length * 4, 2000)]
        text = cls._CONTROL_CHARS.sub("", text)
        text = cls._ROLE_MARKERS.sub("[BLOCKED]", text)
        text = cls._INJECTION_PHRASES.sub("[BLOCKED]", text)
        text = cls._MARKDOWN_HEADER_BREAK.sub("", text)
        text = text.replace("```", "'''")
        return text.strip()[:max_length]

    @classmethod
    def sanitize_long_text(cls, text: Any) -> str:
        return cls.sanitize_text(text, cls.LONG_MAX_LENGTH)

    @classmethod
    def sanitize_list(
        cls, items: Optional[Iterable[Any]], max_items: int = 20, max_length: int = DEFAULT_MAX_LENGTH
    ) -> List[str]:
        if not items or isinstance(items, (str, bytes)):
            return []
        result: List[str] = []
        for item in items:
            cleaned = cls.sanitize_text(item, max_length)
            if cleaned:
                result.append(cleaned)
            if len(result) >= max_items:
                break
        return result

    @classmethod
    def validate_required(cls, value: Any, name: str, max_length: int = DEFAULT_MAX_LENGTH) -> str:
        """Sanitize and require a non-empty value; raises ValueError otherwise."""
        cleaned = cls.sanitize_text(value, max_length)
        if not cleaned:
            raise ValueError(f"'{name}' is required and must be a non-empty string")
        return cleaned

    @classmethod
    def is_valid_thread_id(cls, thread_id: Any) -> bool:
        return isinstance(thread_id, str) and bool(cls._THREAD_ID.match(thread_id))


class ConversationManager(dict):
    """
    Dict of thread_id -> messages with TTL expiry and a maximum size.

    Subclasses dict so existing code using ``in``, ``len`` and indexing keeps
    working. Access or assignment refreshes a thread's TTL; the least recently
    used threads are evicted once ``max_conversations`` is exceeded.
    """

    def __init__(self, ttl_seconds: int = 3600, max_conversations: int = 1000, time_func=time.time):
        super().__init__()
        self.ttl_seconds = ttl_seconds
        self.max_conversations = max_conversations
        self._time = time_func
        self._last_access: Dict[str, float] = {}

    def __setitem__(self, key, value):
        self.cleanup()
        super().__setitem__(key, value)
        self._last_access[key] = self._time()
        self._evict_over_limit(protect=key)

    def __getitem__(self, key):
        value = super().__getitem__(key)
        self._last_access[key] = self._time()
        return value

    def get(self, key, default=None):
        if key in self:
            return self[key]
        return default

    def setdefault(self, key, default=None):
        if key in self:
            return self[key]
        self[key] = default
        return default

    def __delitem__(self, key):
        super().__delitem__(key)
        self._last_access.pop(key, None)

    def __contains__(self, key):
        if not super().__contains__(key):
            return False
        if self._is_expired(key):
            self.pop(key, None)
            return False
        return True

    def pop(self, key, *default):
        self._last_access.pop(key, None)
        return super().pop(key, *default)

    def clear(self):
        super().clear()
        self._last_access.clear()

    def _is_expired(self, key) -> bool:
        return self._time() - self._last_access.get(key, 0) > self.ttl_seconds

    def cleanup(self) -> int:
        """Remove expired threads; returns number removed."""
        expired = [k for k in list(self._last_access) if self._is_expired(k)]
        for k in expired:
            self.pop(k, None)
        if expired:
            logger.info("Expired %d conversation thread(s)", len(expired))
        return len(expired)

    def _evict_over_limit(self, protect=None):
        while len(self) > self.max_conversations:
            candidates = [k for k in self._last_access if k != protect]
            if not candidates:
                break
            oldest = min(candidates, key=self._last_access.get)
            self.pop(oldest, None)
            logger.info("Evicted least recently used conversation thread")


class ErrorHandler:
    """Consistent error logging and user-safe messages."""

    GENERIC_MESSAGE = "I encountered an error processing your request. Please try again."

    @staticmethod
    def log(error: Exception, context: str = "") -> None:
        logger.error("error in %s: %s: %s", context or "agent", type(error).__name__, error)

    @classmethod
    def user_message(cls, error: Exception) -> str:
        """Message safe to show users (no internal details)."""
        if isinstance(error, ValueError):
            return str(error)
        return cls.GENERIC_MESSAGE

    @classmethod
    def workflow_error(cls, error: Exception, context: str = "") -> Dict[str, Any]:
        cls.log(error, context)
        return {"status": "error", "error": cls.user_message(error)}
