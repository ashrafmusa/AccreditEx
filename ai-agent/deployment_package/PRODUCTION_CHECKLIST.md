# Specialist Agents - Production Deployment Checklist

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | (required) | Groq API credential |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Primary model (must exist on Groq) |
| `GROQ_FALLBACK_MODEL` | `llama-3.1-8b-instant` | Used when the primary model returns 429 |
| `AGENT_TEMPERATURE` | agent default | Global temperature override (0-2) |
| `COMPLIANCE_TEMPERATURE` | `0.2` | Compliance agent temperature |
| `RISK_TEMPERATURE` | `0.2` | Risk agent temperature |
| `TRAINING_TEMPERATURE` | `0.4` | Training agent temperature |
| `AGENT_MAX_TOKENS` | `1536` | Max completion tokens |
| `AGENT_CACHE_TTL` | `600` | Response cache TTL in seconds (`0` disables) |
| `AGENT_CACHE_MAX_ENTRIES` | `256` | Max cached responses per agent |
| `AGENT_RATE_LIMIT_REQUESTS` | `10` | Requests per user per window |
| `AGENT_RATE_LIMIT_WINDOW` | `60` | Window length in seconds |
| `AGENT_MAX_INPUT_LENGTH` | `10000` | Max characters per sanitized input |

Invalid numeric values fall back to defaults.

## Security requirements

- [ ] All user-provided values are passed through `InputValidator` before prompt use (done in all agents).
- [ ] Pass a stable `user_id` (or `context["user_id"]`) so rate limiting is per user.
- [ ] Secrets are set only as platform environment variables, never committed.
- [ ] Treat `structured_data is None` as "unvalidated LLM output"; do not trust `response` directly.

## Performance expectations

- Identical requests within the TTL are served from cache (no API call, no rate-limit quota used).
- Rate-limited calls return `{"error": ..., "rate_limited": true, "retry_after": <seconds>}`.
- The cache and rate limiter are in-process; with multiple workers each has its own state
  (use a shared store such as Redis if strict global limits are required).

## Monitoring and alerting

Logs are ASCII-only `[COMPONENT] event key=value` lines. Suggested alerts:

- `rate_limited` events spiking (abuse or undersized limits)
- `llm_response_schema_invalid` / `llm_response_not_json` rate above 5%
- `model_rate_limited_fallback` events (Groq quota pressure)
- `request_failed` / `chat_failed` errors
- `cache_hit` ratio (tuning `AGENT_CACHE_TTL`)

## Pre-deploy verification

```bash
pip install -r requirements.txt
python -m pytest tests/test_agents_security.py tests/test_agents_reliability.py \
  tests/test_agents_performance.py tests/test_agents_configuration.py --no-cov
```
