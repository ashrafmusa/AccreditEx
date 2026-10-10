"""Exercise the actual model resolver and completion transports without provider calls."""
import types
import typing
import unittest
from unittest.mock import AsyncMock, Mock

from tests.test_ai_grounding import production_functions
from skills.response_standard import (
    STANDARD_RESPONSE_RULES, FAILED_RESPONSE_MARKER, TRUNCATED_RESPONSE_MARKER,
    apply_response_language, response_token_budget,
)
from agent_utils import build_workspace_snapshot


class ProviderError(RuntimeError):
    def __init__(self, status, message):
        super().__init__(message)
        self.status_code = status


def configured_agent(responses):
    namespace = production_functions("unified_accreditex_agent.py", {
        "_install_model_resolver", "_discover_model", "_create_completion", "_general_chat",
    }, {**vars(typing), "logger": Mock(), "apply_response_language": apply_response_language,
        "get_general_agent_prompt": lambda: "System", "build_workspace_snapshot": build_workspace_snapshot,
        "STANDARD_RESPONSE_RULES": STANDARD_RESPONSE_RULES}, "UnifiedAccreditexAgent")
    transport = AsyncMock(side_effect=responses)
    agent = types.SimpleNamespace(
        client=Mock(), model="openai/gpt-oss-120b", fallback_model="llama-3.1-8b-instant",
        temperature=0.7, max_tokens=4096, last_llm_error=None,
        _model_substitutions={"llama-3.1-8b-instant": "openai/gpt-oss-120b"},
        _MODEL_PREFERENCE=("openai/gpt-oss-120b", "llama-3.1-8b-instant"), _NON_CHAT_MARKERS=("whisper",),
    )
    agent.client.chat.completions.create = transport
    agent.client.models.list = AsyncMock(return_value=Mock(data=[
        Mock(id="openai/gpt-oss-120b"), Mock(id="llama-3.1-8b-instant")]))
    for name in ("_install_model_resolver", "_discover_model", "_create_completion", "_general_chat"):
        setattr(agent, name, types.MethodType(namespace[name], agent))
    agent._install_model_resolver()
    return agent, transport


class TestModelFallback(unittest.IsolatedAsyncioTestCase):
    async def test_primary_429_sends_distinct_explicit_fallback_despite_stale_alias(self):
        # Arrange
        agent, transport = configured_agent([ProviderError(429, "daily quota exhausted"), "success"])
        # Act
        result = await agent._create_completion([{"role": "user", "content": "Help"}])
        # Assert
        self.assertEqual(result, "success")
        self.assertEqual([call.kwargs["model"] for call in transport.call_args_list],
                         ["openai/gpt-oss-120b", "llama-3.1-8b-instant"])
        self.assertIsNone(agent.last_llm_error)
        agent.client.models.list.assert_not_called()

    async def test_unsupported_legacy_alias_still_resolves_to_supported_primary(self):
        # Arrange
        agent, transport = configured_agent([ProviderError(404, "model_not_found"), "success"])
        # Act
        result = await agent.client.chat.completions.create(
            model="unsupported-legacy-alias", messages=[{"role": "user", "content": "Help"}])
        # Assert
        self.assertEqual(result, "success")
        self.assertEqual(transport.call_args_list[-1].kwargs["model"], "openai/gpt-oss-120b")
        self.assertEqual(agent._model_substitutions["unsupported-legacy-alias"], "openai/gpt-oss-120b")

    async def test_missing_or_exhausted_fallback_never_retries_exhausted_primary(self):
        for status in (404, 429):
            with self.subTest(status=status):
                # Arrange
                agent, transport = configured_agent([
                    ProviderError(429, "rate_limit"), ProviderError(status, "model_not_found" if status == 404 else "quota")])
                # Act / Assert
                with self.assertRaisesRegex(RuntimeError, "All configured AI models"):
                    await agent._create_completion([{"role": "user", "content": "Help"}])
                self.assertEqual(transport.await_count, 2)
                self.assertEqual(transport.call_args_list[-1].kwargs["model"], "llama-3.1-8b-instant")
                self.assertIn("All configured models exhausted", agent.last_llm_error)
                agent.client.models.list.assert_not_called()

    async def test_general_chat_uses_same_fallback_transport(self):
        # Arrange
        response = Mock(choices=[Mock(message=Mock(content="General response"))])
        agent, transport = configured_agent([ProviderError(429, "quota"), response])
        # Act
        output = "".join([chunk async for chunk in agent._general_chat("Help", stream=False)])
        # Assert
        self.assertEqual(output, "General response")
        self.assertEqual(transport.call_args_list[-1].kwargs["model"], agent.fallback_model)

    async def test_actual_specialist_transport_preserves_explicit_fallback_and_failure_marker(self):
        # Arrange: real specialist chat uses the shared installed resolver.
        namespace = production_functions("agents\\base_agent.py", {"chat"}, {
            **vars(typing), "STANDARD_RESPONSE_RULES": STANDARD_RESPONSE_RULES,
            "apply_response_language": apply_response_language, "response_token_budget": response_token_budget,
            "RateLimitExceeded": type("RateLimitExceeded", (Exception,), {}),
            "FAILED_RESPONSE_MARKER": FAILED_RESPONSE_MARKER, "TRUNCATED_RESPONSE_MARKER": TRUNCATED_RESPONSE_MARKER,
        }, "BaseSpecialistAgent")
        async def chunks():
            yield Mock(choices=[Mock(finish_reason="stop", delta=Mock(content="Specialist response"))])
        for fail in (False, True):
            with self.subTest(fail=fail):
                agent, transport = configured_agent([
                    ProviderError(429, "rate_limit"), ProviderError(429, "rate_limit") if fail else chunks()])
                agent.rate_limiter = Mock()
                agent._resolve_user_id = Mock(return_value="user")
                agent.validator = Mock()
                agent.validator.sanitize.side_effect = lambda message, **kwargs: message
                agent.get_full_prompt = Mock(return_value="System")
                agent.get_specialist_name = Mock(return_value="Compliance")
                agent.log = Mock()
                # Act
                output = "".join([chunk async for chunk in namespace["chat"](agent, "Check compliance")])
                # Assert
                self.assertEqual(output, FAILED_RESPONSE_MARKER if fail else "Specialist response")
                self.assertEqual([call.kwargs["model"] for call in transport.call_args_list],
                                 ["openai/gpt-oss-120b", "llama-3.1-8b-instant"])


if __name__ == "__main__":
    unittest.main()
