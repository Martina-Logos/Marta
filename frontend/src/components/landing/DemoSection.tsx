import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Cpu, Download, ArrowRight, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import s from './DemoSection.module.css'

const SLIDES = [
  {
    step:  '01',
    title: 'Upload your file',
    desc:  'Drop any audio or video up to 200 MB. Tell FocusClip what your episode is about and confirm the AI-detected sub-topics before analysis begins.',
    Icon:  Upload,
  },
  {
    step:  '02',
    title: 'AI detects drift',
    desc:  'Whisper transcribes with word-level timestamps. Semantic embeddings score every segment — topic match, rapport value, and duration — then flag what strays.',
    Icon:  Cpu,
  },
  {
    step:  '03',
    title: 'Review and export',
    desc:  'Approve, remove, or reorder segments. Mute individual profane words. Export a clean audio file, SRT captions, chapter markers, and show notes in one click.',
    Icon:  Download,
  },
]

export default function DemoSection() {
  const nav   = useNavigate()
  const [active, setActive] = useState(0)

  return (
    <section className={s.section} id="demo">
      <p className={s.sectionPill}><span>—</span> See it in action <span>—</span></p>
      <h2 className={s.title}>From messy recording<br /><em>to polished episode.</em></h2>

      <div className={s.layout}>

        {/* Step navigator */}
        <nav className={s.stepNav} aria-label="Demo steps">
          {SLIDES.map((sl, i) => (
            <button
              key={i}
              className={`${s.stepBtn} ${i === active ? s.stepActive : ''}`}
              onClick={() => setActive(i)}
              aria-current={i === active ? 'step' : undefined}
            >
              <span className={s.stepNum}>{sl.step}</span>
              <span className={s.stepLabel}>{sl.title}</span>
              <div className={s.stepBar} />
            </button>
          ))}
        </nav>

        {/* Slide panels — all mounted, only active shown */}
        <div className={s.slides}>
          {SLIDES.map((sl, i) => {
            const Icon = sl.Icon
            return (
              <div
                key={i}
                className={`${s.slide} ${i === active ? s.slideActive : ''}`}
                aria-hidden={i !== active}
              >
                <div className={s.slideHead}>
                  <div className={s.slideIcon}><Icon size={20} strokeWidth={1.5} /></div>
                  <div>
                    <p className={s.slideStep}>{sl.step}</p>
                    <h3 className={s.slideTitle}>{sl.title}</h3>
                  </div>
                </div>

                <p className={s.slideDesc}>{sl.desc}</p>

                {/* Slide-specific visual */}
                <div className={s.visual}>
                  {i === 0 && <UploadVisual />}
                  {i === 1 && <AnalysisVisual />}
                  {i === 2 && <ExportVisual />}
                </div>

                {/* Navigation */}
                {i < SLIDES.length - 1 ? (
                  <button className={s.nextBtn} onClick={() => setActive(i + 1)}>
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight={<ArrowRight size={13} />}
                    onClick={() => nav('/auth?tab=signup')}
                  >
                    Get started free
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Slide visuals ─────────────────────────────────────────── */

function UploadVisual() {
  return (
    <div className={s.visualInner}>
      <div className={s.dropBox}>
        <Upload size={22} strokeWidth={1.5} color="var(--burg-bright)" />
        <div>
          <strong>Drop your file here</strong>
          <span>MP4 · WebM · MP3 · WAV · M4A · up to 200 MB</span>
        </div>
      </div>
      <div className={s.inputRow}>
        <label>Core topic</label>
        <div className={s.mockInput}>Focus systems for ADHD brains</div>
      </div>
      <div className={s.chips}>
        {['Focus systems', 'ADHD strategies', 'Deep work'].map(t => (
          <span key={t} className={s.chipKeep}>{t}</span>
        ))}
        {['Newsletter promo', 'App mention'].map(t => (
          <span key={t} className={s.chipDrift}>✕ {t}</span>
        ))}
      </div>
    </div>
  )
}

function AnalysisVisual() {
  return (
    <div className={s.visualInner}>
      <div className={s.analyseWave}>
        {Array.from({ length: 52 }).map((_, i) => {
          const h = 8 + Math.abs(Math.sin(i * 0.5) * 22) + Math.abs(Math.sin(i * 0.2) * 12)
          const p = i / 52
          const isDrift = (p > 0.10 && p < 0.20) || (p > 0.42 && p < 0.54)
          return (
            <div
              key={i}
              className={`${s.abar} ${isDrift ? s.abarDrift : s.abarOn}`}
              style={{ height: `${Math.max(4, Math.round(h))}px` }}
            />
          )
        })}
      </div>
      <div className={s.scores}>
        {[
          { label: 'Topic match', pct: 82, color: 'var(--sky)'    },
          { label: 'Rapport',     pct: 45, color: 'var(--pebble)' },
          { label: 'Duration',    pct: 30, color: 'var(--burg)'   },
        ].map(r => (
          <div key={r.label} className={s.scoreRow}>
            <span>{r.label}</span>
            <div className={s.scoreTrack}>
              <div className={s.scoreFill} style={{ width: `${r.pct}%`, background: r.color }} />
            </div>
            <span>{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExportVisual() {
  return (
    <div className={s.visualInner}>
      <div className={s.compare}>
        <div className={s.compareCol}>
          <span className={s.cLabel}>Original</span>
          <span className={s.cVal} style={{ color: 'var(--pebble)' }}>18:42</span>
          <span className={s.cSub}>6 segments</span>
        </div>
        <ArrowRight size={18} color="var(--burg-bright)" />
        <div className={s.compareCol}>
          <span className={s.cLabel}>Final cut</span>
          <span className={s.cVal} style={{ color: 'var(--sky)' }}>14:05</span>
          <span className={s.cSub}>4 kept · 87% focused</span>
        </div>
      </div>
      <div className={s.formats}>
        {['Edited MP3', 'Captions .srt', 'Chapters .txt', 'Show notes'].map(f => (
          <span key={f} className={s.format}>
            <Download size={11} strokeWidth={2} />{f}
          </span>
        ))}
      </div>
    </div>
  )
}