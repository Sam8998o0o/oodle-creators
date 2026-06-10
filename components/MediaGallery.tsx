'use client'

import { useState, useEffect, useCallback } from 'react'

export interface MediaItem {
  id: string
  file_url: string
  file_type: 'image' | 'video'
  caption: string | null
  created_at: string
}

interface Props {
  items: MediaItem[]
  characterName: string
}

export default function MediaGallery({ items, characterName }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const goPrev = useCallback(
    () => setLightboxIndex(i => i !== null ? (i - 1 + items.length) % items.length : null),
    [items.length]
  )
  const goNext = useCallback(
    () => setLightboxIndex(i => i !== null ? (i + 1) % items.length : null),
    [items.length]
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if      (e.key === 'ArrowLeft')  goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, goPrev, goNext, closeLightbox])

  if (items.length === 0) return null

  const current = lightboxIndex !== null ? items[lightboxIndex] : null

  const navBtn: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontFamily: 'var(--font-pixel), monospace',
    fontSize: 14,
    padding: '14px 18px',
    cursor: 'pointer',
    zIndex: 502,
    letterSpacing: 1,
    lineHeight: 1,
    transition: 'background 150ms',
  }

  return (
    <>
      {/* ── Gallery grid ──────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
        <p style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          margin: '0 0 16px',
          letterSpacing: 1,
        }}>
          ✦ GALLERY
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.07)',
        }}>
          {items.map((item, index) => (
            <div key={item.id} style={{ background: '#07070d' }}>

              {/* Square media container */}
              <div
                onClick={() => { if (item.file_type === 'image') setLightboxIndex(index) }}
                onMouseEnter={e => { if (item.file_type === 'image') e.currentTarget.style.borderColor = '#FFE600' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
                style={{
                  aspectRatio: '1',
                  background: '#0e0e1a',
                  overflow: 'hidden',
                  cursor: item.file_type === 'image' ? 'pointer' : 'default',
                  border: '1px solid transparent',
                  transition: 'border-color 200ms ease',
                }}
              >
                {item.file_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.file_url}
                    alt={item.caption ?? characterName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <video
                    src={item.file_url}
                    controls
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>

              {item.caption && (
                <p style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  margin: 0,
                  padding: '8px 6px',
                  lineHeight: 1.5,
                }}>
                  {item.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {current && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Media lightbox"
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'fixed',
              top: 20,
              right: 24,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 26,
              cursor: 'pointer',
              zIndex: 502,
              fontFamily: 'var(--font-body), sans-serif',
              lineHeight: 1,
              padding: '4px 8px',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            aria-label="Close lightbox"
          >
            ✕
          </button>

          {/* Prev */}
          {items.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); goPrev() }}
              style={{ ...navBtn, left: 16 }}
              aria-label="Previous"
            >
              ←
            </button>
          )}

          {/* Media */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              maxWidth: '90vw',
            }}
          >
            {current.file_type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={current.id}
                src={current.file_url}
                alt={current.caption ?? characterName}
                style={{ maxWidth: '85vw', maxHeight: '82vh', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <video
                key={current.id}
                src={current.file_url}
                controls
                autoPlay
                style={{ maxWidth: '85vw', maxHeight: '82vh', display: 'block' }}
              />
            )}

            {current.caption && (
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                margin: 0,
                textAlign: 'center',
              }}>
                {current.caption}
              </p>
            )}

            {items.length > 1 && (
              <p style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 8,
                color: 'rgba(255,255,255,0.3)',
                margin: 0,
                letterSpacing: 1,
              }}>
                {(lightboxIndex ?? 0) + 1} / {items.length}
              </p>
            )}
          </div>

          {/* Next */}
          {items.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); goNext() }}
              style={{ ...navBtn, right: 16 }}
              aria-label="Next"
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  )
}
