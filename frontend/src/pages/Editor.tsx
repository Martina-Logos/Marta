import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Project } from '../lib/supabase'
import { useEditorStore, useAuthStore } from '../store'
import NavBar        from '../components/layout/NavBar'
import EditorLayout  from '../components/editor/EditorLayout'
import s from './Editor.module.css'

export default function Editor() {
  const { id }         = useParams<{ id: string }>()
  const nav            = useNavigate()
  const { session }    = useAuthStore()
  const { setProject, setSegments, reset } = useEditorStore()

  const [loading, setLoading] = useState(id !== 'new')
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    reset()

    if (id === 'new') return

    async function loadProject() {
      setLoading(true)
      try {
        // Load project
        const { data: project, error: pErr } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single()

        if (pErr || !project) {
          setError('Project not found.')
          return
        }

        setProject(project.id, project.title)

        // Update browser tab title
        const el = document.getElementById('editorFileName')
        if (el) el.textContent = (project as Project).title

        // Load segments
        const { data: segments, error: sErr } = await supabase
          .from('segments')
          .select('*')
          .eq('project_id', id)
          .order('position')

        if (!sErr && segments) setSegments(segments as never)

      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }

    loadProject()

    return () => reset()
  }, [id])

  if (loading) {
    return (
      <div className={s.loadingScreen}>
        <div className={s.spinner} />
        <p>Loading project…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={s.errorScreen}>
        <p>{error}</p>
        <button onClick={() => nav('/dashboard')}>Back to dashboard</button>
      </div>
    )
  }

  return (
    <div className={s.root}>
      <NavBar session={session} />
      <EditorLayout projectId={id ?? 'new'} />
    </div>
  )
}