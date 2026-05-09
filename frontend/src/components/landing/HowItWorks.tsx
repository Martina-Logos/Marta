import { Upload, Cpu, Download } from 'lucide-react'
import s from './HowItWorks.module.css'

const STEPS = [
  {
    num:   '01',
    Icon:  Upload,
    title: 'Upload your file',
    body:  'Drop any audio or video file up to 200 MB. Describe your episode topic and confirm the AI-detected sub-topics before analysis begins.',
    tag:   'Runs locally in browser',
    color: 'sky',
  },
  {
    num:   '02',
    Icon:  Cpu,
    title: 'AI detects drift',
    body:  'Whisper transcribes with word-level timestamps. Semantic embeddings score every segment against your topic — flagging drift, profanity, and rapport moments automatically.',
    tag:   'No API calls · Private',
    color: 'burg',
  },
  {
    num:   '03',
    Icon:  Download,
    title: 'Review and export',
    body:  'Approve, remove, or reorder segments. Mute individual profane words. Export a clean cut, SRT captions, chapter markers, and AI-written show notes.',
    tag:   '5 export formats',
    color: 'steel',
  },
]

export default function HowItWorks() {
  return (
    <section className={s.section} id="how">
      <p className={s.pill}><span>—</span> How it works <span>—</span></p>
      <h2 className={s.title}>Simple by design.</h2>
      <p className={s.sub}>No complex timelines. No manual scrubbing. FocusClip does the heavy lifting.</p>

      <div className={s.grid}>
        {STEPS.map(step => {
          const Icon = step.Icon
          return (
            <div key={step.num} className={`${s.card} ${s[`card_${step.color}`]}`}>
              <div className={s.topBar} />
              <span className={s.num}>{step.num}</span>
              <div className={`${s.iconWrap} ${s[`icon_${step.color}`]}`}>
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className={s.cardTitle}>{step.title}</h3>
              <p className={s.cardBody}>{step.body}</p>
              <span className={s.tag}>{step.tag}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}