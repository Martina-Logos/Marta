import s from './Toggle.module.css'

interface Props {
  checked:   boolean
  onChange:  () => void
  label?:    string
  size?:     'sm' | 'md'
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, size = 'md', disabled }: Props) {
  return (
    <label className={`${s.wrap} ${disabled ? s.disabled : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`${s.track} ${s[size]} ${checked ? s.on : ''}`}
        onClick={onChange}
        disabled={disabled}
      >
        <span className={s.knob} />
      </button>
      {label && <span className={s.label}>{label}</span>}
    </label>
  )
}