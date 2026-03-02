# Skill: Exchange Manager (P4 📦)

> **Role**: Package Management & Self-Update Efficiency
> **Path**: `skills/exchange-manager/`

## 🎯 Purpose
Allows agents (specifically `orchestrator` and `devops-engineer`) to interact with the **Agentica Exchange** to keep the workspace updated with the latest specialist agents, code patterns, and security definitions.

## 🛠️ Tooling
- **Registry**: `.Agentica/registry.json`
- **CLI**: `python scripts/exchange.py`

## 📝 Protocols

### 1. Dependency Resolution
Before suggesting a complex task (e.g., Performance Profiling), check if the required skill exists.
- If missing: Propose to user: "I see we are missing the `performance-profiling` skill. Shall I install it via the Exchange?"
- Action: `python scripts/exchange.py install <slug>`

### 2. Self-Correction / Updates
If an agent detects its own rules (in `.md` file) are outdated compared to the remote version:
- Action: `python scripts/exchange.py info <slug>`
- Action: `python scripts/exchange.py sync`

### 3. Safety First
- **Always Sync** before searching for a new component.
- **Never Force** an installation without explicit user permission if local changes are detected.

---

## 🦞 The Lobster Standard
- **Efficiency**: Only download what is needed.
- **Security**: Verify component origins.
- **Accuracy**: Ensure version compatibility before installation.
