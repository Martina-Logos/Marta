import { useState } from 'react'
import { Download, Trash2, RotateCcw } from 'lucide-react'
import { useEditorStore } from '@/store'
import { exportAudio }    from '@/lib/ffmpegExporter'
import { buildSRT, buildYouTubeChapters, buildShowNotes } from '@/lib/chapterGenerator'
import Button from '@/components/ui/Button'
import s from './ExportPanel.module.css'

function formatDuration(sec: number): string {
  const m  = Math.floor(sec / 60)
  const ss = Math.floor(sec % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPanel() {
  const { file, segments, projectTitle, focusScore, keptSegments, removeAllDrifts, undo } = useEditorStore()

  const [exporting,  setExporting]  = useState(false)
  const [exportPct,  setExportPct]  = useState(0)

  const kept        = keptSegments()
  const total       = segments.length
  const keptCount   = kept.length
  const score       = focusScore()

  const origDuration = segments.reduce((sum, s) => sum + (s.end_time - s.start_time), 0)
  const finalDuration = kept.reduce((sum, s) => sum + (s.end_time - s.start_time), 0)
  const removed       = origDuration - finalDuration

  async function handleExportAudio() {
    if (!file) return
    setExporting(true); setExportPct(0)
    try {
      const blob = await exportAudio(file, segments, pct => setExportPct(pct))
      const ext  = file.name.endsWith('.mp4') ? 'mp4' : 'mp3'
      download(blob, `${projectTitle || 'focusclip-export'}.${ext}`)
    } finally {
      setExporting(false); setExportPct(0)
    }
  }

  function handleExportSRT() {
    const text = buildSRT(segments)
    download(new Blob([text], { type: 'text/plain' }), `${projectTitle || 'captions'}.srt`)
  }

  function handleExportChapters() {
    const text = buildYouTubeChapters(segments)
    download(new Blob([text], { type: 'text/plain' }), `${projectTitle || 'chapters'}.txt`)
  }

  function handleExportNotes() {
    const text = buildShowNotes(segments, projectTitle || 'Episode')
    download(new Blob([text], { type: 'text/plain' }), `${projectTitle || 'show-notes'}.md`)
  }

  return (
    <aside className={s.panel}>
      <div className={s.head}>
        <h2 className={s.title}>Export</h2>
        <p className={s.sub}>Review & finalise your cut</p>
      </div>

      {/* Stats */}
      <div className={s.statsGrid}>
        <div className={s.statBox}>
          <span className={s.statLabel}>Focus score</span>
          <span className={`${s.statVal} ${s.valSky}`}>{score}%</span>
        </div>
        <div className={s.statBox}>
          <span className={s.statLabel}>Segments</span>
          <span className={`${s.statVal} ${s.valWhite}`}>{keptCount} kept</span>
        </div>
      </div>

      {/* Duration comparison */}
      <div className={s.durBox}>
        <span className={s.statLabel}>Duration</span>
        <div className={s.durRow}>
          <span className={s.durBefore}>{formatDuration(origDuration)}</span>
          <span className={s.durArrow}>→</span>
          <span className={s.durAfter}>{formatDuration(finalDuration)}</span>
        </div>
        {removed > 30 && (
          <span className={s.durSaved}>{formatDuration(removed)} removed</span>
        )}
      </div>

      <div className={s.divider} />

      {/* Bulk actions */}
      <button className={s.removeAllBtn} onClick={removeAllDrifts}>
        <Trash2 size={13} strokeWidth={1.75} /> Remove all drifts
      </button>
      <button className={s.undoBtn} onClick={undo}>
        <RotateCcw size={13} strokeWidth={1.75} /> Undo last action
      </button>

      <div className={s.divider} />

      {/* Export buttons */}
      <div className={s.exportGroup}>
        <Button
          variant="steel"
          fullWidth
          icon={<Download size={14} />}
          loading={exporting}
          disabled={!file || keptCount === 0}
          onClick={handleExportAudio}
        >
          {exporting ? `Exporting ${exportPct}%` : 'Export audio / video'}
        </Button>

        <div className={s.secondaryExports}>
          <button className={s.secBtn} onClick={handleExportSRT} disabled={keptCount === 0}>
            <Download size={11} /> Captions .srt
          </button>
          <button className={s.secBtn} onClick={handleExportChapters} disabled={keptCount === 0}>
            <Download size={11} /> Chapters .txt
          </button>
          <button className={s.secBtn} onClick={handleExportNotes} disabled={keptCount === 0}>
            <Download size={11} /> Show notes
          </button>
        </div>
      </div>
    </aside>
  )
}