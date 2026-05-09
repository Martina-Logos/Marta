import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Warn in dev instead of crashing the whole app
if (!url || !key) {
  console.warn(
    '[FocusClip] Missing Supabase env vars.\n' +
    'Create a .env file in your project root with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    'Get these from supabase.com → your project → Settings → API'
  )
}

export const supabase = createClient(
  url  ?? 'https://placeholder.supabase.co',
  key  ?? 'placeholder-key'
)

/* ── Types ────────────────────────────────────────────────── */

export type Project = {
  id:          string
  user_id:     string
  title:       string
  duration:    number
  focus_score: number
  status:      'draft' | 'processing' | 'complete'
  created_at:  string
  updated_at:  string
}

export type Segment = {
  id:          string
  project_id:  string
  position:    number
  start_time:  number
  end_time:    number
  speaker:     string
  transcript:  string
  status:      'ontopic' | 'drift' | 'profane'
  kept:        boolean
  drift_score: number
}