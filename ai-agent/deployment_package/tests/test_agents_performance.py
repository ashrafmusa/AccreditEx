"""Caching and rate limiting tests."""
import logging
from unittest.mock import AsyncMock, Mock

import pytest

from agent_utils import AgentLogger, RateLimitExceeded, RateLimiter
from agents import ComplianceAgent


def make_client(content: str = '{"findings": []}') -> Mock:
    client = Mock()
    response = Mock()
    response.choices = [Mock(message=Mock(content=content))]
    client.chat.completions.create = AsyncMock(return_value=response)
    return client


class TestRateLimiter:
    def test_blocks_after_limit(self):
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        limiter.check("u")
        limiter.check("u")
        with pytest.raises(RateLimitExceeded):
            limiter.check("u")

    def test_users_are_independent(self):
        limiter = RateLimiter(max_requests=1, window_seconds=60)
        assert limiter.allow("a")
        assert limiter.allow("b")
        assert not limiter.allow("a")

    def test_window_expires(self, monkeypatch):
        import agent_utils
        now = [1000.0]
        monkeypatch.setattr(agent_utils.time, "monotonic", lambda: now[0])
        limiter = RateLimiter(max_requests=1, window_seconds=10)
        assert limiter.allow("u")
        assert not limiter.allow("u")
        now[0] += 11
        assert limiter.allow("u")

    def test_reset(self):
        limiter = RateLimiter(max_requests=1, window_seconds=60)
        limiter.check("u")
        limiter.reset("u")
        assert limiter.allow("u")


class TestAgentCaching:
    @pytest.mark.asyncio
    async def test_identical_request_cached(self):
        client = make_client()
        agent = ComplianceAgent(client)
        first = await agent.check_cbahi_compliance("doc")
        second = await agent.check_cbahi_compliance("doc")
        assert client.chat.completions.create.await_count == 1
        assert second["cached"] is True
        assert "cached" not in first

    @pytest.mark.asyncio
    async def test_different_request_not_cached(self):
        client = make_client()
        agent = ComplianceAgent(client)
        await agent.check_cbahi_compliance("doc one")
        await agent.check_cbahi_compliance("doc two")
        assert client.chat.completions.create.await_count == 2

    @pytest.mark.asyncio
    async def test_cache_expires(self, monkeypatch):
        import agents.base_agent as base
        now = [1000.0]
        monkeypatch.setattr(base.time, "monotonic", lambda: now[0])
        client = make_client()
        agent = ComplianceAgent(client)
        await agent.check_cbahi_compliance("doc")
        now[0] += agent.config.cache_ttl_seconds + 1
        await agent.check_cbahi_compliance("doc")
        assert client.chat.completions.create.await_count == 2

    @pytest.mark.asyncio
    async def test_errors_not_cached(self):
        client = Mock()
        ok = Mock(choices=[Mock(message=Mock(content='{"findings": []}'))])
        client.chat.completions.create = AsyncMock(side_effect=[RuntimeError("x"), ok])
        agent = ComplianceAgent(client)
        assert "error" in await agent.process_request("m")
        assert "error" not in await agent.process_request("m")

    @pytest.mark.asyncio
    async def test_cache_disabled_with_zero_ttl(self, monkeypatch):
        monkeypatch.setenv("AGENT_CACHE_TTL", "0")
        client = make_client()
        agent = ComplianceAgent(client)
        await agent.process_request("m")
        await agent.process_request("m")
        assert client.chat.completions.create.await_count == 2


class TestAgentRateLimiting:
    @pytest.mark.asyncio
    async def test_per_user_limit(self, monkeypatch):
        monkeypatch.setenv("AGENT_RATE_LIMIT_REQUESTS", "2")
        client = make_client()
        agent = ComplianceAgent(client)
        await agent.process_request("a", user_id="u1")
        await agent.process_request("b", user_id="u1")
        blocked = await agent.process_request("c", user_id="u1")
        assert blocked["rate_limited"] is True
        other = await agent.process_request("c", user_id="u2")
        assert "error" not in other

    @pytest.mark.asyncio
    async def test_user_id_from_context(self, monkeypatch):
        monkeypatch.setenv("AGENT_RATE_LIMIT_REQUESTS", "1")
        agent = ComplianceAgent(make_client())
        await agent.process_request("a", {"user_id": "u1"})
        assert (await agent.process_request("b", {"user_id": "u1"}))["rate_limited"]

    @pytest.mark.asyncio
    async def test_cache_hits_do_not_consume_quota(self, monkeypatch):
        monkeypatch.setenv("AGENT_RATE_LIMIT_REQUESTS", "1")
        agent = ComplianceAgent(make_client())
        await agent.process_request("same", user_id="u")
        again = await agent.process_request("same", user_id="u")
        assert again["cached"] is True

    @pytest.mark.asyncio
    async def test_chat_rate_limited(self, monkeypatch):
        monkeypatch.setenv("AGENT_RATE_LIMIT_REQUESTS", "1")
        agent = ComplianceAgent(make_client("hi"))
        [c async for c in agent.chat("one", stream=False, user_id="u")]
        out = [c async for c in agent.chat("two", stream=False, user_id="u")]
        assert "Rate limit" in out[0]


class TestAgentLogger:
    def test_no_non_ascii(self, caplog):
        with caplog.at_level(logging.INFO):
            AgentLogger("risk").info("started \U0001F916", key="v\u00d7")
        assert all(ord(c) < 128 for c in caplog.text)
        assert "[RISK] started" in caplog.text
