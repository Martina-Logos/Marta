import { useState, useRef, useCallback } from 'react'
import { useNavigate }   from 'react-router-dom'
import { Upload, CheckCircle, Circle, Loader, ChevronRight, X } from 'lucide-react'
import { supabase }           from '@/lib/supabase'
import { transcribeFile }     from '@/lib/whisper'
import { useEditorStore, useProcessingStore, useAuthStore } from '@/store'
import Waveform        from './Waveform'
import TranscriptPanel from './TranscriptPanel'
import ExportPanel     from './ExportPanel'
import Button          from '@/components/ui/Button'
import Toggle          from '@/components/ui/Toggle'
import s from './EditorLayout.module.css'

interface Props { projectId: string }

type SetupStep = 'upload' | 'topic' | 'processing' | 'editor'

const ACCEPTED = '.mp3,.wav,.m4a,.mp4,.webm,.ogg'
const MAX_MB   = 200

/* ─────────────────────────────────────────────────────────────── */

export default function EditorLayout({ projectId }: Props) {
  const nav             = useNavigate()
  const { user }        = useAuthStore()
  const editor          = useEditorStore()
  const processing      = useProcessingStore()

  // Determine initial step
  const hasSegments    = editor.segments.length > 0
  const [step, setStep] = useState<SetupStep>(
    projectId !== 'new' && hasSegments ? 'editor' : 'upload'
  )

  const [dragOver, setDragOver]  = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Step 1: file validation and selection ─────────────────── */

  function validateFile(f: File): string | null {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4',
                        'video/mp4', 'video/webm', 'audio/ogg']
    if (!validTypes.includes(f.type) && !f.name.match(/\.(mp3|wav|m4a|mp4|webm|ogg)$/i)) {
      return 'Unsupported file type. Use MP3, WAV, M4A, MP4, or WebM.'
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_MB} MB.`
    }
    return null
  }

  function pickFile(f: File) {
    const err = validateFile(f)
    if (err) { setFileError(err); return }
    setFileError(null)
    editor.setFile(f)
    editor.setProject(projectId === 'new' ? '' : projectId, f.name.replace(/\.[^.]+$/, ''))
    setStep('topic')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }, [])

  /* ── Step 3: run full pipeline ─────────────────────────────── */

  async function runPipeline() {
    if (!editor.file) return
    setStep('processing')
    processing.reset()

    try {
      /* 1 – Transcribe */
      processing.setStep('transcribing', 'Transcribing audio…', 10)

      const result = await transcribeFile(
        editor.file,
        (label, pct) => processing.setStep('transcribing', label, 10 + pct * 0.5),
      )

      /* 2 – Diarise */
      processing.setStep('analysing', 'Identifying speakers…', 60)

      const diarWorker = new Worker(
        new URL('../../workers/diarization.worker.ts', import.meta.url),
        { type: 'module' }
      )

      const diarised = await new Promise<any[]>((res, rej) => {
        diarWorker.onmessage = e => {
          if (e.data.type === 'result') { diarWorker.terminate(); res(e.data.data) }
          if (e.data.type === 'error')  { diarWorker.terminate(); rej(new Error(e.data.message)) }
        }
        diarWorker.postMessage({ type: 'diarise', words: result.words })
      })

      /* 3 – Score segments */
      processing.setStep('analysing', 'Scoring segments…', 65)

      const segWorker = new Worker(
        new URL('../../workers/segmentation.worker.ts', import.meta.url),
        { type: 'module' }
      )

      const scored = await new Promise<any[]>((res, rej) => {
        segWorker.onmessage = e => {
          if (e.data.type === 'progress') {
            processing.setStep('analysing', e.data.data.step, 65 + e.data.data.percent * 0.3)
          }
          if (e.data.type === 'result') { segWorker.terminate(); res(e.data.data) }
          if (e.data.type === 'error')  { segWorker.terminate(); rej(new Error(e.data.message)) }
        }
        // Attach position index to each diarised segment
        const segmentsToScore = diarised.map((d, i) => ({ ...d, id: crypto.randomUUID(), position: i }))
        segWorker.postMessage({ type: 'score', segments: segmentsToScore, coreTopic: editor.coreTopic })
      })

      processing.setStep('analysing', 'Saving…', 96)

      /* 4 – Save to Supabase */
      let pid = projectId === 'new' ? null : projectId

      if (!pid && user) {
        const { data: proj } = await supabase.from('projects').insert({
          user_id:     user.id,
          title:       editor.projectTitle || editor.file.name,
          duration:    result.duration,
          focus_score: Math.round((scored.filter((s: any) => s.kept).length / scored.length) * 100),
          status:      'complete',
        }).select().single()
        pid = proj?.id ?? null
        if (pid) editor.setProject(pid, proj?.title ?? '')
      }

      if (pid) {
        await supabase.from('segments').delete().eq('project_id', pid)
        await supabase.from('segments').insert(
          scored.map((sg: any) => ({ ...sg, project_id: pid, id: crypto.randomUUID() }))
        )
        nav(`/editor/${pid}`, { replace: true })
      }

      editor.setSegments(scored)
      processing.setStep('done', 'Complete', 100)
      setStep('editor')

    } catch (err: any) {
      processing.setError(err?.message ?? 'Something went wrong.')
    }
  }

  /* ──────────────────────────────────────────────────────────── */

  if (step === 'upload') return (
    <UploadStep
      dragOver={dragOver}
      error={fileError}
      inputRef={fileInputRef}
      onDrop={onDrop}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }}
      onBrowse={() => fileInputRef.current?.click()}
    />
  )

  if (step === 'topic') return (
    <TopicStep
      file={editor.file!}
      topic={editor.coreTopic}
      onTopicChange={editor.setCoreTopic}
      onBack={() => { editor.setFile(null as any); setStep('upload') }}
      onStart={runPipeline}
    />
  )

  if (step === 'processing') return (
    <ProcessingStep
      label={processing.stepLabel}
      progress={processing.progress}
      error={processing.error}
      fileName={editor.file?.name ?? ''}
      onCancel={() => { processing.reset(); setStep('upload') }}
    />
  )

  /* ── Editor view ─────────────────────────────────────────── */
  return (
    <div className={s.editorRoot}>
      {/* Top: ADHD toggle + waveform */}
      <div className={s.topBar}>
        <Toggle
          checked={editor.adhdMode}
          onChange={editor.toggleAdhd}
          label="ADHD Mode"
          size="sm"
        />
      </div>

      <Waveform file={editor.file} segments={editor.segments} />

      <div className={s.editorBody}>
        <TranscriptPanel />
        <ExportPanel />
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────── */

function UploadStep({ dragOver, error, inputRef, onDrop, onDragOver, onDragLeave, onChange, onBrowse }: {
  dragOver:    boolean
  error:       string | null
  inputRef:    React.RefObject<HTMLInputElement>
  onDrop:      React.DragEventHandler
  onDragOver:  React.DragEventHandler
  onDragLeave: React.DragEventHandler
  onChange:    React.ChangeEventHandler<HTMLInputElement>
  onBrowse:    () => void
}) {
  return (
    <div className={s.setupScreen}>
      <div className={s.setupCard}>
        <h2 className={s.setupTitle}>New project</h2>
        <p  className={s.setupSub}>Drop your audio or video file to get started.</p>

        <div
          className={`${s.dropzone} ${dragOver ? s.dropzoneOver : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={onBrowse}
        >
          <div className={s.dropIcon}><Upload size={24} strokeWidth={1.5} /></div>
          <p className={s.dropMain}>Drop your file here</p>
          <p className={s.dropSub}>or click to browse — up to {MAX_MB} MB</p>
          <div className={s.dropFormats}>
            <span>MP4</span><span>WebM</span><span>MP3</span><span>WAV</span><span>M4A</span>
          </div>
          <input
            ref={inputRef} type="file" accept={ACCEPTED}
            style={{ display: 'none' }} onChange={onChange}
          />
        </div>

        {error && (
          <div className={s.fileError}>
            <X size={14} /> {error}
          </div>
        )}

        <p className={s.privacyNote}>
          <CheckCircle size={13} color="var(--steel)" />
          All processing runs locally in your browser. Files are never uploaded for AI analysis.
        </p>
      </div>
    </div>
  )
}

