import { DEFAULT_MODEL } from '../constants/modelConfig'
import type { TranscriptionResult } from '../workers/transcription.worker'

export type { TranscriptionResult }

export type ProgressCallback = (step: string, percent: number) => void

/**
 * Transcribes an audio/video file using the Whisper WASM worker.
 * Returns a promise that resolves with the transcription result.
 */
export function transcribeFile(
  file:             File,
  onProgress?:      ProgressCallback,
  model             = DEFAULT_MODEL,
): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/transcription.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e: MessageEvent) => {
      const { type, data, message } = e.data

      switch (type) {
        case 'progress':
          onProgress?.(data.step, data.percent)
          break
        case 'result':
          worker.terminate()
          resolve(data as TranscriptionResult)
          break
        case 'error':
          worker.terminate()
          reject(new Error(message))
          break
      }
    }

    worker.onerror = err => {
      worker.terminate()
      reject(err)
    }

    // Convert file to ArrayBuffer before sending to worker
    file.arrayBuffer().then(buffer => {
      worker.postMessage({ type: 'transcribe', audioBuffer: buffer, model })
    }).catch(reject)
  })
}