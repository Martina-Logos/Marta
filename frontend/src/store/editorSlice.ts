import { create } from 'zustand'
import type { Segment } from '../lib/supabase'

type UndoAction =
  | { type: 'toggle_kept';    id: string; prev: boolean }
  | { type: 'reorder';        prev: string[] }
  | { type: 'toggle_word';    segId: string; word: string; wasMuted: boolean }

interface EditorState {
  projectId:    string | null
  projectTitle: string
  file:         File | null
  coreTopic:    string
  adhdMode:     boolean

  segments:     Segment[]
  order:        string[]          // segment IDs in display order
  mutedWords:   Record<string, string[]>  // segId → muted word list
  undoStack:    UndoAction[]

  // Setters
  setProject:    (id: string, title: string)  => void
  setFile:       (file: File)                 => void
  setCoreTopic:  (topic: string)              => void
  toggleAdhd:    ()                           => void
  setSegments:   (segs: Segment[])            => void

  // Segment actions
  reorder:       (newOrder: string[])         => void
  toggleKept:    (id: string)                 => void
  toggleWord:    (segId: string, word: string) => void
  removeAllDrifts: ()                         => void
  undo:          ()                           => void

  // Computed helpers
  keptSegments:  () => Segment[]
  focusScore:    () => number

  reset:         () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId:    null,
  projectTitle: '',
  file:         null,
  coreTopic:    '',
  adhdMode:     false,
  segments:     [],
  order:        [],
  mutedWords:   {},
  undoStack:    [],

  setProject:   (id, title) => set({ projectId: id, projectTitle: title }),
  setFile:      (file)      => set({ file }),
  setCoreTopic: (coreTopic) => set({ coreTopic }),
  toggleAdhd:   ()          => set(s => ({ adhdMode: !s.adhdMode })),

  setSegments: (segs) => set({
    segments: segs,
    order:    segs.map(s => s.id),
  }),

  reorder: (newOrder) => {
    const prev = get().order
    set(s => ({
      order:     newOrder,
      undoStack: [...s.undoStack, { type: 'reorder', prev }].slice(-30),
    }))
  },

  toggleKept: (id) => set(s => {
    const seg = s.segments.find(x => x.id === id)
    if (!seg) return {}
    return {
      segments:  s.segments.map(x => x.id === id ? { ...x, kept: !x.kept } : x),
      undoStack: [...s.undoStack, { type: 'toggle_kept', id, prev: seg.kept }].slice(-30),
    }
  }),

  toggleWord: (segId, word) => set(s => {
    const current  = s.mutedWords[segId] ?? []
    const wasMuted = current.includes(word)
    const next     = wasMuted ? current.filter(w => w !== word) : [...current, word]
    return {
      mutedWords: { ...s.mutedWords, [segId]: next },
      undoStack:  [...s.undoStack, { type: 'toggle_word', segId, word, wasMuted }].slice(-30),
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
        return { order: action.prev, undoStack: stack }
      case 'toggle_word': {
        const cur  = s.mutedWords[action.segId] ?? []
        const next = action.wasMuted
          ? [...cur, action.word]
          : cur.filter(w => w !== action.word)
        return { mutedWords: { ...s.mutedWords, [action.segId]: next }, undoStack: stack }
      }
      default: return {}
    }
  }),

  keptSegments: () => {
    const { segments, order } = get()
    return order
      .map(id => segments.find(s => s.id === id)!)
      .filter(Boolean)
      .filter(s => s.kept)
  },

  focusScore: () => {
    const { segments } = get()
    if (!segments.length) return 0
    return Math.round((segments.filter(s => s.kept).length / segments.length) * 100)
  },

  reset: () => set({
    projectId: null, projectTitle: '', file: null,
    coreTopic: '', segments: [], order: [], mutedWords: {}, undoStack: [],
  }),
}))