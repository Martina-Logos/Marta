import { create } from 'zustand'

export type ProcessingStep =
  | 'idle'
  | 'loading_file'
  | 'downloading_model'
  | 'transcribing'
  | 'analysing'
  | 'done'
  | 'error'

interface ProcessingState {
  step:       ProcessingStep
  stepLabel:  string
  progress:   number          // 0–100
  error:      string | null

  setStep:     (step: ProcessingStep, label: string, progress: number) => void
  setProgress: (progress: number)                                       => void
  setError:    (message: string)                                        => void
  reset:       ()                                                       => void
}

export const useProcessingStore = create<ProcessingState>(set => ({
  step:      'idle',
  stepLabel: '',
  progress:  0,
  error:     null,

  setStep: (step, stepLabel, progress) =>
    set({ step, stepLabel, progress, error: null }),

  setProgress: (progress) => set({ progress }),

  setError: (error) => set({ step: 'error', error }),

  reset: () => set({ step: 'idle', stepLabel: '', progress: 0, error: null }),
}))