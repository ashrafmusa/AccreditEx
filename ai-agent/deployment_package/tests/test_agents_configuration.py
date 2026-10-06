"""Environment variable configuration tests."""
from unittest.mock import Mock

import pytest

from agent_utils import AgentConfig
from agents import ComplianceAgent, RiskAssessmentAgent, TrainingCoordinator

ENV_VARS = [
    "GROQ_MODEL", "GROQ_FALLBACK_MODEL", "AGENT_TEMPERATURE", "AGENT_MAX_TOKENS",
    "AGENT_CACHE_TTL", "AGENT_RATE_LIMIT_REQUESTS", "AGENT_RATE_LIMIT_WINDOW",
    "COMPLIANCE_TEMPERATURE", "RISK_TEMPERATURE", "TRAINING_TEMPERATURE",
]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in ENV_VARS:
        monkeypatch.delenv(name, raising=False)


def test_defaults_use_valid_groq_models():
    cfg = AgentConfig.from_env()
    assert cfg.model == "llama-3.3-70b-versatile"
    assert cfg.fallback_model == "llama-3.1-8b-instant"
    assert cfg.cache_ttl_seconds == 600
    assert "qwen" not in cfg.model


def test_model_env_override(monkeypatch):
    monkeypatch.setenv("GROQ_MODEL", "custom-model")
    monkeypatch.setenv("GROQ_FALLBACK_MODEL", "custom-fallback")
    agent = ComplianceAgent(Mock())
    assert agent.model == "custom-model"
    assert agent.fallback_model == "custom-fallback"


def test_per_agent_default_temperatures():
    assert ComplianceAgent(Mock()).temperature == 0.2
    assert RiskAssessmentAgent(Mock()).temperature == 0.2
    assert TrainingCoordinator(Mock()).temperature == 0.4


def test_per_agent_temperature_env(monkeypatch):
    monkeypatch.setenv("TRAINING_TEMPERATURE", "0.9")
    monkeypatch.setenv("AGENT_TEMPERATURE", "0.5")
    assert TrainingCoordinator(Mock()).temperature == 0.9
    assert ComplianceAgent(Mock()).temperature == 0.5


def test_invalid_values_fall_back(monkeypatch):
    monkeypatch.setenv("AGENT_TEMPERATURE", "abc")
    monkeypatch.setenv("AGENT_MAX_TOKENS", "xyz")
    cfg = AgentConfig.from_env()
    assert cfg.temperature == 0.7
    assert cfg.max_tokens == 1536


def test_temperature_clamped(monkeypatch):
    monkeypatch.setenv("AGENT_TEMPERATURE", "99")
    assert AgentConfig.from_env().temperature == 2.0


def test_cache_and_rate_limit_env(monkeypatch):
    monkeypatch.setenv("AGENT_CACHE_TTL", "30")
    monkeypatch.setenv("AGENT_RATE_LIMIT_REQUESTS", "5")
    monkeypatch.setenv("AGENT_RATE_LIMIT_WINDOW", "20")
    agent = ComplianceAgent(Mock())
    assert agent.config.cache_ttl_seconds == 30
    assert agent.rate_limiter.max_requests == 5
    assert agent.rate_limiter.window_seconds == 20


def test_markdown_skill_import_resolves():
    from skills import get_markdown_formatting_skill
    assert get_markdown_formatting_skill()
