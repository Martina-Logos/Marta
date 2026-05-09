import {
  RAPPORT_HIGH,
  RAPPORT_TRANSITIONS,
  RAPPORT_EMOTIONAL,
  DRIFT_SIGNALS,
  PROFANE_WORDS,
} from '../constants/rapportSignals'

/**
 * Returns a rapport score 0.0–1.0 for a transcript segment.
 * Higher = more conversational/emotional value worth keeping.
 */
export function rapportScore(text: string): number {
  const lower = text.toLowerCase()

  // Explicit transition back to topic = very high value
  if (RAPPORT_TRANSITIONS.some(p => lower.includes(p))) return 0.88

  // High rapport signals = strong personal story
  if (RAPPORT_HIGH.some(p => lower.includes(p))) return 0.70

  // Emotional keywords = moderate rapport
  if (RAPPORT_EMOTIONAL.some(p => lower.includes(p))) return 0.55

  // Drift signals = this is probably promotional or tangential
  if (DRIFT_SIGNALS.some(p => lower.includes(p))) return 0.10

  // Default neutral
  return 0.30
}

/**
 * Detects profane words present in the text.
 * Returns an array of matched words (lowercase).
 */
export function detectProfanity(text: string): string[] {
  const lower = text.toLowerCase()
  return PROFANE_WORDS.filter(w => {
    // Word boundary match to avoid partial matches (e.g. "class" ≠ "ass")
    const re = new RegExp(`\\b${w}\\b`, 'i')
    return re.test(lower)
  })
}

/**
 * Duration penalty: shorter segments get less penalty.
 * At 0 s → 0.0 (no penalty)
 * At 120 s → 1.0 (full penalty)
 */
export function durationPenalty(durationSeconds: number): number {
  return Math.min(1, durationSeconds / 120)
}

/**
 * Full multi-signal drift score.
 * Returns 0.0–1.0. Higher = more likely to keep.
 */
export function calculateDriftScore(
  topicSimilarity: number,
  text:            string,
  durationSeconds: number,
): number {
  const rapport = rapportScore(text)
  const durPen  = durationPenalty(durationSeconds)
  return (
    0.4 * topicSimilarity +
    0.3 * rapport +
    0.3 * (1 - durPen)
  )
}