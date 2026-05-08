import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Landing   from '@/pages/Landing'
import Auth      from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Editor    from '@/pages/Editor'

function PrivateRoute({ children, session }: { children: React.ReactNode; session: Session | null }) {
  if (session === undefined as unknown) return <div style={{ height: '100vh', background: 'var(--dark-bg)' }} />
  return session ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing session={session ?? null} />} />
        <Route path="/auth"       element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/dashboard"  element={<PrivateRoute session={session ?? null}><Dashboard /></PrivateRoute>} />
        <Route path="/editor/:id" element={<PrivateRoute session={session ?? null}><Editor /></PrivateRoute>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}