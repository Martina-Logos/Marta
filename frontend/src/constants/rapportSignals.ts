/**
 * Keyword signals used by the rapport detector.
 * These phrases indicate a segment has conversational or emotional value
 * even if it strays slightly from the core topic.
 */

/** High-value rapport indicators — personal story, vulnerability, lesson */
export const RAPPORT_HIGH: string[] = [
  'when i was',
  'i remember',
  'let me be honest',
  'real talk',
  'to be fair',
  'personal story',
  'struggled with',
  'the truth is',
  'i learned',
  'what changed for me',
  'for me personally',
]

/** Transition phrases — speaker consciously returns to topic */
export const RAPPORT_TRANSITIONS: string[] = [
  'but here\'s the thing',
  'anyway back to',
  'which brings me to',
  'back to the point',
  'getting back on track',
  'so as i was saying',
  'the reason i mention this',
  'this ties into',
  'to bring it back',
]

/** Emotional keywords that add value to a segment */
export const RAPPORT_EMOTIONAL: string[] = [
  'struggle',
  'lesson',
  'honestly',
  'vulnerable',
  'grateful',
  'changed my mind',
  'used to think',
  'the moment i realised',
]

/** Words/phrases that strongly signal an off-topic tangent */
export const DRIFT_SIGNALS: string[] = [
  'by the way',
  'random thought',
  'totally unrelated',
  'off topic',
  'side note',
  'quick plug',
  'subscribe to my',
  'follow me on',
  'check out my',
  'link in the description',
  'link in bio',
  'sponsored by',
]

/** Profanity list (conservative — extend as needed) */
export const PROFANE_WORDS: string[] = [
  'damn', 'hell', 'crap', 'ass', 'shit', 'fuck',
  'bitch', 'bastard', 'piss', 'cock', 'dick',
]