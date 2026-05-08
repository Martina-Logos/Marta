import { useNavigate } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge  from '@/components/ui/Badge'
import s from './Hero.module.css'

const PREVIEW_SEGMENTS = [
  { time: '0:00', status: 'ontopic' as const, kept: true,  text: 'Welcome back. Today we\'re discussing focus systems for ADHD brains.' },
  { time: '0:48', status: 'drift'   as const, kept: false, text: 'Quick mention of my newsletter — link in description.' },
  { time: '1:24', status: 'ontopic' as const, kept: true,  text: 'Context-switching costs 23 minutes of recovery per interruption.' },
  { time: '2:15', status: 'drift'   as const, kept: false, text: 'Oh — that new app I saw on Twitter last week...' },
  { time: '3:19', status: 'ontopic' as const, kept: true,  text: 'The Pomodoro method makes time blindness visible.' },
]

interface Props { onDemoClick: () => void }

export default function Hero({ onDemoClick }: Props) {
  const nav = useNavigate()

  return (
    <section className={s.hero}>
      <div className={s.pillLabel}>
        <span>—</span> AI-powered podcast editing <span>—</span>
      </div>

      <h1 className={s.title}>
        Cut the drift,<br />
        <em>keep the focus.</em>
      </h1>

      <p className={s.sub}>
        FocusClip detects off-topic segments in your podcast or video, lets you review
        and reorder them, then exports a tighter cut — entirely in your browser.
      </p>

      <div className={s.btns}>
        <Button
          variant="primary"
          size="lg"
          iconRight={<ArrowRight size={16} />}
          onClick={() => nav('/auth?tab=signup')}
        >
          Get started free
        </Button>
        <Button
          variant="ghost"
          size="lg"
          icon={<Play size={14} />}
          onClick={onDemoClick}
        >
          See how it works
        </Button>
      </div>

      {/* Mini editor preview */}
      <div className={s.preview}>
        <div className={s.previewBar}>
          <div className={s.winDots}>
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#febc2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <span className={s.previewTitle}>FocusClip AI — podcast-ep12.mp3 · 87% focused</span>
          <span />
        </div>

        {/* Waveform strip */}
        <div className={s.waveStrip}>
          {Array.from({ length: 100 }).map((_, i) => {
            const h = 10 + Math.abs(Math.sin(i * 0.4 + 1) * 22) + Math.abs(Math.sin(i * 0.17) * 14)
            const p = i / 100
            const cls =
              (p > 0.04 && p < 0.09) || (p > 0.22 && p < 0.30) ? s.barDrift :
              (p > 0.09 && p < 0.22) ? s.barRemoved :
              (p > 0.40 && p < 0.44) ? s.barPebble  : s.barOntopic
            return <div key={i} className={`${s.bar} ${cls}`} style={{ height: `${Math.max(4, Math.round(h))}px` }} />
          })}
          <div className={s.playhead} />
        </div>

        {/* Segment rows */}
        <div className={s.previewSegs}>
          {PREVIEW_SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className={`${s.pseg} ${seg.status === 'drift' ? s.psegDrift : s.psegOntopic} ${!seg.kept ? s.psegRemoved : ''}`}
            >
              <span className={s.pts}>{seg.time}</span>
              <Badge status={seg.status} size="sm" />
              <span className={`${s.ptxt} ${!seg.kept ? s.struck : ''}`}>{seg.text}</span>
            </div>
          ))}
        </div>

        <div className={s.previewLegend}>
          <span><i style={{ background: 'var(--sky)' }} />On-topic</span>
          <span><i style={{ background: 'var(--burg)' }} />Drift</span>
          <span><i style={{ background: 'var(--pebble)' }} />Profanity</span>
        </div>
      </div>
    </section>
  )
}