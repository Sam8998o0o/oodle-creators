'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

interface Props {
  universeId: string
}

export default function UniverseActionButtons({ universeId }: Props) {
  const router = useRouter()
  const [userId,      setUserId]      = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isMember,    setIsMember]    = useState(false)
  const [following,   setFollowing]   = useState(false)   // loading state for follow button
  const [joining,     setJoining]     = useState(false)   // loading state for join button
  const [ready,       setReady]       = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setReady(true); return }
      setUserId(user.id)

      const [followRes, memberRes] = await Promise.all([
        supabase
          .from('universe_followers')
          .select('id')
          .eq('universe_id', universeId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('universe_members')
          .select('id')
          .eq('universe_id', universeId)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      setIsFollowing(!!followRes.data)
      setIsMember(!!memberRes.data)
      setReady(true)
    }
    check()
  }, [universeId])

  async function handleFollow() {
    if (!userId) { window.dispatchEvent(new Event('open-sign-in-modal')); return }
    setFollowing(true)
    if (isFollowing) {
      await supabase
        .from('universe_followers')
        .delete()
        .eq('universe_id', universeId)
        .eq('user_id', userId)
      setIsFollowing(false)
    } else {
      await supabase
        .from('universe_followers')
        .insert({ universe_id: universeId, user_id: userId })
      setIsFollowing(true)
    }
    setFollowing(false)
  }

  async function handleJoin() {
    if (!userId) { window.dispatchEvent(new Event('open-sign-in-modal')); return }
    setJoining(true)
    await supabase
      .from('universe_members')
      .insert({ universe_id: universeId, user_id: userId, role: 'member' })
    setIsMember(true)
    setJoining(false)
    router.refresh()
  }

  if (!ready) return null

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Follow */}
      <button
        type="button"
        onClick={handleFollow}
        disabled={following}
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 9,
          color: isFollowing ? '#07070d' : '#ffffff',
          background: isFollowing ? '#FFE600' : 'transparent',
          border: `1px solid ${isFollowing ? '#FFE600' : 'rgba(255,255,255,0.3)'}`,
          padding: '12px 20px',
          cursor: following ? 'wait' : 'pointer',
          letterSpacing: 1,
          transition: 'all 150ms',
          opacity: following ? 0.6 : 1,
        }}
      >
        {isFollowing ? '❤ FOLLOWING' : '❤ FOLLOW'}
      </button>

      {/* Join */}
      {isMember ? (
        <span style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 9,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: 1,
        }}>
          ✓ MEMBER
        </span>
      ) : (
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 9,
            color: '#07070d',
            background: '#FFE600',
            border: 'none',
            padding: '12px 20px',
            cursor: joining ? 'wait' : 'pointer',
            letterSpacing: 1,
            opacity: joining ? 0.6 : 1,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => { if (!joining) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { if (!joining) e.currentTarget.style.opacity = '1' }}
        >
          {joining ? 'JOINING...' : '✦ JOIN UNIVERSE'}
        </button>
      )}
    </div>
  )
}
