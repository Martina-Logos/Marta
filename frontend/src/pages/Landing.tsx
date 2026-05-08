import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import {
  Upload, Cpu, Download, ShieldCheck, Brain, Clock,
  VolumeX, ArrowUpDown, Package, ChevronDown, ChevronUp,
  ArrowRight, Play
} from 'lucide-react'
import styles from './Landing.module.css'

interface Props { session: Session | null }

/* ── 3-slide demo data ───────────────────────────────────── */

const SLIDES = [
  {
    step: '01',
    title: 'Upload your file',
    desc:  'Drop any audio or video. FocusClip supports MP4, WebM, MP3, WAV, M4A up to 200 MB. Describe your topic and confirm the AI-detected sub-topics.',
    icon:  Upload,
  },
  {
    step: '02',
    title: 'AI detects drift',
    desc:  'Whisper transcribes with word-level timestamps. Semantic embeddings score every segment — topic match, rapport value, duration — and flag what strays.',
    icon:  Cpu,
  },
  {
    step: '03',
    title: 'Review and export',
    desc:  'Approve, remove, or reorder segments. Mute individual profane words. Export a clean audio file, SRT captions, chapter markers, and show notes.',
    icon:  Download,
  },
]

const SAMPLE_SEGMENTS = [
  { time: '0:00', dur: '0:47', status: 'ontopic', kept: true,  text: 'Welcome back. Today we\'re discussing focus systems for ADHD brains.' },
  { time: '0:48', dur: '0:32', status: 'drift',   kept: false, text: 'Quick mention of my newsletter — link in description.' },
  { time: '1:24', dur: '0:51', status: 'ontopic', kept: true,  text: 'Context-switching costs 23 minutes of recovery per interruption.' },
  { time: '2:15', dur: '1:04', status: 'drift',   kept: false, text: 'Oh — that new app I saw on Twitter last week...' },
  { time: '3:19', dur: '0:44', status: 'ontopic', kept: true,  text: 'The Pomodoro method works because it makes time blindness visible.' },
]

const FEATURES = [
  { icon: ShieldCheck, label: 'Privacy first',      desc: 'All AI runs in your browser via WebAssembly.' },
  { icon: Brain,       label: 'ADHD mode',           desc: 'One decision at a time, progress tracking.' },
  { icon: Clock,       label: 'Word timestamps',     desc: 'Precise cuts at the word level.' },
  { icon: VolumeX,     label: 'Profanity filter',    desc: 'Mute individual words, not whole segments.' },
  { icon: ArrowUpDown, label: 'Segment reorder',     desc: 'Drag related topics together.' },
  { icon: Package,     label: 'Export package',      desc: 'Audio · SRT · Chapters · Show notes.' },
]

