import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, BarChart2, FileAudio, Trash2 } from 'lucide-react'
import { supabase, type Project } from '@/lib/supabase'
import { useAuthStore } from '@/store'
import NavBar from '@/components/layout/NavBar'
import Button from '@/components/ui/Button'
import s from './Dashboard.module.css'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const ss = Math.floor(seconds % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function Dashboard() {
  const nav              = useNavigate()
  const { session }      = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (!error && data) setProjects(data as Project[])
      setLoading(false)
    }
    load()
  }, [])

  async function deleteProject(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this project?')) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const statusColor: Record<Project['status'], string> = {
    draft:      s.statusDraft,
    processing: s.statusProcessing,
    complete:   s.statusComplete,
  }

  return (
    <div className={s.root}>
      <NavBar session={session} />

      <main className={s.main}>
        <div className={s.header}>
          <div>
            <h1 className={s.pageTitle}>Projects</h1>
            <p className={s.pageSub}>Your podcast and video editing projects</p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => nav('/editor/new')}
          >
            New project
          </Button>
        </div>

        {loading && (
          <div className={s.loadingGrid}>
            {[1,2,3].map(i => <div key={i} className={s.skeleton} />)}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className={s.empty}>
            <FileAudio size={40} strokeWidth={1} color="var(--pebble)" />
            <h2>No projects yet</h2>
            <p>Upload your first audio or video file to get started.</p>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => nav('/editor/new')}
            >
              Create first project
            </Button>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className={s.grid}>
            {projects.map(project => (
              <div
                key={project.id}
                className={s.card}
                onClick={() => nav(`/editor/${project.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && nav(`/editor/${project.id}`)}
              >
                <div className={s.cardHeader}>
                  <div className={s.cardIcon}>
                    <FileAudio size={18} strokeWidth={1.5} />
                  </div>
                  <span className={`${s.status} ${statusColor[project.status]}`}>
                    {project.status}
                  </span>
                </div>

                <h3 className={s.cardTitle}>{project.title}</h3>

                <div className={s.cardMeta}>
                  {project.duration > 0 && (
                    <span className={s.metaItem}>
                      <Clock size={11} /> {formatDuration(project.duration)}
                    </span>
                  )}
                  {project.focus_score > 0 && (
                    <span className={s.metaItem}>
                      <BarChart2 size={11} /> {project.focus_score}% focused
                    </span>
                  )}
                  <span className={s.metaItem}>
                    {formatDate(project.updated_at)}
                  </span>
                </div>

                <button
                  className={s.deleteBtn}
                  onClick={e => deleteProject(project.id, e)}
                  aria-label="Delete project"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}