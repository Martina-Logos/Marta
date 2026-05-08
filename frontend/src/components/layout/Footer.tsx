import { useNavigate } from 'react-router-dom'
import s from './Footer.module.css'

export default function Footer() {
  const nav = useNavigate()
  return (
    <footer className={s.footer}>
      <div className={s.logoGroup}>
        <div className={s.mark}>FC</div>
        <span className={s.name}>FocusClip AI</span>
      </div>
      <div className={s.links}>
        <a href="#demo"     className={s.link}>Demo</a>
        <a href="#features" className={s.link}>Features</a>
        <button           className={s.link} onClick={() => nav('/auth?tab=signup')}>Get started</button>
      </div>
      <span className={s.copy}>© {new Date().getFullYear()} FocusClip AI</span>
    </footer>
  )
}