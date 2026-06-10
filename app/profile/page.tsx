'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { formatNumber } from '../../lib/utils'
import CharacterCard from '../../components/CharacterCard'
import type { User } from '@supabase/supabase-js'

interface Character {
  id: string
  character_name: string
  creator_name: string
  image_url: string | null
  likes: number
  fans: number
  slug: string
  is_public: boolean
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()

  const [user,         setUser]         = useState<User | null>(null)
  const [characters,   setCharacters]   = useState<Character[]>([])
  const [loading,      setLoading]      = useState(true)
  const [openMenu,     setOpenMenu]     = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [imgError,        setImgError]        = useState(false)
  const [avatarHovered,   setAvatarHovered]   = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError,     setAvatarError]     = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)

  /* ── Auth guard ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      setUser(user)
      fetchCharacters(user.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Close open menu on any outside click ── */
  useEffect(() => {
    if (!openMenu) return
    const close = () => setOpenMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  /* ── Data ── */
  async function fetchCharacters(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('characters')
      .select('id, character_name, creator_name, image_url, likes, fans, slug, is_public, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setCharacters((data ?? []) as Character[])
    setLoading(false)
  }

  async function handleTogglePublic(char: Character) {
    setOpenMenu(null)
    const { error } = await supabase
      .from('characters')
      .update({ is_public: !char.is_public })
      .eq('id', char.id)
    if (!error) {
      setCharacters(prev =>
        prev.map(c => c.id === char.id ? { ...c, is_public: !c.is_public } : c)
      )
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('characters').delete().eq('id', deleteTarget.id)
    if (!error) setCharacters(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  /* ── Avatar upload ── */
  const handleAvatarClick = () => avatarInputRef.current?.click()

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Allow re-selecting the same file after an error
    if (avatarInputRef.current) avatarInputRef.current.value = ''

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setAvatarError('Only JPG, PNG and WEBP files accepted')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('File must be under 2MB')
      return
    }

    setAvatarError(null)
    setAvatarUploading(true)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `avatars/${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setAvatarError(`Upload failed: ${uploadError.message}`)
      setAvatarUploading(false)
      return
    }

    const { data: { publicUrl: rawUrl } } = supabase.storage
      .from('character-images')
      .getPublicUrl(filePath)

    // Cache-bust so the browser fetches the new image, not the old cached one
    const publicUrl = `${rawUrl}?v=${Date.now()}`

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })

    if (updateError) {
      setAvatarError(`Failed to save: ${updateError.message}`)
      setAvatarUploading(false)
      return
    }

    // Refresh user state so the new avatar_url is reflected immediately
    const { data: { user: freshUser } } = await supabase.auth.getUser()
    if (freshUser) setUser(freshUser)
    setImgError(false)
    setAvatarUploading(false)

    // Tell Nav to re-fetch user so it shows the new avatar too
    window.dispatchEvent(new Event('avatar-updated'))
  }

  /* ── Derived values ── */
  const totalLikes  = characters.reduce((sum, c) => sum + c.likes, 0)
  const totalFans   = characters.reduce((sum, c) => sum + c.fans, 0)
  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'USER'
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined
  const initial     = displayName[0]?.toUpperCase() ?? 'U'

  /* ── Shared menu item styles ── */
  const menuItemBase: React.CSSProperties = {
    display: 'block',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '11px 16px',
    fontFamily: 'var(--font-pixel), monospace',
    fontSize: 8,
    color: 'rgba(255,255,255,0.65)',
    cursor: 'pointer',
    textAlign: 'left',
    letterSpacing: 1,
    transition: 'color 150ms, background 150ms',
    textDecoration: 'none',
  }

  /* ── Loading / redirect pending ── */
  if (!user) {
    return (
      <div style={{
        background: '#07070d',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          LOADING...
        </span>
      </div>
    )
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* ── TOP SECTION ─────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 32,
          marginBottom: 64,
          flexWrap: 'wrap',
        }}>

          {/* Avatar 80×80 — clickable upload */}
          <div style={{ flexShrink: 0 }}>
            <div
              onClick={handleAvatarClick}
              onMouseEnter={() => setAvatarHovered(true)}
              onMouseLeave={() => setAvatarHovered(false)}
              style={{ width: 80, height: 80, position: 'relative', cursor: 'pointer' }}
            >
              {/* Base: image or initial */}
              <div style={{
                width: '100%',
                height: '100%',
                background: '#FFE600',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {avatarUrl?.startsWith('http') && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 20, color: '#07070d' }}>
                    {initial}
                  </span>
                )}
              </div>

              {/* Camera hover / uploading overlay */}
              {(avatarHovered || avatarUploading) && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                }}>
                  {avatarUploading ? (
                    <span style={{
                      fontFamily: 'var(--font-pixel), monospace',
                      fontSize: 7,
                      color: '#ffffff',
                      textAlign: 'center',
                      letterSpacing: 1,
                      lineHeight: 1.8,
                    }}>
                      UPLOADING...
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>📷</span>
                      <span style={{
                        fontFamily: 'var(--font-pixel), monospace',
                        fontSize: 6,
                        color: '#ffffff',
                        textAlign: 'center',
                        letterSpacing: 1,
                        lineHeight: 1.8,
                      }}>
                        CHANGE<br />PHOTO
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Upload error message */}
            {avatarError && (
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 11,
                color: '#ff6b6b',
                margin: '8px 0 0',
                maxWidth: 120,
                lineHeight: 1.5,
              }}>
                {avatarError}
              </p>
            )}
          </div>

          {/* Info block */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(13px, 2.5vw, 18px)',
              color: '#ffffff',
              margin: '0 0 8px',
              lineHeight: 1.5,
              letterSpacing: 1,
            }}>
              {displayName.toUpperCase()}
            </h1>

            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 16px',
            }}>
              {user.email}
            </p>

            {/* Stats row */}
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 13,
              color: 'rgba(255,255,255,0.45)',
              margin: '0 0 24px',
              lineHeight: 1,
            }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{characters.length}</span>
              {' characters · '}
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{formatNumber(totalLikes)}</span>
              {' total likes · '}
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{formatNumber(totalFans)}</span>
              {' total fans'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/create" style={{
                display: 'inline-block',
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                color: '#07070d',
                background: '#FFE600',
                textDecoration: 'none',
                padding: '12px 20px',
                letterSpacing: 1,
              }}>
                ✦ SHARE YOUR IP
              </Link>

              {characters[0]?.creator_name && (
                <Link
                  href={`/creator/${characters[0].creator_name}`}
                  style={{
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                    textDecoration: 'none',
                    letterSpacing: 0.5,
                  }}
                >
                  VIEW PUBLIC PAGE →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── MY CHARACTERS ───────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
            <h2 style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(12px, 2vw, 16px)',
              color: '#ffffff',
              margin: 0,
              letterSpacing: 1,
            }}>
              MY CHARACTERS
            </h2>
            {!loading && characters.length > 0 && (
              <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                {characters.length}
              </span>
            )}
          </div>

          {/* ── Loading skeleton ── */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 1,
              background: 'rgba(255,255,255,0.07)',
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: '#0d0d16', aspectRatio: '1' }} className="skeleton" />
              ))}
            </div>

          /* ── Empty state ── */
          ) : characters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                margin: '0 0 12px',
                lineHeight: 2,
                letterSpacing: 0.5,
              }}>
                YOU HAVEN&apos;T SHARED ANY<br />CHARACTERS YET
              </p>
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                color: 'rgba(255,255,255,0.3)',
                margin: '0 0 32px',
              }}>
                Upload your first character to get discovered
              </p>
              <Link href="/create" style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                color: '#07070d',
                background: '#FFE600',
                textDecoration: 'none',
                padding: '14px 24px',
                letterSpacing: 1,
              }}>
                SHARE YOUR IP →
              </Link>
            </div>

          /* ── Character grid ── */
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 1,
              background: 'rgba(255,255,255,0.07)',
            }}>
              {characters.map(c => (
                <div key={c.id} style={{ background: '#07070d', position: 'relative' }}>

                  {/* Base card — public shows ✦ CREATOR, private shows nothing from card */}
                  <CharacterCard
                    characterName={c.character_name}
                    creatorHandle={c.creator_name}
                    imageUrl={c.image_url ?? undefined}
                    likes={c.likes}
                    fans={c.fans}
                    slug={c.slug}
                    isVerified={c.is_public}
                  />

                  {/* 🔒 PRIVATE badge — overlays top-right, replaces the absent CREATOR badge */}
                  {!c.is_public && (
                    <span style={{
                      position: 'absolute',
                      top: 8, right: 8,
                      background: 'rgba(0,0,0,0.8)',
                      color: 'rgba(255,255,255,0.65)',
                      fontFamily: 'var(--font-pixel), monospace',
                      fontSize: 7,
                      padding: '3px 6px',
                      zIndex: 2,
                      letterSpacing: 0.5,
                      pointerEvents: 'none',
                    }}>
                      🔒 PRIVATE
                    </span>
                  )}

                  {/* ••• Menu — absolute sibling of CharacterCard, not inside its Link */}
                  <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}>
                    <button
                      onClick={e => {
                        e.stopPropagation() // prevent bubbling to document close-listener
                        setOpenMenu(openMenu === c.id ? null : c.id)
                      }}
                      aria-label="Character options"
                      style={{
                        background: 'rgba(7,7,13,0.85)',
                        border: `1px solid ${openMenu === c.id ? '#FFE600' : 'rgba(255,255,255,0.2)'}`,
                        color: '#ffffff',
                        fontFamily: 'var(--font-body), sans-serif',
                        fontSize: 12,
                        padding: '2px 8px 3px',
                        cursor: 'pointer',
                        letterSpacing: 3,
                        lineHeight: 1,
                        transition: 'border-color 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFE600')}
                      onMouseLeave={e => {
                        if (openMenu !== c.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                      }}
                    >
                      •••
                    </button>

                    {/* Dropdown */}
                    {openMenu === c.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          background: '#0e0e1a',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderTop: '2px solid #FFE600',
                          zIndex: 50,
                          minWidth: 190,
                        }}
                      >
                        {/* Edit */}
                        <Link
                          href={`/edit/${c.slug}`}
                          onClick={() => setOpenMenu(null)}
                          style={{ ...menuItemBase, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#FFE600'
                            e.currentTarget.style.background = 'rgba(255,230,0,0.04)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                            e.currentTarget.style.background = 'none'
                          }}
                        >
                          ✏ EDIT
                        </Link>

                        {/* Toggle public / private */}
                        <button
                          onClick={() => handleTogglePublic(c)}
                          style={{ ...menuItemBase, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#FFE600'
                            e.currentTarget.style.background = 'rgba(255,230,0,0.04)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                            e.currentTarget.style.background = 'none'
                          }}
                        >
                          {c.is_public ? '🔒 MAKE PRIVATE' : '🌏 MAKE PUBLIC'}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setDeleteTarget({ id: c.id, name: c.character_name })
                            setOpenMenu(null)
                          }}
                          style={{ ...menuItemBase, color: 'rgba(255,100,100,0.8)' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#ff4444'
                            e.currentTarget.style.background = 'rgba(255,68,68,0.06)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'rgba(255,100,100,0.8)'
                            e.currentTarget.style.background = 'none'
                          }}
                        >
                          🗑 DELETE
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ────────────────────── */}
      {deleteTarget && (
        <div
          onClick={() => { if (!deleting) setDeleteTarget(null) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              background: '#07070d',
              border: '1px solid rgba(255,255,255,0.12)',
              borderTop: '3px solid #ff4444',
              padding: '36px 32px',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <h3 style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 14,
              color: '#ff4444',
              margin: '0 0 20px',
              letterSpacing: 1,
              lineHeight: 1.5,
            }}>
              DELETE CHARACTER?
            </h3>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              margin: '0 0 6px',
              lineHeight: 1.7,
            }}>
              This will permanently remove{' '}
              <strong style={{ color: '#ffffff' }}>{deleteTarget.name}</strong>.
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 13,
              color: 'rgba(255,100,100,0.65)',
              margin: '0 0 28px',
            }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: 'rgba(255,255,255,0.65)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '13px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  background: deleting ? 'rgba(255,68,68,0.5)' : '#ff4444',
                  border: 'none',
                  padding: '13px',
                  cursor: deleting ? 'wait' : 'pointer',
                  letterSpacing: 1,
                  transition: 'opacity 150ms',
                }}
              >
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
