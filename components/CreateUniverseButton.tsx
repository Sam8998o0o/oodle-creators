'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function CreateUniverseButton() {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setSignedIn(!!user))
  }, [])

  return (
    <button
      type="button"
      onClick={() =>
        signedIn
          ? router.push('/universes/create')
          : window.dispatchEvent(new Event('open-sign-in-modal'))
      }
      style={{
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: 8,
        color: '#07070d',
        background: '#FFE600',
        border: 'none',
        padding: '12px 18px',
        letterSpacing: 1,
        cursor: 'pointer',
        transition: 'opacity 150ms',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      ✦ CREATE UNIVERSE
    </button>
  )
}
