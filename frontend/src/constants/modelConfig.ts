/**
 * Whisper model configuration.
 * Model size affects accuracy vs speed:
 *   tiny  ~75 MB  — fastest, less accurate
 *   base  ~150 MB — recommended for MVP
 *   small ~250 MB — best accuracy, slower on CPU
 */

export type WhisperModel = 'whisper-tiny' | 'whisper-base' | 'whisper-small'

export const DEFAULT_MODEL: WhisperModel =
  (import.meta.env.VITE_WHISPER_MODEL as WhisperModel) ?? 'whisper-base'

export const MODEL_CONFIG: Record<WhisperModel, {
  displayName: string
  sizeMB:      number
  recommended: boolean
}> = {
  'whisper-tiny': {
    displayName: 'Tiny (fastest)',
    sizeMB:      75,
    recommended: false,
  },
  'whisper-base': {
    displayName: 'Base (recommended)',
    sizeMB:      150,
    recommended: true,
  },
  'whisper-small': {
    displayName: 'Small (most accurate)',
    sizeMB:      250,
    recommended: false,
  },
}

/** Chunk and stride lengths for long-form audio transcription */
export const TRANSCRIPTION_CHUNKS = {
  chunkLengthSeconds:  30,
  strideLengthSeconds: 5,
} as const

/** Embedding model for semantic similarity scoring */
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'