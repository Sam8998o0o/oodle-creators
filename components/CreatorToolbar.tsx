'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import MediaUploader from './MediaUploader'
import PostComposer from './PostComposer'

interface Props {
  /** character.user_id — checked against the current session to gate visibility */
  userId: string
  /** character.slug — used for the edit link and share URL */
  slug: string
  /** character.id — used for media upload */
  characterId: string
}

export default function CreatorToolbar({ userId, slug, characterId }: Props) {
  const [ownerChecked,    setOwnerChecked]    = useState(false)
  const [isOwner,         setIsOwner]         = useState(false)
  const [toastVisible,    setToastVisible]    = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting,        setDeleting]        = useState(false)
  const [mediaOpen,       setMediaOpen]       = useState(false)
  const [postOpen,        setPostOpen]        = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsOwner(user?.id === userId)
      setOwnerChecked(true)
    })
  }, [userId])

  // Render nothing until we know whether this is the owner.
  // This prevents a flash of the toolbar for non-owners.
  if (!ownerChecked || !isOwner) return null

  const pageUrl = `https://oodle-creators.vercel.app/p/${slug}`

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setToastVisible(true)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000)
    } catch {
      // Clipboard API unavailable (non-HTTPS or denied)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('characters').delete().eq('slug', slug)
    if (!error) {
      router.push('/profile')
    } else {
      // On error keep modal open so the user can retry or cancel
      setDeleting(false)
    }
  }

  return (
    <>
      {/* ── "Link copied" toast ─────────────────────────────────── */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#FFE600',
          color: '#07070d',
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 9,
          padding: '8px 16px',
          letterSpacing: 1,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 300,
          opacity: toastVisible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      >
        🔗 LINK COPIED!
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <nav
        aria-label="Creator controls"
        className="creator-toolbar-scroll"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 64,
          background: '#07070d',
          borderTop: '2px solid #FFE600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          zIndex: 48,
          padding: '0 16px',
        }}
      >
        {/* EDIT */}
        <Link href={`/edit/${slug}`} className="creator-toolbar-btn">
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>✏️</span>
          <span>EDIT</span>
        </Link>

        {/* SHARE — copies URL and shows toast */}
        <button type="button" onClick={handleShare} className="creator-toolbar-btn">
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>🔗</span>
          <span>SHARE</span>
        </button>

        {/* BRING TO GAME */}
        <Link
          href="https://oodle.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="creator-toolbar-btn"
        >
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>🎮</span>
          <span>BRING TO GAME</span>
        </Link>

        {/* POST UPDATE — opens post composer */}
        <button type="button" onClick={() => setPostOpen(true)} className="creator-toolbar-btn">
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>📝</span>
          <span>POST UPDATE</span>
        </button>

        {/* ADD MEDIA — opens upload modal */}
        <button type="button" onClick={() => setMediaOpen(true)} className="creator-toolbar-btn">
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>📷</span>
          <span>ADD MEDIA</span>
        </button>

        {/* DELETE — opens confirmation modal */}
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="creator-toolbar-btn creator-toolbar-btn--danger"
        >
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>🗑️</span>
          <span>DELETE</span>
        </button>
      </nav>

      {/* ── Delete confirmation modal ────────────────────────────── */}
      {deleteModalOpen && (
        <div
          onClick={() => !deleting && setDeleteModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0e0e1a',
              borderTop: '3px solid #FFE600',
              padding: '40px 32px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 12,
              color: '#ffffff',
              margin: '0 0 16px',
              lineHeight: 1.8,
              letterSpacing: 1,
            }}>
              DELETE CHARACTER?
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 32px',
              lineHeight: 1.8,
            }}>
              This action cannot be undone. The character will be permanently removed from Oodle Creators.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.6)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '12px 24px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  letterSpacing: 1,
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: '#07070d',
                  background: '#ff4444',
                  border: 'none',
                  padding: '12px 24px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  letterSpacing: 1,
                  opacity: deleting ? 0.55 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                {deleting ? 'DELETING...' : '🗑️ DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Media uploader modal ─────────────────────────────── */}
      {mediaOpen && (
        <MediaUploader
          characterId={characterId}
          onClose={() => setMediaOpen(false)}
          onUploadComplete={() => router.refresh()}
        />
      )}

      {/* ── Post composer modal ──────────────────────────────── */}
      {postOpen && (
        <PostComposer
          characterId={characterId}
          onClose={() => setPostOpen(false)}
          onPublished={() => router.refresh()}
        />
      )}
    </>
  )
}
