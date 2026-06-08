'use client'

import { signInWithGoogle } from '../lib/auth'

export default function SignInLink() {
  return (
    <button
      onClick={() => signInWithGoogle()}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body), sans-serif',
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        padding: 0,
      }}
    >
      Already have an account?{' '}
      <span style={{ color: '#FFE600', fontWeight: 600 }}>SIGN IN →</span>
    </button>
  )
}
