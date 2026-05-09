import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import type { Segment } from '@/lib/supabase'
import s from './Waveform.module.css'

interface Props {
  file:     File | null
  segments: Segment[]
}

function formatTime(sec: number): string {
  const m  = Math.floor(sec / 60)
  const ss = Math.floor(sec % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

export default function Waveform({ file, segments }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const [playing,   setPlaying]   = useState(false)
  const [current,   setCurrent]   = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [volume,    setVolume]    = useState(1)
  const [peaks,     setPeaks]     = useState<number[]>([])

  // Decode audio and build peak data for waveform
  useEffect(() => {
    if (!file) return

    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate',    () => setCurrent(audio.currentTime))
    audio.addEventListener('ended',         () => setPlaying(false))

    // Decode for waveform peaks
    file.arrayBuffer().then(buf => {
      const ctx  = new AudioContext()
      ctx.decodeAudioData(buf, decoded => {
        const data  = decoded.getChannelData(0)
        const bins  = 200
        const step  = Math.floor(data.length / bins)
        const p: number[] = []
        for (let i = 0; i < bins; i++) {
          let max = 0
          for (let j = 0; j < step; j++) {
            const v = Math.abs(data[i * step + j])
            if (v > max) max = v
          }
          p.push(max)
        }
        setPeaks(p)
      })
    })

    return () => {
      audio.pause()
      URL.revokeObjectURL(url)
    }
  }, [file])

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || peaks.length === 0) return

    const ctx   = canvas.getContext('2d')!
    const W     = canvas.width
    const H     = canvas.height
    const mid   = H / 2
    const barW  = W / peaks.length

    ctx.clearRect(0, 0, W, H)

    peaks.forEach((peak, i) => {
      const x      = i * barW
      const barH   = peak * (H * 0.85)
      const t      = (i / peaks.length) * duration
      const played = duration > 0 && t <= current

      // Determine segment color for this time position
      const seg = segments.find(sg => t >= sg.start_time && t < sg.end_time)
      if (seg && !seg.kept) {
        ctx.fillStyle = 'rgba(188,189,184,0.2)'
      } else if (seg?.status === 'drift') {
        ctx.fillStyle = played ? '#9b1a1a' : 'rgba(114,16,16,0.65)'
      } else if (seg?.status === 'profane') {
        ctx.fillStyle = played ? '#9a8880' : 'rgba(141,161,185,0.5)'
      } else {
        ctx.fillStyle = played ? 'var(--sky)' : 'rgba(183,204,227,0.55)'
      }

      ctx.beginPath()
      ctx.roundRect(x, mid - barH / 2, Math.max(barW - 1, 1), barH, 2)
      ctx.fill()
    })

    // Playhead
    if (duration > 0) {
      const x = (current / duration) * W
      ctx.fillStyle = 'rgba(30,30,34,0.9)'
      ctx.fillRect(x - 1, 0, 2, H)
    }
  }, [peaks, current, duration, segments])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else         { audio.play();  setPlaying(true)  }
  }

  function seek(e: React.MouseEvent<HTMLCanvasElement>) {
    const audio = audioRef.current
    if (!audio || duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className={s.wrap}>
      {/* Canvas waveform */}
      <div className={s.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={s.canvas}
          width={900}
          height={72}
          onClick={seek}
          title="Click to seek"
        />
        {peaks.length === 0 && (
          <div className={s.placeholder}>
            {file ? 'Decoding waveform…' : 'Upload a file to see the waveform'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={s.controls}>
        <button className={s.playBtn} onClick={togglePlay} disabled={!file}>
          {playing ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
        </button>

        <span className={s.time}>
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <div className={s.progressBar}>
          <div className={s.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={s.volumeWrap}>
          <Volume2 size={13} strokeWidth={1.75} color="var(--ink-4)" />
          <input
            type="range" min={0} max={1} step={0.05}
            value={volume} onChange={changeVolume}
            className={s.volumeSlider}
          />
        </div>
      </div>

      {/* Legend */}
      <div className={s.legend}>
        <span><i style={{ background: 'var(--sky)' }} />On-topic</span>
        <span><i style={{ background: 'var(--burg)' }} />Drift</span>
        <span><i style={{ background: 'var(--pebble)' }} />Profanity</span>
        <span><i style={{ background: 'rgba(188,189,184,0.35)' }} />Removed</span>
      </div>
    </div>
  )
}