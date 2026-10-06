"""Schema validation and error handling tests for specialist agents."""
import json
from unittest.mock import AsyncMock, Mock

import pytest

from agent_utils import ResponseValidator
from agents import ComplianceAgent, RiskAssessmentAgent, TrainingCoordinator


def make_client(content: str) -> Mock:
    client = Mock()
    response = Mock()
    response.choices = [Mock(message=Mock(content=content))]
    client.chat.completions.create = AsyncMock(return_value=response)
    return client


class TestResponseValidator:
    def test_valid(self):
        ok, errors = ResponseValidator.validate({"a": [1]}, {"a": list})
        assert ok and errors == []

    def test_missing_key(self):
        ok, errors = ResponseValidator.validate({}, {"a": list})
        assert not ok and "missing key 'a'" in errors[0]

    def test_wrong_type(self):
        ok, _ = ResponseValidator.validate({"a": "x"}, {"a": list})
        assert not ok

    def test_bool_rejected_for_int(self):
        ok, _ = ResponseValidator.validate({"a": True}, {"a": int})
        assert not ok

    def test_not_a_dict(self):
        ok, _ = ResponseValidator.validate([1], {"a": int})
        assert not ok

    def test_list_item_keys(self):
        ok, errors = ResponseValidator.validate(
            {"f": [{"x": 1}, "bad"]}, {"f": list}, {"f": ["x", "y"]}
        )
        assert not ok and len(errors) == 2


class TestComplianceReliability:
    @pytest.mark.asyncio
    async def test_valid_response_parsed(self):
        payload = {"findings": [{"description": "d", "status": "compliant", "risk_level": "Low"}]}
        result = await ComplianceAgent(make_client(json.dumps(payload))).check_cbahi_compliance("doc")
        assert result["structured_data"] == payload

    @pytest.mark.asyncio
    async def test_missing_findings_key(self):
        result = await ComplianceAgent(make_client('{"summary_text": "x"}')).check_cbahi_compliance("doc")
        assert result["structured_data"] is None
        assert result["validation_errors"]

    @pytest.mark.asyncio
    async def test_finding_missing_keys(self):
        result = await ComplianceAgent(make_client('{"findings": [{"description": "d"}]}')).check_jci_compliance("doc")
        assert result["structured_data"] is None

    @pytest.mark.asyncio
    async def test_invalid_json(self):
        result = await ComplianceAgent(make_client("not json")).check_cbahi_compliance("doc")
        assert result["structured_data"] is None

    @pytest.mark.asyncio
    async def test_api_error_returned_not_raised(self):
        client = Mock()
        client.chat.completions.create = AsyncMock(side_effect=RuntimeError("boom"))
        result = await ComplianceAgent(client).check_cbahi_compliance("doc")
        assert "boom" in result["error"]
        assert result["structured_data"] is None

    @pytest.mark.asyncio
    async def test_fallback_on_429(self):
        ok = Mock(choices=[Mock(message=Mock(content='{"findings": []}'))])
        client = Mock()
        client.chat.completions.create = AsyncMock(side_effect=[RuntimeError("429 rate limit"), ok])
        agent = ComplianceAgent(client)
        result = await agent.check_cbahi_compliance("doc")
        assert result["model"] == agent.fallback_model


class TestRiskReliability:
    @pytest.mark.asyncio
    async def test_scores_calculated(self):
        client = make_client('{"likelihood_rating": 4, "impact_rating": 5}')
        result = await RiskAssessmentAgent(client).analyze_risk("risk")
        assert result["structured_data"]["calculated_score"] == 20
        assert result["structured_data"]["calculated_level"] == "Critical"

    @pytest.mark.asyncio
    async def test_out_of_range_ratings_rejected(self):
        client = make_client('{"likelihood_rating": 9, "impact_rating": 5}')
        result = await RiskAssessmentAgent(client).analyze_risk("risk")
        assert result["structured_data"] is None

    @pytest.mark.asyncio
    async def test_missing_ratings_rejected(self):
        result = await RiskAssessmentAgent(make_client("{}")).analyze_risk("risk")
        assert result["structured_data"] is None

    @pytest.mark.asyncio
    async def test_incident_schema(self):
        client = make_client('{"ishikawa_analysis": {}, "primary_root_cause": "x"}')
        result = await RiskAssessmentAgent(client).analyze_incident({"description": "d"})
        assert result["structured_data"] is not None


class TestTrainingReliability:
    @pytest.mark.asyncio
    async def test_gap_analysis_valid(self):
        client = make_client('{"gap_summary": "s", "prioritized_gaps": [{"skill": "a", "priority": "Critical"}]}')
        result = await TrainingCoordinator(client).analyze_competency_gap([], ["a"], "Tech")
        assert result["structured_data"]["gap_summary"] == "s"
        assert result["gaps_identified"] == 1

    @pytest.mark.asyncio
    async def test_gap_analysis_invalid(self):
        result = await TrainingCoordinator(make_client('{"gap_summary": 1}')).analyze_competency_gap([], [], "Tech")
        assert result["structured_data"] is None

    @pytest.mark.asyncio
    async def test_training_plan_bad_budget_and_staff(self):
        client = make_client('{"training_modules": [], "implementation_phases": {}}')
        result = await TrainingCoordinator(client).generate_training_plan(
            [{"skill": "QC"}], staff_count="many", budget="lots"
        )
        assert result["structured_data"] is not None

    def test_format_skills_list(self):
        agent = TrainingCoordinator(Mock())
        assert agent._format_skills_list(None) == "None"
        assert agent._format_skills_list(["a", "b"]) == "a, b"
