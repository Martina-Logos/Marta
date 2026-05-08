import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import s from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger' | 'steel'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  icon?:    React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, Props>(({
  variant    = 'primary',
  size       = 'md',
  loading    = false,
  icon,
  iconRight,
  fullWidth  = false,
  children,
  disabled,
  className,
  ...rest
}, ref) => {
  return (
    <button
      ref={ref}
      className={[
        s.btn,
        s[variant],
        s[size],
        fullWidth ? s.fullWidth : '',
        loading   ? s.loading   : '',
        className ?? '',
      ].join(' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={s.spinner} aria-hidden />}
      {!loading && icon && <span className={s.iconLeft}>{icon}</span>}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className={s.iconRight}>{iconRight}</span>}
    </button>
  )
})

Button.displayName = 'Button'
export default Button