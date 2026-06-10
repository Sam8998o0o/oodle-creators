'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

interface Props {
  characterId: string
  initialComments: Comment[]
}

function formatCommentDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default function CharacterComments({ characterId, initialComments }: Props) {
  const [comments,        setComments]        = useState<Comment[]>(initialComments)
  const [content,         setContent]         = useState('')
  const [posting,         setPosting]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [authChecked,     setAuthChecked]     = useState(false)
  const [hoverCommentId,  setHoverCommentId]  = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{
    id: string
    display_name: string
    avatar_url: string | null
  } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser({
          id:           user.id,
          display_name: user.user_metadata?.full_name
                        ?? user.user_metadata?.name
                        ?? user.email?.split('@')[0]
                        ?? 'Anonymous',
          avatar_url:   user.user_metadata?.avatar_url ?? null,
        })
      }
      setAuthChecked(true)
    })
  }, [])

  async function handlePost() {
    const trimmed = content.trim()
    if (!trimmed || !currentUser) return
    setPosting(true)
    setError(null)

    const tempId: string = `temp-${Date.now()}`
    const optimistic: Comment = {
      id:           tempId,
      content:      trimmed,
      created_at:   new Date().toISOString(),
      user_id:      currentUser.id,
      display_name: currentUser.display_name,
      avatar_url:   currentUser.avatar_url,
    }

    // Optimistic prepend
    setComments(prev => [optimistic, ...prev])
    setContent('')

    const { data, error: dbError } = await supabase
      .from('character_comments')
      .insert({ character_id: characterId, user_id: currentUser.id, content: trimmed })
      .select('id')
      .single()

    if (dbError) {
      console.error('[CharacterComments] insert error:', dbError)
      setComments(prev => prev.filter(c => c.id !== tempId))
      setContent(trimmed)
      setError('Could not post comment — try again')
      setPosting(false)
      return
    }

    // Swap temp id for real id
    setComments(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id } : c))
    setPosting(false)
  }

  async function handleDelete(commentId: string) {
    const snapshot = comments.find(c => c.id === commentId)

    // Optimistic remove
    setComments(prev => prev.filter(c => c.id !== commentId))
    setHoverCommentId(null)

    const { error: dbError } = await supabase
      .from('character_comments')
      .delete()
      .eq('id', commentId)

    if (dbError && snapshot) {
      // Rollback — re-insert at original position by timestamp
      setComments(prev => {
        const next = [...prev]
        const idx  = next.findIndex(c => c.created_at < snapshot.created_at)
        idx === -1 ? next.push(snapshot) : next.splice(idx, 0, snapshot)
        return next
      })
    }
  }

  const canPost = content.trim().length > 0 && !posting

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>

      {/* ── Section heading ── */}
      <p style={{
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        margin: '0 0 20px',
        letterSpacing: 1,
      }}>
        ✦ COMMENTS
      </p>

      {/* ── Input area (only shown after auth check) ── */}
      {authChecked && (
        currentUser ? (
          <div style={{ marginBottom: 24 }}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 300))}
              placeholder="Leave a comment..."
              rows={2}
              maxLength={300}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                lineHeight: 1.6,
                padding: '10px 14px',
                outline: 'none',
                resize: 'none',
                borderRadius: 0,
                transition: 'border-color 150ms',
              }}
              onFocus={e => (e.target.style.borderColor = '#FFE600')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canPost) handlePost()
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 11,
                color: content.length >= 250 ? '#FFE600' : 'rgba(255,255,255,0.3)',
                transition: 'color 200ms',
              }}>
                {content.length} / 300
              </span>
              <button
                type="button"
                onClick={handlePost}
                disabled={!canPost}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: '#07070d',
                  background: canPost ? '#FFE600' : 'rgba(255,230,0,0.35)',
                  border: 'none',
                  padding: '10px 20px',
                  cursor: canPost ? 'pointer' : 'not-allowed',
                  letterSpacing: 1,
                  transition: 'background 150ms',
                }}
              >
                {posting ? 'POSTING...' : 'POST →'}
              </button>
            </div>
            {error && (
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12,
                color: '#ff6b6b',
                margin: '8px 0 0',
              }}>
                {error}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.href },
            })}
            style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 9,
              color: '#07070d',
              background: '#FFE600',
              border: 'none',
              padding: '12px 20px',
              cursor: 'pointer',
              letterSpacing: 1,
              marginBottom: 24,
              display: 'block',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            SIGN IN TO COMMENT →
          </button>
        )
      )}

      {/* ── Comment list ── */}
      {comments.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 13,
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
          padding: '24px 0',
          margin: 0,
          letterSpacing: 0.5,
        }}>
          BE THE FIRST TO COMMENT
        </p>
      ) : (
        <div>
          {comments.map((comment, idx) => (
            <div
              key={comment.id}
              onMouseEnter={() => setHoverCommentId(comment.id)}
              onMouseLeave={() => setHoverCommentId(null)}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 0',
                borderBottom: idx < comments.length - 1
                  ? '1px solid rgba(255,255,255,0.07)'
                  : 'none',
                position: 'relative',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                overflow: 'hidden',
                background: comment.avatar_url ? '#0e0e1a' : '#FFE600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {comment.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.avatar_url}
                    alt={comment.display_name ?? ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-pixel), monospace',
                    fontSize: 12,
                    color: '#07070d',
                    userSelect: 'none',
                    lineHeight: 1,
                  }}>
                    {(comment.display_name ?? '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name + timestamp + content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-pixel), monospace',
                    fontSize: 9,
                    color: '#ffffff',
                    letterSpacing: 0.5,
                    lineHeight: 1.6,
                  }}>
                    {comment.display_name ?? 'Anonymous'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                    lineHeight: 1.6,
                  }}>
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.7,
                  margin: 0,
                  wordBreak: 'break-word',
                }}>
                  {comment.content}
                </p>
              </div>

              {/* Delete button — own comments only, visible on hover */}
              {currentUser?.id === comment.user_id && hoverCommentId === comment.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 0,
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: '4px 6px',
                    fontFamily: 'var(--font-body), sans-serif',
                    lineHeight: 1,
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                  aria-label="Delete comment"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
