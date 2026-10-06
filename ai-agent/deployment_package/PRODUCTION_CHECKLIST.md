# Production Readiness Checklist — Unified AccrediTex Agent

## Environment variables
| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` / `OPENAI_API_KEY` | – | LLM credentials (required) |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq endpoint |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Primary model |
| `GROQ_FALLBACK_MODEL` | `llama-3.1-8b-instant` | Rate-limit fallback model |
| `AGENT_TEMPERATURE` / `AGENT_MAX_TOKENS` | `0.7` / `4096` | Generation settings |
| `RESPONSE_CACHE_TTL_SECONDS` | `600` | Response cache TTL |
| `CONVERSATION_TTL_SECONDS` | `3600` | Idle conversation expiry |
| `MAX_CONVERSATIONS` | `1000` | Max in-memory threads (LRU eviction) |
| `STRICT_SPECIALIST_ROUTING` | `true` | Specialist dispatch |

## Checks
- [ ] `pip install -r requirements.txt` (includes `structlog`)
- [ ] `python -m pytest tests/test_agent_utils.py` passes
- [ ] Credentials set via environment, none committed
- [ ] User input in prompts goes through `agent_utils.InputValidator`
- [ ] Conversations are bounded (`ConversationManager`); use Redis/Firestore if running multiple instances
- [ ] Degraded context is flagged (`_fallback` / `_error` in org context, `context_degraded` in chat context)
- [ ] Logs are plain text/structured (no emoji)
- [ ] Workflow endpoints return `status: "error"` payloads instead of raising on invalid input
