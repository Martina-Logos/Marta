import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'
import s from './AuthForm.module.css'

export default function AuthForm() {
  const [params] = useSearchParams()
  const initial  = params.get('tab') === 'signin' ? 'signin' : 'signup'
  const [tab, setTab] = useState<'signup' | 'signin'>(initial)

  return (
    <div className={s.card}>
      <div className={s.head}>
        <div className={s.logoMark}>FC</div>
        <h1 className={s.title}>FocusClip AI</h1>
        <p className={s.sub}>Cut the drift, keep the focus.</p>
      </div>

      <div className={s.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'signup'}
          className={`${s.tab} ${tab === 'signup' ? s.tabActive : ''}`}
          onClick={() => setTab('signup')}
        >
          Create account
        </button>
        <button
          role="tab"
          aria-selected={tab === 'signin'}
          className={`${s.tab} ${tab === 'signin' ? s.tabActive : ''}`}
          onClick={() => setTab('signin')}
        >
          Sign in
        </button>
      </div>

      <div className={s.body}>
        {tab === 'signup'
          ? <SignUpForm onSwitch={() => setTab('signin')} />
          : <SignInForm onSwitch={() => setTab('signup')} />
        }
      </div>
    </div>
  )
}