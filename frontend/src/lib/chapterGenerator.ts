import type { Segment } from './supabase'

/** Format seconds → M:SS (YouTube chapter format) */
function toTimestamp(seconds: number): string {
  const m   = Math.floor(seconds / 60)
  const s   = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format seconds → HH:MM:SS,mmm (SRT format) */
function toSRT(seconds: number): string {
  const h   = Math.floor(seconds / 3600)
  const m   = Math.floor((seconds % 3600) / 60)
  const s   = Math.floor(seconds % 60)
  const ms  = Math.round((seconds % 1) * 1000)
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0')
}

/** Truncate a string to a given length, appending ellipsis */
function truncate(str: string, maxLen = 50): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…'
}

/**
 * Build YouTube-compatible chapter markers.
 * Format: `0:00 Chapter Title`
 */
export function buildYouTubeChapters(segments: Segment[]): string {
  const kept = [...segments]
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)

  if (kept.length === 0) return ''

  // First chapter must start at 0:00
  return kept
    .map((seg, i) => {
      const time  = i === 0 ? '0:00' : toTimestamp(seg.start_time)
      const title = truncate(seg.transcript, 50)
      return `${time} ${title}`
    })
    .join('\n')
}

/**
 * Build RSS/Podcast 2.0 chapters in JSON format.
 * Compatible with Spotify, Pocket Casts, etc.
 */
export function buildPodcastChapters(segments: Segment[], title: string): string {
  const kept = [...segments]
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)

  const chapters = kept.map(seg => ({
    startTime: Math.floor(seg.start_time),
    title:     truncate(seg.transcript, 60),
  }))

  return JSON.stringify({ version: '1.2.0', title, chapters }, null, 2)
}

/**
 * Build SRT subtitle file from kept segments.
 */
export function buildSRT(segments: Segment[]): string {
  const kept = [...segments]
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)

  return kept
    .map((seg, i) =>
      `${i + 1}\n${toSRT(seg.start_time)} --> ${toSRT(seg.end_time)}\n${seg.transcript}`
    )
    .join('\n\n')
}

/**
 * Build plain text show notes.
 */
export function buildShowNotes(segments: Segment[], episodeTitle: string): string {
  const kept = [...segments]
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)

  const lines = kept.map(seg =>
    `[${toTimestamp(seg.start_time)}] ${seg.transcript}`
  )

  return `# ${episodeTitle}\n\n## Episode Notes\n\n${lines.join('\n')}`
}