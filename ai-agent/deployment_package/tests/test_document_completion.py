"""Exercise the chat completion path without network or provider dependencies."""
import ast
from datetime import datetime
from pathlib import Path
import time
import typing
import unittest
from unittest.mock import AsyncMock, Mock

from skills.response_standard import TRUNCATED_RESPONSE_MARKER, FAILED_RESPONSE_MARKER, apply_response_language, response_token_budget


class TestDocumentCompletion(unittest.IsolatedAsyncioTestCase):
    async def test_document_budget_and_truncation_are_used_by_chat(self):
        # Arrange: execute the actual method with mocked infrastructure.
        source = Path(__file__).resolve().parents[1] / "unified_accreditex_agent.py"
        tree = ast.parse(source.read_text(encoding="utf-8"))
        agent_class = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "UnifiedAccreditexAgent")
        method = next(node for node in agent_class.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "chat")
        namespace = {
            **vars(typing), "datetime": datetime, "time": time, "logger": Mock(),
            "response_token_budget": response_token_budget,
            "TRUNCATED_RESPONSE_MARKER": TRUNCATED_RESPONSE_MARKER,
            "FAILED_RESPONSE_MARKER": FAILED_RESPONSE_MARKER,
            "apply_response_language": apply_response_language,
        }
        exec(compile(ast.Module(body=[method], type_ignores=[]), str(source), "exec"), namespace)
        async def chunks():
            yield Mock(choices=[Mock(finish_reason=None, delta=Mock(content="<p>Partial"))])
            yield Mock(choices=[Mock(finish_reason="length", delta=Mock(content=None))])
        agent = Mock()
        agent.conversations = {}
        agent.strict_specialist_routing = False
        agent._cache_get.return_value = None
        agent._create_completion = AsyncMock(side_effect=lambda **kwargs: chunks())
        agent._get_base_system_prompt.return_value = "System"
        # Act
        response = "".join([chunk async for chunk in namespace["chat"](agent, "Generate a full SOP", context={})])
        # Assert
        self.assertIn(TRUNCATED_RESPONSE_MARKER, response)
        self.assertEqual(agent._create_completion.call_args.kwargs["max_tokens"], 6144)
        agent._cache_set.assert_not_called()
        self.assertNotIn("assistant", [m["role"] for history in agent.conversations.values() for m in history])

        # A real document input must reduce the reserved output, not exceed TPM.
        agent.conversations = {}
        agent._create_completion.reset_mock()
        document = "x" * 18000
        response = "".join([chunk async for chunk in namespace["chat"](agent, document, context={})])
        self.assertLess(agent._create_completion.call_args.kwargs["max_tokens"], 1500)

        # Provider errors must never become cached successful documents.
        agent.conversations = {}
        agent._create_completion.side_effect = RuntimeError("413 rate_limit_exceeded")
        response = "".join([chunk async for chunk in namespace["chat"](agent, "Analyze a document", context={})])
        self.assertEqual(response, FAILED_RESPONSE_MARKER)
        agent._cache_set.assert_not_called()
        self.assertNotIn("assistant", [m["role"] for history in agent.conversations.values() for m in history])


if __name__ == "__main__":
    unittest.main()