function TopicStep({ file, topic, onTopicChange, onBack, onStart }: {
  file:           File
  topic:          string
  onTopicChange:  (t: string) => void
  onBack:         () => void
  onStart:        () => void
}) {
  return (
    <div className={s.setupScreen}>
      <div className={s.setupCard}>
        <div className={s.setupStepLabel}>Step 1 of 1 — Topic setup</div>
        <h2 className={s.setupTitle}>What's this episode about?</h2>
        <p  className={s.setupSub}>
          FocusClip uses this to detect segments that drift away from your main topic.
        </p>

        <div className={s.fileChip}>
          <Upload size={13} strokeWidth={2} color="var(--steel-dark)" />
          <span>{file.name}</span>
          <span className={s.fileSize}>({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
        </div>

        <div className={s.fieldWrap}>
          <label className={s.fieldLabel} htmlFor="topic-input">Core topic</label>
          <input
            id="topic-input"
            type="text"
            className={s.fieldInput}
            placeholder="e.g. Productivity tips for remote workers"
            value={topic}
            onChange={e => onTopicChange(e.target.value)}
            autoFocus
          />
          <p className={s.fieldHint}>Be specific — the more precise, the better the detection.</p>
        </div>

        <div className={s.topicActions}>
          <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
          <Button
            variant="primary"
            size="md"
            iconRight={<ChevronRight size={15} />}
            disabled={topic.trim().length < 3}
            onClick={onStart}
          >
            Start analysing
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProcessingStep({ label, progress, error, fileName, onCancel }: {
  label:    string
  progress: number
  error:    string | null
  fileName: string
  onCancel: () => void
}) {
  const steps = [
    { key: 'loading',      text: 'Loading model' },
    { key: 'transcribing', text: 'Transcribing' },
    { key: 'analysing',    text: 'Analysing topics' },
  ]

  const activeIdx =
    progress < 10 ? 0 :
    progress < 60 ? 1 : 2

  return (
    <div className={s.setupScreen}>
      <div className={s.processingCard}>
        <div className={`${s.processingIcon} ${!error ? s.spinning : s.errorIcon}`}>
          <Loader size={26} strokeWidth={1.75} />
        </div>

        <h2 className={s.processingTitle}>
          {error ? 'Something went wrong' : 'Analysing your file…'}
        </h2>
        <p className={s.processingFile}>{fileName}</p>

        {error ? (
          <>
            <div className={s.errorBox}>{error}</div>
            <Button variant="outline" size="sm" onClick={onCancel}>Try again</Button>
          </>
        ) : (
          <>
            <div className={s.progressWrap}>
              <div className={s.progressHead}>
                <span>{label}</span>
                <span className={s.progressPct}>{progress}%</span>
              </div>
              <div className={s.progressTrack}>
                <div className={s.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={s.stepList}>
              {steps.map((st, i) => {
                const done   = i < activeIdx
                const active = i === activeIdx
                return (
                  <div key={st.key} className={`${s.stepItem} ${done ? s.stepDone : active ? s.stepActive : s.stepPending}`}>
                    <span className={s.stepDot}>
                      {done
                        ? <CheckCircle size={14} strokeWidth={2} />
                        : active
                          ? <Loader size={14} strokeWidth={2} className={s.spinIcon} />
                          : <Circle size={14} strokeWidth={1.5} />}
                    </span>
                    <span>{st.text}</span>
                  </div>
                )
              })}
            </div>

            <p className={s.wasmNote}>
              AI models run locally in your browser. First run downloads the model (~150 MB) and caches it.
            </p>
            <button className={s.cancelBtn} onClick={onCancel}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}