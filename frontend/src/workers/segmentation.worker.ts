/**
 * Segmentation worker — scores segments for topic drift.
 *
 * Uses sentence-transformers via @xenova/transformers to produce
 * semantic embeddings, then calculates cosine similarity against
 * the user's declared core topic.
 *
 * Messages IN:
 *   { type: 'score', segments: RawSegment[], coreTopic: string }
 *
 * Messages OUT:
 *   { type: 'progress', data: { step: string; percent: number } }
 *   { type: 'result',   data: ScoredSegment[] }
 *   { type: 'error',    message: string }
 */

import { pipeline, env } from '@xenova/transformers'
import { EMBEDDING_MODEL } from '@/constants/modelConfig'
import { calculateDriftScore } from '@/lib/rapportDetector'
import { detectProfanity }     from '@/lib/rapportDetector'
import { DRIFT_THRESHOLDS }    from '@/constants/driftThresholds'

env.allowLocalModels = false
env.useBrowserCache  = true

export type RawSegment = {
  id:         string
  position:   number
  start_time: number
  end_time:   number
  speaker:    string
  transcript: string
}

export type ScoredSegment = RawSegment & {
  drift_score:   number
  status:        'ontopic' | 'drift' | 'profane'
  kept:          boolean
  profane_words: string[]
}

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null

async function getEmbedder() {
  if (embedder) return embedder
  embedder = await pipeline('feature-extraction', EMBEDDING_MODEL, {
    progress_callback: (p: { progress: number }) => {
      self.postMessage({
        type: 'progress',
        data: { step: 'Loading embedding model…', percent: Math.round(p.progress * 30) },
      })
    },
  })
  return embedder
}

async function embed(text: string): Promise<number[]> {
  const pipe   = await getEmbedder()
  const output = await pipe(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d === 0 ? 0 : dot / d
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, segments, coreTopic } = e.data
  if (type !== 'score') return

  try {
    self.postMessage({ type: 'progress', data: { step: 'Embedding topic…', percent: 30 } })
    const topicVec = await embed(coreTopic)

    const results: ScoredSegment[] = []
    const total = (segments as RawSegment[]).length

    for (let i = 0; i < total; i++) {
      const seg = (segments as RawSegment[])[i]

      self.postMessage({
        type: 'progress',
        data: {
          step:    `Scoring segment ${i + 1} of ${total}…`,
          percent: 30 + Math.round((i / total) * 65),
        },
      })

      const segVec    = await embed(seg.transcript)
      const topicSim  = cosine(topicVec, segVec)
      const duration  = seg.end_time - seg.start_time
      const score     = calculateDriftScore(topicSim, seg.transcript, duration)
      const profane   = detectProfanity(seg.transcript)

      const status: ScoredSegment['status'] =
        profane.length > 0         ? 'profane'
        : score >= DRIFT_THRESHOLDS.KEEP ? 'ontopic'
        : 'drift'

      results.push({
        ...seg,
        drift_score:   score,
        status,
        kept:          status !== 'drift',
        profane_words: profane,
      })
    }

    self.postMessage({ type: 'progress', data: { step: 'Done', percent: 100 } })
    self.postMessage({ type: 'result', data: results })

  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) })
  }
})