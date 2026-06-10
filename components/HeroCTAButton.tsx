'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function HeroCTAButton() {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSignedIn(!!user)
    })
  }, [])

  function handleClick() {
    if (signedIn) {
      router.push('/create')
    } else {
      window.dispatchEvent(new Event('open-sign-in-modal'))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: 11,
        color: '#07070d',
        background: '#FFE600',
        border: 'none',
        padding: '16px 28px',
        letterSpacing: 1,
        cursor: 'pointer',
        transition: 'opacity 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      ✦ SHARE YOUR IP
    </button>
  )
}
