/**
 * Transcription worker — runs Whisper via @xenova/transformers
 * Runs in a separate thread so the UI never freezes.
 *
 * Messages IN:
 *   { type: 'transcribe', audioBuffer: ArrayBuffer, model: string }
 *
 * Messages OUT:
 *   { type: 'progress',  data: { step: string; percent: number } }
 *   { type: 'result',    data: TranscriptionResult }
 *   { type: 'error',     message: string }
 */

import { pipeline, env } from '@xenova/transformers'

// Keep model files in browser cache
env.allowLocalModels  = false
env.useBrowserCache   = true

export type WordTimestamp = {
  word:  string
  start: number   // seconds
  end:   number
}

export type TranscriptionResult = {
  text:      string
  language:  string
  words:     WordTimestamp[]
  duration:  number
}

let transcriber: Awaited<ReturnType<typeof pipeline>> | null = null

async function loadModel(model: string) {
  if (transcriber) return transcriber
  self.postMessage({ type: 'progress', data: { step: 'Downloading model…', percent: 5 } })

  transcriber = await pipeline('automatic-speech-recognition', `Xenova/${model}`, {
    progress_callback: (p: { progress: number }) => {
      self.postMessage({
        type: 'progress',
        data: { step: 'Loading model…', percent: Math.round(p.progress * 0.4) },
      })
    },
  })
  return transcriber
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, audioBuffer, model } = e.data

  if (type !== 'transcribe') return

  try {
    const pipe = await loadModel(model ?? 'whisper-base')

    self.postMessage({ type: 'progress', data: { step: 'Transcribing audio…', percent: 40 } })

    const result = await pipe(audioBuffer, {
      return_timestamps: 'word',
      chunk_length_s:    30,
      stride_length_s:   5,
    })

    self.postMessage({ type: 'progress', data: { step: 'Finalising…', percent: 95 } })

    // Normalise output shape
    const words: WordTimestamp[] = (result.chunks ?? []).map((c: { text: string; timestamp: [number, number] }) => ({
      word:  c.text,
      start: c.timestamp[0],
      end:   c.timestamp[1],
    }))

    const payload: TranscriptionResult = {
      text:     result.text as string,
      language: result.language as string ?? 'en',
      words,
      duration: words.length > 0 ? words[words.length - 1].end : 0,
    }

    self.postMessage({ type: 'result', data: payload })

  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) })
  }
})