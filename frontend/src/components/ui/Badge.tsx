import s from './Badge.module.css'

type Status = 'ontopic' | 'drift' | 'profane' | 'review'

interface Props {
  status:    Status
  label?:    string
  size?:     'sm' | 'md'
  className?: string
}

const LABELS: Record<Status, string> = {
  ontopic: 'On-topic',
  drift:   'Drift',
  profane: 'Profanity',
  review:  'Review',
}

export default function Badge({ status, label, size = 'md', className }: Props) {
  return (
    <span className={[s.badge, s[status], size === 'sm' ? s.small : '', className ?? ''].join(' ')}>
      {label ?? LABELS[status]}
    </span>
  )
}