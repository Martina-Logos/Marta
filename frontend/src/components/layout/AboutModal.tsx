import { ShieldCheck, Target, Brain, VolumeX, ArrowUpDown, Package, Keyboard } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import s from './AboutModal.module.css'

interface Props { open: boolean; onClose: () => void }

const FEATURES = [
  {
    icon:    Target,
    title:   'AI Drift Detection',
    sub:     'Multi-signal scoring system',
    body:    'Each segment is scored by topic similarity, rapport value, and duration. Scores above 0.7 are kept automatically — the rest surface for your review.',
    demo:    [
      { label: 'Topic match', pct: 82, color: 'var(--sky)' },
      { label: 'Rapport',     pct: 45, color: 'var(--pebble)' },
      { label: 'Duration',    pct: 30, color: 'var(--burg)' },
    ],
  },
  {
    icon:    ShieldCheck,
    title:   'Privacy First',
    sub:     'Everything runs in your browser',
    body:    'Whisper runs via WebAssembly in your browser tab. FFmpeg handles the export locally. Your audio never leaves your device for AI processing — no server, no API key.',
    demo:    null,
  },
  {
    icon:    Brain,
    title:   'ADHD Mode',
    sub:     'Designed for neurodiverse creators',
    body:    'Activates a review progress bar, colour-coded segment borders, and one-at-a-time decision hints. Toggle it in the editor header to reduce cognitive load.',
    demo:    null,
  },
  {
    icon:    VolumeX,
    title:   'Profanity Filter',
    sub:     'Word-level, not segment-level',
    body:    'Individual words are highlighted in the transcript. Click any flagged word to toggle muting. Your voice is preserved — only specific words are silenced on export.',
    demo:    null,
  },
  {
    icon:    ArrowUpDown,
    title:   'Segment Reorder',
    sub:     'Drag to restructure your episode',
    body:    'Drag the handle on any segment card to move it. Group related segments together regardless of when they were recorded. FocusClip re-stitches the audio on export.',
    demo:    null,
  },
  {
    icon:    Package,
    title:   'Export Package',
    sub:     '5 files from one click',
    body:    null,
    list:    [
      'Audio/Video — clean MP3 or MP4',
      'Transcript — .txt with timestamps',
      'Captions — .srt for any platform',
      'Chapters — YouTube & RSS format',
      'Show notes — AI-written summary',
    ],
  },
]

const SHORTCUTS = [
  { keys: 'Space', action: 'Play / pause' },
  { keys: 'Del',   action: 'Remove segment' },
  { keys: 'R',     action: 'Restore segment' },
  { keys: '⌘ Z',   action: 'Undo last action' },
  { keys: 'E',     action: 'Open export panel' },
  { keys: '?',     action: 'Open this panel' },
]

export default function AboutModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="About FocusClip"
      subtitle="Features, privacy, and how it all works"
      side
    >
      <div className={s.content}>
        {FEATURES.map(f => {
          const Icon = f.icon
          return (
            <div className={s.card} key={f.title}>
              <div className={s.cardHead}>
                <div className={s.iconWrap}><Icon size={18} strokeWidth={1.5} /></div>
                <div>
                  <div className={s.cardTitle}>{f.title}</div>
                  <div className={s.cardSub}>{f.sub}</div>
                </div>
              </div>

              {f.body && <p className={s.cardBody}>{f.body}</p>}

              {f.list && (
                <ul className={s.cardList}>
                  {f.list.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}

              {f.demo && (
                <div className={s.demo}>
                  {f.demo.map(row => (
                    <div className={s.scoreRow} key={row.label}>
                      <span>{row.label}</span>
                      <div className={s.scoreTrack}>
                        <div className={s.scoreFill} style={{ width: `${row.pct}%`, background: row.color }} />
                      </div>
                      <span>{row.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Keyboard shortcuts */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <div className={s.iconWrap}><Keyboard size={18} strokeWidth={1.5} /></div>
            <div>
              <div className={s.cardTitle}>Keyboard Shortcuts</div>
              <div className={s.cardSub}>Editor only</div>
            </div>
          </div>
          <div className={s.shortcuts}>
            {SHORTCUTS.map(sc => (
              <div className={s.shortcut} key={sc.action}>
                <kbd>{sc.keys}</kbd>
                <span>{sc.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}