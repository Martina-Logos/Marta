/**
 * Drift scoring thresholds.
 * Score = 0.4×topicSim + 0.3×rapport + 0.3×(1 - durationPenalty)
 */

export const DRIFT_THRESHOLDS = {
  KEEP:   0.70,   // >= 0.70 → on-topic, auto-kept
  REVIEW: 0.40,   // 0.40–0.69 → surface for user review
  DRIFT:  0.00,   // < 0.40 → drift, default removed
} as const

/** Scoring weights — must sum to 1.0 */
export const SCORE_WEIGHTS = {
  topicSimilarity: 0.40,
  rapportValue:    0.30,
  durationPenalty: 0.30,
} as const

/** Duration (seconds) at which duration penalty reaches maximum */
export const DURATION_PENALTY_MAX_SECONDS = 120

/**
 * Classify a drift score into a segment status.
 */
export function classifyScore(score: number): 'ontopic' | 'drift' {
  return score >= DRIFT_THRESHOLDS.KEEP ? 'ontopic' : 'drift'
}