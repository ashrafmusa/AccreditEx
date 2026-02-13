"""
Specialist routing tests for UnifiedAccreditexAgent
"""
import pytest
from unittest.mock import patch
from unified_accreditex_agent import UnifiedAccreditexAgent


@pytest.mark.unit
class TestSpecialistRouting:
    """Validate specialist routing behavior and telemetry."""

    def test_detect_task_type_prefers_keyword_scores(self, mock_env_vars):
        with patch('unified_accreditex_agent.AsyncOpenAI'), \
             patch('unified_accreditex_agent.firebase_admin'):
            agent = UnifiedAccreditexAgent()

            assert agent.detect_task_type("Perform CBAHI compliance gap analysis") == "compliance"
            assert agent.detect_task_type("Create risk matrix and mitigation plan") == "risk"
            assert agent.detect_task_type("Build staff training competency plan") == "training"
            assert agent.detect_task_type("Hello there") == "general"

    def test_routing_metrics_api_shape(self, mock_env_vars):
        with patch('unified_accreditex_agent.AsyncOpenAI'), \
             patch('unified_accreditex_agent.firebase_admin'):
            agent = UnifiedAccreditexAgent()

            # Simulate successful specialist route and failed legacy route
            agent._record_routing_metric("risk", "specialist", 150.0, success=True)
            agent._record_routing_metric("general", "legacy", 0.0, success=False)

            metrics = agent.get_routing_metrics()

            assert "strict_specialist_routing" in metrics
            assert metrics["total_requests"] == 2
            assert metrics["by_task_type"]["risk"] == 1
            assert metrics["by_route_mode"]["specialist"] == 1
            assert metrics["failures"] == 1
            assert metrics["avg_latency_ms"]["risk"] == 150.0
