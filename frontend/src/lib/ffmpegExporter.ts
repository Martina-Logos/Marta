import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import type { Segment } from './supabase'

let ffmpeg: FFmpeg | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg
  ffmpeg = new FFmpeg()
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  await ffmpeg.load({
    coreURL:   await toBlobURL(`${base}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL:   await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript'),
  })
  return ffmpeg
}

// ── Generate FFmpeg concat filter from kept segments ──────

function buildConcatFilter(segments: Segment[]): string {
  const kept = [...segments]
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)

  return kept
    .map((s, i) => `[0:a]atrim=start=${s.start_time}:end=${s.end_time},asetpts=PTS-STARTPTS[a${i}]`)
    .join(';') +
    ';' +
    kept.map((_, i) => `[a${i}]`).join('') +
    `concat=n=${kept.length}:v=0:a=1[out]`
}

// ── Export edited audio ───────────────────────────────────

export async function exportAudio(
  file: File,
  segments: Segment[],
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const ff = await getFFmpeg()

  ff.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  await ff.writeFile('input', await fetchFile(file))

  const filter = buildConcatFilter(segments)
  const ext = file.name.endsWith('.mp4') ? 'mp4' : 'mp3'
  const output = `output.${ext}`

  if (ext === 'mp3') {
    await ff.exec([
      '-i', 'input',
      '-filter_complex', filter,
      '-map', '[out]',
      '-acodec', 'libmp3lame', '-q:a', '2',
      output,
    ])
  } else {
    await ff.exec([
      '-i', 'input',
      '-filter_complex', filter,
      '-map', '0:v', '-map', '[out]',
      '-c:v', 'copy', '-c:a', 'aac',
      output,
    ])
  }

  const data = await ff.readFile(output)
  return new Blob([data], { type: ext === 'mp3' ? 'audio/mpeg' : 'video/mp4' })
}

// ── Build SRT captions from segments ─────────────────────

function secondsToSRT(s: number): string {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const ms  = Math.round((s % 1) * 1000)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`
}

export function buildSRT(segments: Segment[]): string {
  return segments
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)
    .map((s, i) => `${i + 1}\n${secondsToSRT(s.start_time)} --> ${secondsToSRT(s.end_time)}\n${s.transcript}`)
    .join('\n\n')
}

// ── Build YouTube chapter markers ─────────────────────────

export function buildChapters(segments: Segment[]): string {
  return segments
    .filter(s => s.kept)
    .sort((a, b) => a.position - b.position)
    .map(s => {
      const m = Math.floor(s.start_time / 60)
      const sec = Math.floor(s.start_time % 60)
      return `${String(m).padStart(1,'0')}:${String(sec).padStart(2,'0')} ${s.transcript.slice(0, 40)}…`
    })
    .join('\n')
}

// ── Build plain text show notes ───────────────────────────

export function buildShowNotes(segments: Segment[], title: string): string {
  const kept = segments.filter(s => s.kept).sort((a, b) => a.position - b.position)
  return `# ${title}\n\n` + kept.map(s => `- ${s.transcript}`).join('\n')
}