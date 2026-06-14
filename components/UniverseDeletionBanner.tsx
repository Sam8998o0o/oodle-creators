'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

interface Props {
  universeId: string
}

export default function UniverseDeletionBanner({ universeId }: Props) {
  const router = useRouter()
  const [voteId,   setVoteId]   = useState<string | null>(null)
  const [voted,    setVoted]    = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [working,  setWorking]  = useState(false)

  useEffect(() => {
    async function fetchVote() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('universe_deletion_votes')
        .select('id, voted')
        .eq('universe_id', universeId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setVoteId(data.id)
        setVoted(data.voted)
      }
      setLoading(false)
    }
    fetchVote()
  }, [universeId])

  async function handleAgree() {
    if (!voteId) return
    setWorking(true)

    await supabase
      .from('universe_deletion_votes')
      .update({ voted: true, voted_at: new Date().toISOString() })
      .eq('id', voteId)

    // Check if all members have now agreed
    const { data: allVotes } = await supabase
      .from('universe_deletion_votes')
      .select('voted')
      .eq('universe_id', universeId)

    if (allVotes && allVotes.length > 0 && allVotes.every(v => v.voted)) {
      await supabase.from('universes').delete().eq('id', universeId)
      router.push('/universes')
      return
    }

    setVoted(true)
    setWorking(false)
  }

  async function handleDecline() {
    setWorking(true)
    // Cancel the whole deletion request for this universe
    await supabase
      .from('universe_deletion_votes')
      .delete()
      .eq('universe_id', universeId)

    setVoteId(null)
    setWorking(false)
    router.refresh()
  }

  // Don't render until loaded; hide if no pending vote or already voted
  if (loading || !voteId || voted) return null

  return (
    <div style={{
      background: 'rgba(255,230,0,0.05)',
      border: '1px solid rgba(255,230,0,0.25)',
      borderLeft: '4px solid #FFE600',
      padding: '16px 20px',
      marginBottom: 28,
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 8,
          color: '#FFE600',
          margin: '0 0 6px',
          letterSpacing: 1,
          lineHeight: 1.7,
        }}>
          ⚠ THE OWNER WANTS TO DELETE THIS UNIVERSE
        </p>
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
          margin: 0,
          lineHeight: 1.6,
        }}>
          All members must agree for the universe to be permanently deleted.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleDecline}
          disabled={working}
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 7,
            color: 'rgba(255,255,255,0.5)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '9px 14px',
            cursor: working ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
            transition: 'color 150ms, border-color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
        >
          DECLINE
        </button>
        <button
          type="button"
          onClick={handleAgree}
          disabled={working}
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 7,
            color: '#07070d',
            background: '#FFE600',
            border: 'none',
            padding: '9px 14px',
            cursor: working ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
            opacity: working ? 0.6 : 1,
            transition: 'opacity 150ms',
          }}
        >
          {working ? '...' : 'AGREE TO DELETE'}
        </button>
      </div>
    </div>
  )
}