export default function Landing({ session }: Props) {
  const nav       = useNavigate()
  const demoRef   = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)

  return (
    <div className={styles.root}>

      {/* Background orbs */}
      <div className={styles.orbs} aria-hidden>
        <div className={styles.orbSky}  />
        <div className={styles.orbBurg} />
        <div className={styles.orbSteel} />
      </div>

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <div className={styles.logoMark}>FC</div>
          <span className={styles.logoText}>FocusClip AI</span>
        </div>

        <div className={styles.navLinks}>
          <button className={styles.navLink} onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            Demo
          </button>
          <a className={styles.navLink} href="#features">Features</a>
        </div>

        <div className={styles.navRight}>
          {session
            ? <button className={styles.btnPrimary} onClick={() => nav('/dashboard')}>
                Go to dashboard <ArrowRight size={14} />
              </button>
            : <>
                <button className={styles.btnGhost} onClick={() => nav('/auth?tab=signin')}>Sign in</button>
                <button className={styles.btnPrimary} onClick={() => nav('/auth?tab=signup')}>
                  Get started <ArrowRight size={14} />
                </button>
              </>
          }
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.pillLabel}>
          <span>—</span> AI-powered podcast editing <span>—</span>
        </div>

        <h1 className={styles.heroTitle}>
          Cut the drift,<br />
          <em>keep the focus.</em>
        </h1>

        <p className={styles.heroSub}>
          FocusClip detects off-topic segments in your podcast or video, lets you review
          and reorder them, then exports a tighter cut — entirely in your browser.
        </p>

        <div className={styles.heroBtns}>
          <button className={styles.btnHero} onClick={() => nav('/auth?tab=signup')}>
            Get started free <ArrowRight size={16} />
          </button>
          <button
            className={styles.btnHeroGhost}
            onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Play size={15} /> See how it works
          </button>
        </div>

        {/* Mini editor preview */}
        <div className={styles.heroPreview}>
          <div className={styles.previewBar}>
            <div className={styles.dots}>
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#febc2e' }} />
              <span style={{ background: '#28c840' }} />
            </div>
            <span className={styles.previewTitle}>FocusClip AI — podcast-ep12.mp3 · 87% focused</span>
            <span />
          </div>

          <div className={styles.previewWave}>
            {Array.from({ length: 90 }).map((_, i) => {
              const h = 10 + Math.abs(Math.sin(i * 0.4 + 1) * 22) + Math.abs(Math.sin(i * 0.17) * 14)
              const p = i / 90
              const cls = p > 0.04 && p < 0.09 ? 'drift'
                : p > 0.13 && p < 0.20 ? 'drift'
                : p > 0.20 && p < 0.28 ? 'removed'
                : p > 0.37 && p < 0.41 ? 'pebble'
                : 'ontopic'
              return (
                <div
                  key={i}
                  className={`${styles.bar} ${styles[cls]}`}
                  style={{ height: `${Math.max(4, Math.round(h))}px` }}
                />
              )
            })}
            <div className={styles.playhead} />
          </div>

          <div className={styles.previewSegs}>
            {SAMPLE_SEGMENTS.map((s, i) => (
              <div key={i} className={`${styles.pseg} ${styles[`pseg_${s.status}`]} ${!s.kept ? styles.psegRemoved : ''}`}>
                <span className={styles.pts}>{s.time}</span>
                <span className={`${styles.pchip} ${styles[`pchip_${s.status}`]}`}>
                  {s.status === 'ontopic' ? 'On-topic' : 'Drift'}
                </span>
                <span className={`${styles.ptxt} ${!s.kept ? styles.ptxtStruck : ''}`}>{s.text}</span>
                <span className={styles.pdur}>{s.dur}</span>
              </div>
            ))}
          </div>

          <div className={styles.previewLegend}>
            <span><i style={{ background: 'var(--sky)' }} />On-topic</span>
            <span><i style={{ background: 'var(--burg)' }} />Drift</span>
            <span><i style={{ background: 'var(--pebble)' }} />Profanity</span>
          </div>
        </div>
      </section>

      {/* ── DEMO — 3 vertical slides ─────────────────── */}
      <section className={styles.demoSection} ref={demoRef} id="demo">
        <div className={styles.sectionPill}>
          <span>—</span> See it in action <span>—</span>
        </div>
        <h2 className={styles.sectionTitle}>
          From messy recording<br /><em>to polished episode.</em>
        </h2>

        <div className={styles.demoLayout}>

          {/* Left — slide navigator */}
          <div className={styles.slideNav}>
            {SLIDES.map((sl, i) => (
              <button
                key={i}
                className={`${styles.slideNavBtn} ${i === slide ? styles.slideNavActive : ''}`}
                onClick={() => setSlide(i)}
              >
                <span className={styles.slideNavNum}>{sl.step}</span>
                <span className={styles.slideNavLabel}>{sl.title}</span>
                <div className={styles.slideNavBar} />
              </button>
            ))}
          </div>

          {/* Right — 3 vertical slides */}
          <div className={styles.slidesContainer}>
            {SLIDES.map((sl, i) => {
              const Icon = sl.icon
              return (
                <div
                  key={i}
                  className={`${styles.slide} ${i === slide ? styles.slideActive : ''}`}
                >
                  <div className={styles.slideHeader}>
                    <div className={styles.slideIconWrap}>
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className={styles.slideStep}>{sl.step}</div>
                      <h3 className={styles.slideTitle}>{sl.title}</h3>
                    </div>
                  </div>
                  <p className={styles.slideDesc}>{sl.desc}</p>

                  {/* Slide-specific visual */}
                  {i === 0 && <SlideUpload />}
                  {i === 1 && <SlideAnalysis />}
                  {i === 2 && <SlideExport />}

                  {/* Next slide button */}
                  {i < SLIDES.length - 1 && (
                    <button className={styles.slideNext} onClick={() => setSlide(i + 1)}>
                      Next step <ChevronDown size={14} />
                    </button>
                  )}
                  {i === SLIDES.length - 1 && (
                    <button className={styles.slideCta} onClick={() => nav('/auth?tab=signup')}>
                      Get started free <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section className={styles.featSection} id="features">
        <div className={styles.sectionPill}><span>—</span> Features <span>—</span></div>
        <h2 className={styles.sectionTitle}>Built for creators<br /><em>who think differently.</em></h2>
        <div className={styles.featGrid}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div className={styles.featCard} key={label}>
              <div className={styles.featIcon}><Icon size={18} strokeWidth={1.5} /></div>
              <div className={styles.featName}>{label}</div>
              <div className={styles.featDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to <em>focus?</em></h2>
        <p className={styles.ctaSub}>Join creators who save hours editing every episode.</p>
        <button className={styles.btnHero} onClick={() => nav('/auth?tab=signup')}>
          Get started free <ArrowRight size={16} />
        </button>
        <p className={styles.ctaNote}>No credit card · No uploads · No API keys</p>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <div className={styles.logoMarkSm}>FC</div>
          <span>FocusClip AI</span>
        </div>
        <div className={styles.footerLinks}>
          <button className={styles.footerLink} onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })}>Demo</button>
          <a className={styles.footerLink} href="#features">Features</a>
        </div>
        <span className={styles.footerCopy}>© 2025 FocusClip AI</span>
      </footer>

    </div>
  )
}

/* ── Slide sub-components ─────────────────────────────────── */

function SlideUpload() {
  return (
    <div className={styles.slideVisual}>
      <div className={styles.dropzone}>
        <Upload size={24} strokeWidth={1.5} color="var(--burg)" />
        <div className={styles.dropzoneText}>
          <strong>Drop your file here</strong>
          <span>MP4, WebM, MP3, WAV, M4A · up to 200 MB</span>
        </div>
      </div>
      <div className={styles.topicRow}>
        <label>Core topic</label>
        <div className={styles.topicInput}>Focus systems for ADHD brains</div>
      </div>
      <div className={styles.chipRow}>
        {['Focus systems', 'ADHD strategies', 'Deep work'].map(t => (
          <div key={t} className={styles.chipKeep}>{t}</div>
        ))}
        {['Newsletter promo', 'App mention'].map(t => (
          <div key={t} className={styles.chipRemove}>✕ {t}</div>
        ))}
      </div>
    </div>
  )
}

function SlideAnalysis() {
  return (
    <div className={styles.slideVisual}>
      <div className={styles.analysisBars}>
        {Array.from({ length: 48 }).map((_, i) => {
          const h = 8 + Math.abs(Math.sin(i * 0.5) * 24) + Math.abs(Math.sin(i * 0.2) * 12)
          const p = i / 48
          const cls = p > 0.08 && p < 0.18 ? styles.barDrift
            : p > 0.38 && p < 0.50 ? styles.barDrift
            : styles.barOntopic
          return <div key={i} className={`${styles.abar} ${cls}`} style={{ height: `${Math.max(4, Math.round(h))}px` }} />
        })}
      </div>
      <div className={styles.scoreRows}>
        {[
          { label: 'Topic match',  pct: 82, color: 'var(--sky)' },
          { label: 'Rapport',      pct: 45, color: 'var(--pebble)' },
          { label: 'Duration',     pct: 30, color: 'var(--burg)' },
        ].map(r => (
          <div key={r.label} className={styles.scoreRow}>
            <span>{r.label}</span>
            <div className={styles.scoreTrack}>
              <div className={styles.scoreFill} style={{ width: `${r.pct}%`, background: r.color }} />
            </div>
            <span>{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideExport() {
  return (
    <div className={styles.slideVisual}>
      <div className={styles.exportCompare}>
        <div className={styles.compareCol}>
          <span className={styles.compareLabel}>Original</span>
          <span className={styles.compareVal} style={{ color: 'var(--pebble)' }}>18:42</span>
          <span className={styles.compareSub}>6 segments</span>
        </div>
        <ArrowRight size={18} color="var(--burg)" />
        <div className={styles.compareCol}>
          <span className={styles.compareLabel}>Final cut</span>
          <span className={styles.compareVal} style={{ color: 'var(--sky)' }}>14:05</span>
          <span className={styles.compareSub}>4 kept · 87% focused</span>
        </div>
      </div>
      <div className={styles.exportFormats}>
        {['Edited MP3', 'Captions .srt', 'Chapters .txt', 'Show notes'].map(f => (
          <div key={f} className={styles.exportFormat}>
            <Download size={11} strokeWidth={2} />
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}