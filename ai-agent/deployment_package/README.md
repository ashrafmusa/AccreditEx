# AccreditEx AI Agent Deployment (Groq Edition)

> **✅ DEPLOYED** — Live at https://accreditex.onrender.com (Feb 19, 2026). Integrated with frontend at https://accreditex.web.app.

## Overview
This package contains the deployment files for the AccreditEx AI Agent on Render.com.
It is configured to use **Groq** for high-performance, free AI inference using the Llama 3 model.

## Files
- `main.py`: FastAPI application server
- `unified_accreditex_agent.py`: Context-aware AI agent logic (Groq/Llama 3)
- `requirements.txt`: Python dependencies
- `render.yaml`: Render.com configuration
- `Procfile`: Process configuration
- `runtime.txt`: Python version specification

## Deployment Instructions
1. Connect this repository to Render.com
2. Set Root Directory to: `ai-agent/deployment_package`
3. **Environment Variables**:
   - `GROQ_API_KEY`: Your free API key from [console.groq.com](https://console.groq.com)
   - `OPENAI_API_KEY`: (Optional) Fallback if you want to use OpenAI instead.

## Why Groq?
- **Free Tier**: Generous free usage for Llama 3 models.
- **Speed**: Extremely fast inference.
- **Quality**: Llama 3 70B is comparable to GPT-4 for many tasks.

## Response Language
The latest user message determines the reply language, including section headings.
English questions receive English answers and Arabic questions receive Arabic answers,
unless the user explicitly requests another output language. Workspace content,
interface language, and earlier conversation turns must not override this choice.
The shared completion client and specialist agents apply this rule on each request.

Run the language regression tests from this directory:
`python -B -m unittest discover -s tests -p test_response_language.py -v`

Document/editor chat requests without workspace context receive up to 6,144
output tokens rather than the 1,024-token conversational limit. Both paths reserve
space for the complete input using a conservative UTF-8 estimate, keeping the
estimated input plus output below 7,500 tokens for the observed 8,000-token
provider limit. Oversized inputs are rejected rather than silently shortened.
This does not eliminate rate limits from concurrent requests or guarantee exact
tokenizer counts. Explicit JSON,
HTML, and text requests override the default Markdown response structure.
Token-limit termination is marked as incomplete and is not cached as a successful
answer; the frontend rejects this marker instead of presenting a complete draft.
Provider failures emit a separate failure marker, not a successful document or
analysis. The frontend also rejects legacy plain-text `Error:` responses.

Document Control analysis sends numbered source passages and requires findings
to cite an integer `evidenceId`. The frontend resolves each id to the original
document passage; model-generated quotations are not used. Invalid ids reject
the analysis. Exact source membership establishes citation provenance only,
not the correctness of a finding or clinical/accreditation compliance.
Specialist chat preserves the full input so trailing output-schema instructions
are not silently removed by the generic 10,000-character sanitizer limit.
The shared token budget still rejects requests that cannot fit.
