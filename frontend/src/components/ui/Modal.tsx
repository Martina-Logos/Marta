import { useEffect } from 'react'
import { X } from 'lucide-react'
import s from './Modal.module.css'

interface Props {
  open:      boolean
  onClose:   () => void
  title?:    string
  subtitle?: string
  width?:    number
  children:  React.ReactNode
  side?:     boolean   // slide in from right
}

export default function Modal({ open, onClose, title, subtitle, width = 480, children, side = false }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div
      className={`${s.overlay} ${open ? s.open : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${s.panel} ${side ? s.side : s.center}`}
        style={side ? undefined : { maxWidth: width }}
      >
        {(title || subtitle) && (
          <div className={s.head}>
            <div>
              {title    && <h2 className={s.title}>{title}</h2>}
              {subtitle && <p  className={s.subtitle}>{subtitle}</p>}
            </div>
            <button className={s.close} onClick={onClose} aria-label="Close">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        )}
        <div className={s.body}>{children}</div>
      </div>
    </div>
  )
}