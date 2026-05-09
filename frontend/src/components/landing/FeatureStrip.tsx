import { ShieldCheck, Brain, Clock, VolumeX, ArrowUpDown, Package } from 'lucide-react'
import s from './FeatureStrip.module.css'

const FEATURES = [
  {
    Icon:  ShieldCheck,
    label: 'Privacy first',
    desc:  'All AI runs in your browser via WebAssembly. Nothing is uploaded.',
  },
  {
    Icon:  Brain,
    label: 'ADHD mode',
    desc:  'One decision at a time. Progress tracking. Colour-coded segments.',
  },
  {
    Icon:  Clock,
    label: 'Word timestamps',
    desc:  'Precise cuts at the word level via Whisper WASM.',
  },
  {
    Icon:  VolumeX,
    label: 'Profanity filter',
    desc:  'Mute individual words, not whole segments.',
  },
  {
    Icon:  ArrowUpDown,
    label: 'Segment reorder',
    desc:  'Drag related topics together regardless of recording order.',
  },
  {
    Icon:  Package,
    label: 'Export package',
    desc:  'Audio · SRT captions · Chapter markers · Show notes.',
  },
]

export default function FeatureStrip() {
  return (
    <section className={s.section} id="features">
      <p className={s.pill}><span>—</span> Features <span>—</span></p>
      <h2 className={s.title}>
        Built for creators<br /><em>who think differently.</em>
      </h2>
      <div className={s.grid}>
        {FEATURES.map(({ Icon, label, desc }) => (
          <div className={s.card} key={label}>
            <div className={s.iconWrap}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <h3 className={s.name}>{label}</h3>
            <p  className={s.desc}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}