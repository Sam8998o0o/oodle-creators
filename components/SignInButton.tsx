'use client'

import { signInWithGoogle } from '../lib/auth'

export default function SignInButton() {
  return (
    <button
      onClick={() => signInWithGoogle()}
      className="pixel-font text-xs px-4 py-2 border transition-all hover:opacity-80"
      style={{ borderColor: 'var(--y)', color: 'var(--y)', background: 'transparent', cursor: 'pointer' }}
    >
      SIGN IN
    </button>
  )
}
