/**
 * Agenticana v2 — Token Estimator
 * 
 * Pre-flight token estimation before any agent invocation.
 * Prevents context overflow and triggers compression when needed.
 * 
 * Estimation approach:
 *  - 1 token ≈ 4 characters (English text)
 *  - Adds overhead for prompt formatting + model instructions
 */

const fs   = require('fs');
const path = require('path');
const config = require('./config.json');

const CHARS_PER_TOKEN = 4;
const PROMPT_OVERHEAD = 800;   // Approximate system prompt + formatting overhead
const SKILL_OVERHEAD  = 200;   // Per-skill loading overhead

/**
 * Estimate token count of a text string
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate size of a skill file in tokens
 * @param {string} skillName - Name of the skill folder
 * @param {string} AgenticanaRoot - Root path of Agenticana directory
 * @returns {number}
 */
function estimateSkillTokens(skillName, AgenticanaRoot = process.cwd()) {
  const skillPath = path.join(AgenticanaRoot, 'skills', skillName, 'SKILL.md');
  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    return estimateTokens(content) + SKILL_OVERHEAD;
  } catch {
    return 500; // Default estimate if file not found
  }
}

/**
 * Estimate size of an agent context file in tokens
 * @param {string} agentName
 * @param {string} AgenticanaRoot
 * @returns {number}
 */
function estimateAgentTokens(agentName, AgenticanaRoot = process.cwd()) {
  const agentPath = path.join(AgenticanaRoot, 'agents', `${agentName}.md`);
  try {
    const content = fs.readFileSync(agentPath, 'utf-8');
    return estimateTokens(content);
  } catch {
    return 1000; // Default if not found
  }
}

/**
 * Full pre-flight token estimation for an agent invocation
 * @param {object} params
 * @param {string} params.task - User task description
 * @param {string} params.agentName - Primary agent to invoke
 * @param {string[]} params.skills - Skills to load
 * @param {string} params.model_tier - Target model tier
 * @param {string} [params.AgenticanaRoot] - Root path
 * @returns {{ estimated_tokens: number, budget: number, strategy: string, breakdown: object, over_budget: boolean }}
 */
function estimateInvocation({ task, agentName, skills = [], model_tier = 'pro', AgenticanaRoot = process.cwd() }) {
  const breakdown = {};

  // Task tokens
  breakdown.task = estimateTokens(task);

  // Agent context tokens
  breakdown.agent_context = estimateAgentTokens(agentName, AgenticanaRoot);

  // Skills tokens
  breakdown.skills = {};
  let skillTotal = 0;
  for (const skill of skills) {
    const t = estimateSkillTokens(skill, AgenticanaRoot);
    breakdown.skills[skill] = t;
    skillTotal += t;
  }
  breakdown.total_skills = skillTotal;

  // System overhead
  breakdown.overhead = PROMPT_OVERHEAD;

  // Total
  const estimated_tokens = breakdown.task + breakdown.agent_context + skillTotal + PROMPT_OVERHEAD;
  breakdown.total = estimated_tokens;

  // Budget from config
  const budget = config.thresholds[model_tier]?.max_tokens || 80000;
  const over_budget = estimated_tokens > budget;

  // Context strategy selection
  let strategy;
  const ratio = estimated_tokens / budget;
  if (ratio > 0.9)       strategy = 'MINIMAL';
  else if (ratio > 0.65) strategy = 'COMPRESSED';
  else                    strategy = 'FULL';

  return {
    estimated_tokens,
    budget,
    over_budget,
    ratio: Number(ratio.toFixed(2)),
    strategy,
    breakdown,
  };
}

/**
 * Get skills for a given context strategy and tier
 * @param {string[]} requestedSkills - All skills an agent might want
 * @param {string} strategy - FULL | COMPRESSED | MINIMAL
 * @param {string} AgenticanaRoot
 * @returns {string[]} - Filtered list of skills to actually load
 */
function filterSkillsByStrategy(requestedSkills, strategy, AgenticanaRoot = process.cwd()) {
  const strategyConfig = config.context_strategies[strategy];
  if (!strategyConfig) return requestedSkills;

  const maxSkills = strategyConfig.max_skills;
  const maxTier   = strategyConfig.load_tier;

  // Load skill tiers from SKILL.md frontmatter (simplified: use known tiers from config)
  const tier1Skills = new Set(['clean-code', 'brainstorming', 'plan-writing', 'intelligent-routing', 'behavioral-modes', 'parallel-agents']);
  const tier2Skills = new Set(['frontend-design', 'mobile-design', 'api-patterns', 'database-design', 'testing-patterns', 'nextjs-react-expert', 'nodejs-best-practices', 'architecture', 'game-development', 'systematic-debugging']);

  const filtered = requestedSkills.filter(skill => {
    if (tier1Skills.has(skill)) return maxTier >= 1;
    if (tier2Skills.has(skill)) return maxTier >= 2;
    return maxTier >= 3; // tier 3
  });

  return filtered.slice(0, maxSkills);
}

module.exports = { estimateTokens, estimateInvocation, filterSkillsByStrategy, estimateSkillTokens };
