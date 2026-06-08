'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { signInWithGoogle } from '../lib/auth'

interface Props {
  characterId: string
  initialLikes: number
  initialFans: number
}

export default function LikeFollowButtons({ characterId, initialLikes, initialFans }: Props) {
  const [liked,     setLiked]     = useState(false)
  const [followed,  setFollowed]  = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikes)
  const [fanCount,  setFanCount]  = useState(initialFans)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [busy,      setBusy]      = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)

      // Check existing like
      supabase.from('character_likes')
        .select('id')
        .eq('character_id', characterId)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => { if (data) setLiked(true) })

      // Check existing follow
      supabase.from('character_follows')
        .select('id')
        .eq('character_id', characterId)
        .eq('follower_id', user.id)
        .maybeSingle()
        .then(({ data }) => { if (data) setFollowed(true) })
    })
  }, [characterId])

  const handleLike = async () => {
    if (busy) return
    if (!userId) { signInWithGoogle(); return }
    setBusy(true)

    const newLiked = !liked
    // Optimistic
    setLiked(newLiked)
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1))

    if (newLiked) {
      await supabase.from('character_likes').insert({ character_id: characterId, user_id: userId })
      await supabase.from('characters').update({ likes: likeCount + 1 }).eq('id', characterId)
    } else {
      await supabase.from('character_likes').delete().eq('character_id', characterId).eq('user_id', userId)
      await supabase.from('characters').update({ likes: Math.max(0, likeCount - 1) }).eq('id', characterId)
    }
    setBusy(false)
  }

  const handleFollow = async () => {
    if (busy) return
    if (!userId) { signInWithGoogle(); return }
    setBusy(true)

    const newFollowed = !followed
    setFollowed(newFollowed)
    setFanCount(c => newFollowed ? c + 1 : Math.max(0, c - 1))

    if (newFollowed) {
      await supabase.from('character_follows').insert({ character_id: characterId, follower_id: userId })
      await supabase.from('characters').update({ fans: fanCount + 1 }).eq('id', characterId)
    } else {
      await supabase.from('character_follows').delete().eq('character_id', characterId).eq('follower_id', userId)
      await supabase.from('characters').update({ fans: Math.max(0, fanCount - 1) }).eq('id', characterId)
    }
    setBusy(false)
  }

  const btn = (active: boolean, onClick: () => void, label: string) => ({
    onClick,
    disabled: busy,
    style: {
      fontFamily: 'var(--font-pixel), monospace',
      fontSize: 9,
      padding: '12px 20px',
      border: `1px solid ${active ? '#FFE600' : 'rgba(255,255,255,0.2)'}`,
      background: active ? '#FFE600' : 'transparent',
      color: active ? '#07070d' : '#ffffff',
      cursor: busy ? 'not-allowed' : 'pointer',
      opacity: busy ? 0.6 : 1,
      letterSpacing: 1,
      transition: 'all 150ms',
    } as CSSProperties,
  })

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button {...btn(liked, handleLike, '')}>
        ❤ LIKE · {likeCount}
      </button>
      <button {...btn(followed, handleFollow, '')}>
        👥 FOLLOW · {fanCount}
      </button>
    </div>
  )
}
