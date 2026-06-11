'use client'

import { supabase } from '../lib/supabase'

export default function PlayOodleButton() {
  async function handleClick() {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      window.open(
        `https://oodle.vercel.app?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } else {
      window.open('https://oodle.vercel.app', '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: 10,
        color: '#ffffff',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.3)',
        padding: '12px 22px',
        letterSpacing: 1,
        cursor: 'pointer',
        transition: 'border-color 150ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
    >
      PLAY OODLE →
    </button>
  )
}
