/**
 * Agenticana v2 — Model Router
 *
 * Main routing engine. Combines complexity score + token estimation
 * to produce a routing decision: { model, strategy, skills, estimatedTokens }
 *
 * Usage:
 *   const router = require('./router');
 *   const decision = router.route({ task, agentName, skills, AgenticanaRoot });
 *   console.log(decision);
 *   // { model: 'gemini-2.0-flash', tier: 'flash', strategy: 'COMPRESSED', estimatedTokens: 12400 }
 */

const { scoreComplexity }                                             = require('./complexity-scorer');
const { estimateInvocation, filterSkillsByStrategy }                  = require('./token-estimator');
const config                                                           = require('./config.json');

/**
 * Route a task to the optimal model and context strategy
 *
 * @param {object} params
 * @param {string}   params.task           - User task description
 * @param {string}   params.agentName      - Agent to invoke (e.g. 'frontend-specialist')
 * @param {string[]} [params.skills]       - Skills the agent wants to load
 * @param {number}   [params.rb_similarity] - ReasoningBank similarity (0-1), reduces complexity if high
 * @param {string}   [params.AgenticanaRoot]  - Agenticana root path
 * @returns {RouterDecision}
 */
function route({ task, agentName, skills = [], rb_similarity = 0, AgenticanaRoot = process.cwd() }) {
  // ── Step 1: Score complexity ──────────────────────────────────────────────
  const { score, model_tier, breakdown: complexityBreakdown } = scoreComplexity(task, {
    reasoning_bank_similarity: rb_similarity,
  });

  // ── Step 2: Estimate tokens with full skill list ──────────────────────────
  const fullEstimate = estimateInvocation({
    task,
    agentName,
    skills,
    model_tier,
    AgenticanaRoot,
  });

  // ── Step 3: Upgrade tier if token estimate exceeds budget ─────────────────
  let finalTier = model_tier;
  if (fullEstimate.over_budget) {
    // If over budget: either compress context OR upgrade tier
    // Strategy: compress first, upgrade tier only if score warrants it
    if (score >= 6) {
      finalTier = upgradeTier(model_tier);
    }
    // else: keep tier but compress context (strategy already set to MINIMAL/COMPRESSED)
  }

  // ── Step 4: Filter skills to strategy ────────────────────────────────────
  const filteredSkills = filterSkillsByStrategy(skills, fullEstimate.strategy, AgenticanaRoot);

  // ── Step 5: Re-estimate with filtered skills ──────────────────────────────
  const finalEstimate = estimateInvocation({
    task,
    agentName,
    skills: filteredSkills,
    model_tier: finalTier,
    AgenticanaRoot,
  });

  // ── Step 6: Compose decision ──────────────────────────────────────────────
  const modelName = config.models[finalTier];

  // 🦞 Step 6.1: Handshake Suggestion (Efficiency Upgrade)
  const suggestsHandshake = score >= 5 || finalEstimate.estimated_tokens > 20000;
  const handshake = suggestsHandshake ? {
    recommended: true,
    steps: [
      "1. Phase 1: SCOUT (flash-lite) - Perform file discovery & search",
      "2. Phase 2: TRIM (local) - Use context_trimmer.py to shrink file context",
      "3. Phase 3: BUILD (pro) - Implementation with high accuracy/low cost"
    ]
  } : null;

  /** @type {RouterDecision} */
  const decision = {
    model: modelName,
    tier: finalTier,
    strategy: finalEstimate.strategy,
    skills: filteredSkills,
    skills_dropped: skills.filter(s => !filteredSkills.includes(s)),
    estimated_tokens: finalEstimate.estimated_tokens,
    token_budget: finalEstimate.budget,
    complexity_score: score,
    complexity_breakdown: complexityBreakdown,
    reasoning_bank_similarity: rb_similarity,
    handshake_suggestion: handshake,
    token_savings_estimate: skills.length > filteredSkills.length
      ? `~${Math.round((1 - filteredSkills.length / skills.length) * 100)}% from skill filtering`
      : 'none',
    timestamp: new Date().toISOString(),
  };

  return decision;
}

/**
 * Upgrade a model tier by one level
 * @param {string} tier
 * @returns {string}
 */
function upgradeTier(tier) {
  const tiers = ['lite', 'flash', 'pro', 'pro-extended'];
  const idx = tiers.indexOf(tier);
  return tiers[Math.min(idx + 1, tiers.length - 1)];
}

/**
 * Get cumulative token usage stats (in-memory, resets on restart)
 * @returns {object}
 */
const _stats = { total_calls: 0, total_tokens_estimated: 0, tokens_saved: 0, by_tier: {} };

function recordStats(decision) {
  _stats.total_calls++;
  _stats.total_tokens_estimated += decision.estimated_tokens;
  _stats.by_tier[decision.tier] = (_stats.by_tier[decision.tier] || 0) + 1;
}

function getStats() {
  return { ..._stats, session_start: new Date().toISOString() };
}

module.exports = { route, getStats, recordStats };

/**
 * @typedef {object} RouterDecision
 * @property {string}   model                    - Full model name (e.g. 'gemini-2.0-flash')
 * @property {string}   tier                     - Model tier key ('flash', 'pro', etc.)
 * @property {string}   strategy                 - Context strategy ('FULL', 'COMPRESSED', 'MINIMAL')
 * @property {string[]} skills                   - Skills to actually load
 * @property {string[]} skills_dropped           - Skills filtered out to save tokens
 * @property {number}   estimated_tokens         - Pre-flight token estimate
 * @property {number}   token_budget             - Budget for selected model
 * @property {number}   complexity_score         - Complexity score 1-10
 * @property {object}   complexity_breakdown     - Detailed scoring breakdown
 * @property {number}   reasoning_bank_similarity - Best match from ReasoningBank (0-1)
 * @property {string}   token_savings_estimate   - Human-readable savings note
 * @property {string}   timestamp                - ISO timestamp
 */
