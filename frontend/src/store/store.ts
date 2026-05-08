import { create } from 'zustand'
import type { Segment } from '@/lib/supabase'

/* ── Editor state ────────────────────────────────────────── */

type ProcessingStep = 'idle' | 'loading' | 'transcribing' | 'analysing' | 'done' | 'error'

type UndoAction =
  | { type: 'toggle_kept';    id: string; prev: boolean }
  | { type: 'reorder';        prev: string[] }
  | { type: 'toggle_profane'; id: string; word: string; prev: boolean }

interface EditorState {
  // File
  file:           File | null
  coreTopic:      string
  adhdMode:       boolean

  // Processing
  step:           ProcessingStep
  stepLabel:      string
  progress:       number

  // Segments
  segments:       Segment[]
  segmentOrder:   string[]           // ordered segment IDs
  mutedWords:     Record<string, string[]>  // segmentId → muted words
  undoStack:      UndoAction[]

  // Actions
  setFile:        (f: File)          => void
  setCoreTopic:   (t: string)        => void
  toggleAdhd:     ()                 => void
  setProcessing:  (step: ProcessingStep, label: string, pct: number) => void
  setSegments:    (segs: Segment[])  => void
  reorderSegments:(ids: string[])    => void
  toggleKept:     (id: string)       => void
  toggleMutedWord:(id: string, word: string) => void
  removeAllDrifts:()                 => void
  undo:           ()                 => void
  reset:          ()                 => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  file:         null,
  coreTopic:    '',
  adhdMode:     false,
  step:         'idle',
  stepLabel:    '',
  progress:     0,
  segments:     [],
  segmentOrder: [],
  mutedWords:   {},
  undoStack:    [],

  setFile: (file) => set({ file }),

  setCoreTopic: (coreTopic) => set({ coreTopic }),

  toggleAdhd: () => set(s => ({ adhdMode: !s.adhdMode })),

  setProcessing: (step, stepLabel, progress) =>
    set({ step, stepLabel, progress }),

  setSegments: (segs) => set({
    segments:     segs,
    segmentOrder: segs.map(s => s.id),
  }),

  reorderSegments: (ids) => {
    const prev = get().segmentOrder
    set(s => ({
      segmentOrder: ids,
      undoStack:    [...s.undoStack, { type: 'reorder', prev }].slice(-20),
    }))
  },

  toggleKept: (id) => set(s => {
    const seg  = s.segments.find(x => x.id === id)
    if (!seg) return {}
    return {
      segments:   s.segments.map(x => x.id === id ? { ...x, kept: !x.kept } : x),
      undoStack:  [...s.undoStack, { type: 'toggle_kept', id, prev: seg.kept }].slice(-20),
    }
  }),

  toggleMutedWord: (id, word) => set(s => {
    const current = s.mutedWords[id] ?? []
    const isMuted = current.includes(word)
    const next    = isMuted ? current.filter(w => w !== word) : [...current, word]
    return {
      mutedWords: { ...s.mutedWords, [id]: next },
      undoStack:  [...s.undoStack, { type: 'toggle_profane', id, word, prev: isMuted }].slice(-20),
    }
  }),

  removeAllDrifts: () => set(s => ({
    segments: s.segments.map(x => x.status === 'drift' ? { ...x, kept: false } : x),
  })),

  undo: () => set(s => {
    if (!s.undoStack.length) return {}
    const action = s.undoStack[s.undoStack.length - 1]
    const stack  = s.undoStack.slice(0, -1)

    switch (action.type) {
      case 'toggle_kept':
        return { segments: s.segments.map(x => x.id === action.id ? { ...x, kept: action.prev } : x), undoStack: stack }
      case 'reorder':
        return { segmentOrder: action.prev, undoStack: stack }
      case 'toggle_profane': {
        const current = s.mutedWords[action.id] ?? []
        const next    = action.prev ? [...current, action.word] : current.filter(w => w !== action.word)
        return { mutedWords: { ...s.mutedWords, [action.id]: next }, undoStack: stack }
      }
      default:
        return {}
    }
  }),

  reset: () => set({
    file: null, coreTopic: '', step: 'idle', stepLabel: '',
    progress: 0, segments: [], segmentOrder: [], mutedWords: {}, undoStack: [],
  }),
}))

/* ── Auth state (lightweight, Supabase handles the heavy lifting) ─ */

interface AuthState {
  userId: string | null
  setUserId: (id: string | null) => void
}

export const useAuthStore = create<AuthState>(set => ({
  userId:    null,
  setUserId: (userId) => set({ userId }),
}))