/**
 * Diarization worker — groups transcript words into speaker turns.
 *
 * For MVP we use heuristic diarization (pause-based segmentation).
 * Replace with pyannote.audio WASM or WhisperX when available in browser.
 *
 * Messages IN:
 *   { type: 'diarise', words: WordTimestamp[] }
 *
 * Messages OUT:
 *   { type: 'result', data: DiarisedSegment[] }
 *   { type: 'error',  message: string }
 */

export type WordTimestamp = {
  word:  string
  start: number
  end:   number
}

export type DiarisedSegment = {
  speaker:    string      // 'Speaker 1', 'Speaker 2', etc.
  start_time: number
  end_time:   number
  transcript: string
}

const PAUSE_THRESHOLD = 1.5   // seconds — pauses longer than this split segments
const MAX_SEGMENT_DURATION = 60  // force split at 60 s regardless

function groupIntoSegments(words: WordTimestamp[]): DiarisedSegment[] {
  if (words.length === 0) return []

  const segments: DiarisedSegment[] = []
  let buffer: WordTimestamp[] = [words[0]]

  for (let i = 1; i < words.length; i++) {
    const prev = words[i - 1]
    const curr = words[i]
    const pause    = curr.start - prev.end
    const duration = (buffer[buffer.length - 1].end) - buffer[0].start

    const shouldSplit = pause > PAUSE_THRESHOLD || duration >= MAX_SEGMENT_DURATION

    if (shouldSplit) {
      segments.push(flush(buffer))
      buffer = [curr]
    } else {
      buffer.push(curr)
    }
  }

  if (buffer.length > 0) segments.push(flush(buffer))

  // Heuristic speaker assignment — alternates on long pauses > 3s
  // This is intentionally simple for MVP; replace with real diarization later
  let speaker = 1
  let prevEnd = 0
  return segments.map(seg => {
    if (seg.start_time - prevEnd > 3) speaker = speaker === 1 ? 2 : 1
    prevEnd = seg.end_time
    return { ...seg, speaker: `Speaker ${speaker}` }
  })
}

function flush(words: WordTimestamp[]): DiarisedSegment {
  return {
    speaker:    'Speaker 1',
    start_time: words[0].start,
    end_time:   words[words.length - 1].end,
    transcript: words.map(w => w.word).join('').trim(),
  }
}

self.addEventListener('message', (e: MessageEvent) => {
  const { type, words } = e.data
  if (type !== 'diarise') return

  try {
    const segments = groupIntoSegments(words as WordTimestamp[])
    self.postMessage({ type: 'result', data: segments })
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) })
  }
})