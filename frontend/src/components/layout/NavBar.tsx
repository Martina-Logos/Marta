import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Info, LayoutDashboard, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AboutModal from './AboutModal'
import Button from '@/components/ui/Button'
import s from './NavBar.module.css'

interface Props { session: Session | null }

export default function NavBar({ session }: Props) {
  const nav      = useNavigate()
  const { pathname } = useLocation()
  const [about,    setAbout]    = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Shrink nav on scroll (landing page only)
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    nav('/')
  }

  const isLanding  = pathname === '/'
  const isEditor   = pathname.startsWith('/editor')
  const isDark     = isLanding || pathname === '/auth'

  return (
    <>
      <nav className={[
        s.nav,
        isDark   ? s.dark    : s.light,
        scrolled ? s.compact : '',
      ].join(' ')}>

        {/* Logo */}
        <button className={s.logo} onClick={() => nav('/')}>
          <div className={s.logoMark}>FC</div>
          {!isEditor && <span className={s.logoText}>FocusClip AI</span>}
        </button>

        {/* Centre links — landing only */}
        {isLanding && (
          <div className={s.centreLinks}>
            <a className={s.link} href="#demo">Demo</a>
            <a className={s.link} href="#features">Features</a>
          </div>
        )}

        {/* Editor file name breadcrumb */}
        {isEditor && (
          <div className={s.breadcrumb}>
            <span className={s.breadcrumbFile} id="editorFileName">
              — no file loaded —
            </span>
          </div>
        )}

        {/* Right side */}
        <div className={s.right}>

          {/* About icon — only when authenticated */}
          {session && (
            <button
              className={s.aboutBtn}
              onClick={() => setAbout(true)}
              title="About & features"
              aria-label="Open about panel"
            >
              <Info size={16} strokeWidth={1.75} />
            </button>
          )}

          {session ? (
            <>
              {!isEditor && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LayoutDashboard size={14} />}
                  onClick={() => nav('/dashboard')}
                >
                  Dashboard
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<LogOut size={14} />}
                onClick={signOut}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav('/auth?tab=signin')}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={() => nav('/auth?tab=signup')}>
                Get started
              </Button>
            </>
          )}
        </div>
      </nav>

      {session && <AboutModal open={about} onClose={() => setAbout(false)} />}
    </>
  )
}