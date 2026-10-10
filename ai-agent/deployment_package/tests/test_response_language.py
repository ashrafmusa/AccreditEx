"""Regression tests for per-turn AI response language selection."""
import unittest

from skills.response_standard import STANDARD_RESPONSE_RULES, apply_response_language, response_token_budget


class TestResponseLanguage(unittest.TestCase):
    def test_document_requests_receive_larger_token_budget(self):
        self.assertEqual(response_token_budget(False), 8192)
        self.assertEqual(response_token_budget(True), 1024)

    def test_explicit_structured_output_overrides_markdown(self):
        self.assertIn("return only that format", STANDARD_RESPONSE_RULES)
        self.assertIn("Do not add a summary", STANDARD_RESPONSE_RULES)
    def test_english_question_overrides_arabic_history_and_workspace(self):
        # Arrange
        messages = [
            {"role": "system", "content": "Workspace name: \u0627\u0644\u0645\u062e\u062a\u0628\u0631"},
            {"role": "user", "content": "\u0645\u0627 \u0647\u064a \u0627\u0644\u0645\u062e\u0627\u0637\u0631\u061f"},
            {"role": "assistant", "content": "\u064a\u0648\u062c\u062f \u062e\u0637\u0631"},
            {"role": "user", "content": "What are the laboratory risks?"},
        ]
        # Act
        result = apply_response_language(messages)
        # Assert
        self.assertIn("English question requires an English answer", result[0]["content"])
        self.assertIn("not earlier messages", result[0]["content"])
        self.assertNotIn("RESPONSE LANGUAGE", messages[0]["content"])
        self.assertEqual(result[1:], messages[1:])

    def test_arabic_question_after_english_does_not_force_english(self):
        # Arrange
        messages = [
            {"role": "system", "content": "English workspace"},
            {"role": "user", "content": "What are the risks?"},
            {"role": "user", "content": "\u0645\u0627 \u0647\u064a \u0627\u0644\u0645\u062e\u0627\u0637\u0631\u061f"},
        ]
        # Act
        result = apply_response_language(messages)
        # Assert
        self.assertIn("Arabic question requires an Arabic answer", result[0]["content"])
        self.assertIn("language of the latest user message", result[0]["content"])

    def test_explicit_language_request_is_preserved(self):
        # Arrange
        messages = [{"role": "user", "content": "Explain the risks. Answer in Arabic."}]
        # Act
        result = apply_response_language(messages)
        # Assert
        self.assertIn("explicitly requests a different output language, follow that request", result[0]["content"])
        self.assertEqual(result[1], messages[0])

    def test_bilingual_message_is_not_forced_to_english(self):
        # Arrange
        messages = [{"role": "user", "content": "Explain CAPA \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629"}]
        # Act
        result = apply_response_language(messages)
        # Assert
        self.assertIn("Use the language of the latest user message", result[0]["content"])

    def test_guard_is_idempotent_for_shared_specialist_client(self):
        # Arrange
        messages = [
            {"role": "system", "content": "You are a risk specialist."},
            {"role": "user", "content": "Assess this risk."},
        ]
        # Act
        once = apply_response_language(messages)
        twice = apply_response_language(once)
        # Assert
        self.assertEqual(once, twice)

    def test_no_user_message_is_unchanged(self):
        # Arrange
        messages = [{"role": "system", "content": "Context only"}]
        # Act
        result = apply_response_language(messages)
        # Assert
        self.assertEqual(result, messages)


if __name__ == "__main__":
    unittest.main()
