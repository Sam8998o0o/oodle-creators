'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SignInLink() {
  const [checked,  setChecked]  = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    // Set initial state from the current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSignedIn(!!user)
      setChecked(true)
    })

    // Keep in sync with auth changes (e.g. sign-out re-shows the link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user)
      setChecked(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Render nothing until auth state is known, and hide completely when signed in
  if (!checked || signedIn) return null

  return (
    <button
      onClick={() => window.dispatchEvent(new Event('open-sign-in-modal'))}
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
