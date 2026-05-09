import { useRef } from 'react'
import { GripVertical, RotateCcw, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useEditorStore } from '@/store'
import { detectProfanity } from '@/lib/rapportDetector'
import type { Segment } from '@/lib/supabase'
import s from './SegmentCard.module.css'

interface Props {
  segment:     Segment
  adhdMode:    boolean
  isDragOver:  boolean
  onDragStart: (id: string)   => void
  onDragOver:  (id: string)   => void
  onDrop:      (targetId: string) => void
}

function formatTime(seconds: number): string {
  const m  = Math.floor(seconds / 60)
  const ss = Math.floor(seconds % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

export default function SegmentCard({
  segment, adhdMode, isDragOver, onDragStart, onDragOver, onDrop,
}: Props) {
  const { toggleKept, toggleWord, mutedWords } = useEditorStore()
  const muted    = mutedWords[segment.id] ?? []
  const dragRef  = useRef<HTMLDivElement>(null)
  const profane  = detectProfanity(segment.transcript)

  // Build highlighted transcript — muted words get strikethrough
  function renderTranscript() {
    if (profane.length === 0) return <span>{segment.transcript}</span>

    const regex = new RegExp(`\\b(${profane.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi')
    const parts = segment.transcript.split(regex)

    return (
      <>
        {parts.map((part, i) => {
          const isMatch = profane.some(w => w.toLowerCase() === part.toLowerCase())
          if (!isMatch) return <span key={i}>{part}</span>
          const isMuted = muted.includes(part.toLowerCase())
          return (
            <button
              key={i}
              className={`${s.profWord} ${isMuted ? s.profMuted : ''}`}
              onClick={() => toggleWord(segment.id, part.toLowerCase())}
              title={isMuted ? 'Click to restore' : 'Click to mute'}
            >
              {part}
            </button>
          )
        })}
      </>
    )
  }

  const duration = segment.end_time - segment.start_time

  return (
    <div
      ref={dragRef}
      className={[
        s.card,
        s[`card_${segment.status}`],
        !segment.kept ? s.cardRemoved  : '',
        adhdMode      ? s.cardAdhd     : '',
        isDragOver    ? s.cardDragOver : '',
      ].join(' ')}
      draggable
      onDragStart={() => onDragStart(segment.id)}
      onDragOver={e  => { e.preventDefault(); onDragOver(segment.id) }}
      onDrop={e      => { e.preventDefault(); onDrop(segment.id) }}
    >
      {/* Drag handle */}
      <div className={s.grip} aria-hidden>
        <GripVertical size={14} strokeWidth={1.5} />
      </div>

      <div className={s.body}>
        {/* Meta row */}
        <div className={s.meta}>
          <span className={s.timestamp}>{formatTime(segment.start_time)}</span>
          <span className={s.speaker}>{segment.speaker}</span>
          <Badge status={segment.status} size="sm" />
          {profane.length > 0 && <Badge status="profane" size="sm" />}
          <span className={s.duration}>{formatTime(duration)}</span>
        </div>

        {/* Transcript */}
        <p className={`${s.text} ${!segment.kept ? s.textStruck : ''}`}>
          {renderTranscript()}
        </p>

        {/* Actions */}
        <div className={s.actions}>
          {segment.kept ? (
            <button className={`${s.actionBtn} ${s.btnRemove}`} onClick={() => toggleKept(segment.id)}>
              <Trash2 size={12} strokeWidth={2} /> Remove
            </button>
          ) : (
            <button className={`${s.actionBtn} ${s.btnRestore}`} onClick={() => toggleKept(segment.id)}>
              <RotateCcw size={12} strokeWidth={2} /> Restore
            </button>
          )}
        </div>

        {/* ADHD hints */}
        {adhdMode && segment.status === 'drift' && (
          <p className={s.hint}>↕ Drag to reorder · this segment strays from main topic</p>
        )}
        {adhdMode && profane.length > 0 && (
          <p className={s.hint}>Tap highlighted words to mute or restore them</p>
        )}
      </div>
    </div>
  )
}