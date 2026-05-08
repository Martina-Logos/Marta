/**
 * Multi-signal drift scoring
 * Score = 0.4 × topicSimilarity + 0.3 × rapportValue + 0.3 × (1 - durationPenalty)
 *
 * Thresholds:
 *   > 0.70  → keep (on-topic)
 *   0.40–0.70 → review
 *   < 0.40  → drift
 */

import type { Segment } from './supabase'

// ── Rapport signal keywords ────────────────────────────────

const RAPPORT_HIGH = [
  'struggle', 'lesson', 'when i was', 'real talk', 'honestly',
  'to be fair', 'let me be honest', 'personal story', 'i remember',
]

const TRANSITION_BACK = [
  'but here\'s the thing', 'anyway back to', 'which brings me to',
  'back to the point', 'so as i was saying', 'getting back on track',
]

// ── Profanity list (extend as needed) ─────────────────────

export const PROFANE_WORDS = [
  'damn', 'hell', 'crap', 'ass', 'shit', 'fuck', 'bitch',
  'bastard', 'idiot', 'stupid', 'dumb',
]

// ── Cosine similarity (client-side, embedding vectors) ────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ── Rapport detector ──────────────────────────────────────

export function rapportScore(text: string): number {
  const lower = text.toLowerCase()
  const hasHigh       = RAPPORT_HIGH.some(w => lower.includes(w))
  const hasTransition = TRANSITION_BACK.some(w => lower.includes(w))
  if (hasTransition) return 0.85  // transitions back are valuable
  if (hasHigh)       return 0.65
  return 0.2
}

// ── Duration penalty ──────────────────────────────────────
// Short segments (<30 s) get less penalty — they're often rapport bridges

export function durationPenalty(durationSec: number): number {
  return Math.min(1, durationSec / 120)  // 2 min = full penalty
}

// ── Main scorer ───────────────────────────────────────────

export function scoreSegment(
  topicSimilarity: number,   // 0–1 from embedding cosine similarity
  text: string,
  durationSec: number,
): number {
  const rapport  = rapportScore(text)
  const durPen   = durationPenalty(durationSec)
  return 0.4 * topicSimilarity + 0.3 * rapport + 0.3 * (1 - durPen)
}

// ── Status classifier ─────────────────────────────────────

export function classifySegment(score: number): Segment['status'] {
  if (score >= 0.70) return 'ontopic'
  if (score >= 0.40) return 'ontopic'  // review zone — user decides
  return 'drift'
}

// ── Profanity scanner ─────────────────────────────────────

export function detectProfanity(text: string): string[] {
  const lower = text.toLowerCase()
  return PROFANE_WORDS.filter(w => {
    const re = new RegExp(`\\b${w}\\b`, 'i')
    return re.test(lower)
  })
}