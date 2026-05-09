import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useEditorStore } from '@/store'
import SegmentCard from './SegmentCard'
import s from './TranscriptPanel.module.css'

export default function TranscriptPanel() {
  const {
    segments, order, adhdMode,
    reorder, focusScore,
  } = useEditorStore()

  const [query,    setQuery]    = useState('')
  const [dragSrc,  setDragSrc]  = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Ordered segment objects
  const ordered = order
    .map(id => segments.find(s => s.id === id)!)
    .filter(Boolean)

  // Filter by search query
  const filtered = query
    ? ordered.filter(seg =>
        seg.transcript.toLowerCase().includes(query.toLowerCase())
      )
    : ordered

  const driftCount  = segments.filter(s => s.status === 'drift'   && !s.kept).length
  const profaneCount = segments.filter(s => s.status === 'profane').length

  const handleDragStart = useCallback((id: string) => setDragSrc(id), [])
  const handleDragOver  = useCallback((id: string) => setDragOver(id), [])

  const handleDrop = useCallback((targetId: string) => {
    if (!dragSrc || dragSrc === targetId) {
      setDragSrc(null); setDragOver(null); return
    }
    const next = [...order]
    const from = next.indexOf(dragSrc)
    const to   = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, dragSrc)
    reorder(next)
    setDragSrc(null); setDragOver(null)
  }, [dragSrc, order, reorder])

  return (
    <div className={s.panel}>
      {/* Panel header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.title}>Transcript</span>
          <span className={s.count}>{segments.length} segments</span>
        </div>
        <div className={s.badges}>
          {driftCount   > 0 && <span className={s.badgeDrift}>{driftCount} drift{driftCount !== 1 ? 's' : ''}</span>}
          {profaneCount > 0 && <span className={s.badgeProfane}>{profaneCount} profanity</span>}
        </div>
      </div>

      {/* ADHD progress bar */}
      {adhdMode && (
        <div className={s.adhdBar}>
          <div className={s.adhdBarHead}>
            <span>{segments.filter(s => s.kept).length} of {segments.length} kept</span>
            <strong>{focusScore()}% focused</strong>
          </div>
          <div className={s.adhdTrack}>
            <div className={s.adhdFill} style={{ width: `${focusScore()}%` }} />
          </div>
        </div>
      )}

      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          type="search"
          className={s.search}
          placeholder="Search transcript…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Segment list */}
      <div
        className={s.list}
        onDragEnd={() => { setDragSrc(null); setDragOver(null) }}
      >
        {filtered.length === 0 && (
          <p className={s.empty}>
            {query ? 'No segments match your search.' : 'No segments yet.'}
          </p>
        )}
        {filtered.map(seg => (
          <SegmentCard
            key={seg.id}
            segment={seg}
            adhdMode={adhdMode}
            isDragOver={dragOver === seg.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}