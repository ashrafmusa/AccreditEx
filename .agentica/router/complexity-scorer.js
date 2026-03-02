/**
 * Agenticana v2 — Complexity Scorer
 * 
 * Scores a task description from 1-10 to determine model tier:
 *   1-2 → lite (trivial tasks)
 *   3-4 → flash (simple / single-domain)
 *   5-7 → pro (moderate / multi-domain)
 *   8-10 → pro-extended (complex / architectural)
 */

const config = require('./config.json');

/**
 * Analyzes the task description and returns a complexity score 1-10
 * @param {string} task - The user's task description
 * @param {object} options - Optional context hints
 * @returns {{ score: number, breakdown: object, model_tier: string }}
 */
function scoreComplexity(task, options = {}) {
  const taskLower = task.toLowerCase();
  const breakdown = {};

  // ── 1. Keyword Score ───────────────────────────────────────────────────────
  const highKeywords = config.keywords.high_complexity;
  const medKeywords  = config.keywords.medium_complexity;
  const lowKeywords  = config.keywords.low_complexity;

  const highMatches = highKeywords.filter(k => taskLower.includes(k)).length;
  const medMatches  = medKeywords.filter(k => taskLower.includes(k)).length;
  const lowMatches  = lowKeywords.filter(k => taskLower.includes(k)).length;

  let keywordScore = 0;
  if (highMatches > 0) keywordScore = Math.min(10, 6 + highMatches * 1.5);
  else if (medMatches > 0) keywordScore = Math.min(7, 3 + medMatches * 1.0);
  else if (lowMatches > 0) keywordScore = Math.max(1, 3 - lowMatches * 0.5);
  else keywordScore = 4; // unknown → assume moderate

  breakdown.keyword_score = Number(keywordScore.toFixed(1));

  // ── 2. Domain Count ────────────────────────────────────────────────────────
  const domains = {
    frontend:  /(react|next\.?js|component|ui|css|tailwind|page|layout|style)/i,
    backend:   /(api|server|express|node|fastapi|route|endpoint|middleware)/i,
    mobile:    /(mobile|react native|expo|flutter|ios|android|screen|gesture)/i,
    database:  /(database|schema|prisma|sql|migration|query|orm|drizzle)/i,
    security:  /(auth|jwt|security|password|permission|role|oauth|cors)/i,
    devops:    /(deploy|ci\/cd|docker|kubernetes|nginx|pipeline|github.actions)/i,
    testing:   /(test|spec|jest|vitest|playwright|cypress|coverage|mock)/i,
    game:      /(game|phaser|unity|godot|scene|sprite|collision)/i,
  };

  const detectedDomains = Object.entries(domains)
    .filter(([, pattern]) => pattern.test(taskLower))
    .map(([domain]) => domain);

  breakdown.detected_domains = detectedDomains;
  breakdown.domain_count = detectedDomains.length;

  // ── 3. Task Length Signal ──────────────────────────────────────────────────
  // Long tasks = more context needed = higher complexity
  const wordCount = task.split(/\s+/).length;
  const lengthScore = wordCount > 30 ? 3 : wordCount > 15 ? 2 : 1;
  breakdown.length_score = lengthScore;

  // ── 4. Ambiguity Signal ────────────────────────────────────────────────────
  const vagueTerms = ['something', 'whatever', 'make it better', 'improve it', 'can you', 'maybe', 'i think'];
  const ambiguityHits = vagueTerms.filter(t => taskLower.includes(t)).length;
  breakdown.ambiguity_hits = ambiguityHits;

  // ── 5. History Penalty (optional) ─────────────────────────────────────────
  // If ReasoningBank found a similar past task, reduce complexity (less thinking needed)
  const historyBonus = options.reasoning_bank_similarity > 0.85 ? -2 : 0;
  breakdown.history_bonus = historyBonus;

  // ── 6. Composite Score ──────────────────────────────────────────────────────
  const weights = config.complexity_weights;
  
  let raw = (
    (keywordScore        * weights.keyword_score) +
    (detectedDomains.length * weights.domain_count) +
    (lengthScore         * weights.file_impact) +
    (ambiguityHits       * weights.ambiguity) +
    historyBonus
  ) / (weights.keyword_score + weights.domain_count + weights.file_impact + weights.ambiguity);

  // Clamp to 1-10
  const score = Math.min(10, Math.max(1, Math.round(raw * 10) / 10));
  breakdown.raw_weighted = Number(raw.toFixed(2));

  // ── 7. Model Tier Selection ────────────────────────────────────────────────
  let model_tier;
  if (score <= 2)      model_tier = 'lite';
  else if (score <= 4) model_tier = 'flash';
  else if (score <= 7) model_tier = 'pro';
  else                  model_tier = 'pro-extended';

  return { score, model_tier, breakdown };
}

module.exports = { scoreComplexity };
