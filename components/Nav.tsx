'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase, getProfile } from '../lib/supabase'
import { signInWithGoogle, signOut } from '../lib/auth'
import type { User } from '@supabase/supabase-js'

const CENTER_LINKS = [
  { label: 'GALLERY',      href: '/gallery',       tourId: 'gallery'    },
  { label: 'UNIVERSES',    href: '/universes',      tourId: 'universes'  },
  { label: 'HOW IT WORKS', href: '/#how-it-works',  tourId: undefined    },
  { label: 'MONETIZE',     href: '/#monetize',      tourId: undefined    },
  { label: 'ROADMAP',      href: '/#roadmap',       tourId: undefined    },
]

/* ── Google icon SVG ─────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ── Nav ─────────────────────────────────────────────── */
export default function Nav() {
  const [user,           setUser]           = useState<User | null>(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [dropdownOpen,   setDropdownOpen]   = useState(false)
  const [signingIn,      setSigningIn]      = useState(false)
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false)
  const [avatarHovered,   setAvatarHovered]   = useState(false)
  const [imgError,         setImgError]         = useState(false)
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  /* Auth subscription + profile fetch */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) getProfile(user.id).then(p => setProfileAvatarUrl(p?.avatar_url ?? null))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setImgError(false)
      if (u) {
        setModalOpen(false)
        getProfile(u.id).then(p => setProfileAvatarUrl(p?.avatar_url ?? null))
      } else {
        setProfileAvatarUrl(null)  // clear on sign-out
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /* Close dropdown on outside click */
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  /* Escape key closes modal or mobile menu */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setModalOpen(false)
        setMobileMenuOpen(false)
      }
    }
    if (modalOpen || mobileMenuOpen) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modalOpen, mobileMenuOpen])

  /* Global event — any component can open the modal via:
     window.dispatchEvent(new Event('open-sign-in-modal')) */
  useEffect(() => {
    function onOpenModal() { setModalOpen(true) }
    window.addEventListener('open-sign-in-modal', onOpenModal)
    return () => window.removeEventListener('open-sign-in-modal', onOpenModal)
  }, [])

  /* Re-fetch the profiles row when the profile page finishes an avatar upload. */
  useEffect(() => {
    async function onAvatarUpdated() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const profile = await getProfile(user.id)
      setProfileAvatarUrl(profile?.avatar_url ?? null)
      setImgError(false)
    }
    window.addEventListener('avatar-updated', onAvatarUpdated)
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated)
  }, [])

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'USER'
  // Custom-uploaded avatar (profiles table) takes priority over the Google
  // OAuth photo stored in user_metadata, which gets overwritten on every sign-in.
  const avatarUrl: string | undefined =
    profileAvatarUrl ??
    (user?.user_metadata?.avatar_url as string | undefined)

  return (
    <>
      {/* ── Navbar ────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 64,
        zIndex: 100,
        background: 'rgba(7,7,13,0.92)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Logo */}
          <Link href="/" style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 14,
            color: '#FFE600',
            textDecoration: 'none',
            letterSpacing: 1,
            flexShrink: 0,
          }}>
            OODLE CREATORS
          </Link>

          {/* Center links — desktop only */}
          <div style={{ gap: 28, alignItems: 'center' }} className="hidden md:flex">
            {CENTER_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                data-tour={link.tourId}
                style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFE600')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {/* SHARE YOUR IP — desktop only */}
            {user ? (
              <Link
                href="/create"
                className="hidden md:block"
                data-tour="share-ip"
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '9px 14px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  letterSpacing: 1,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFE600')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              >
                SHARE YOUR IP
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="hidden md:block"
                data-tour="share-ip"
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  background: 'none',
                  padding: '9px 14px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  letterSpacing: 1,
                  cursor: 'pointer',
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFE600')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              >
                SHARE YOUR IP
              </button>
            )}

            {/* Avatar / SIGN IN — desktop only */}
            <div className="hidden md:flex items-center" style={{ gap: 10 }}>
              {user ? (
                /* ── Signed-in: avatar + dropdown ── */
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen(d => !d)}
                    aria-label="Account menu"
                    onMouseEnter={() => setAvatarHovered(true)}
                    onMouseLeave={() => setAvatarHovered(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {/* Display name — desktop only (already inside hidden md:flex wrapper) */}
                    <span style={{
                      fontFamily: 'var(--font-body), sans-serif',
                      fontSize: 13,
                      color: '#ffffff',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {displayName}
                    </span>

                    {/* Avatar square */}
                    <div style={{
                      width: 36,
                      height: 36,
                      overflow: 'hidden',
                      background: '#FFE600',
                      border: `2px solid ${dropdownOpen || avatarHovered ? '#FFE600' : 'transparent'}`,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 150ms',
                    }}>
                      {avatarUrl?.startsWith('http') && !imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          width={36}
                          height={36}
                          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <span style={{
                          fontFamily: 'var(--font-pixel), monospace',
                          fontSize: 14,
                          color: '#07070d',
                          lineHeight: 1,
                        }}>
                          {displayName[0]?.toUpperCase() ?? 'U'}
                        </span>
                      )}
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      background: '#0e0e1a',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderTop: '2px solid #FFE600',
                      zIndex: 100,
                      minWidth: 220,
                    }}>
                      {/* User info */}
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {user.user_metadata?.full_name && (
                          <p style={{
                            fontFamily: 'var(--font-pixel), monospace',
                            fontSize: 8,
                            color: '#ffffff',
                            margin: '0 0 6px',
                            letterSpacing: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {String(user.user_metadata.full_name).toUpperCase()}
                          </p>
                        )}
                        <p style={{
                          fontFamily: 'var(--font-body), sans-serif',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.4)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {user.email}
                        </p>
                      </div>

                      {/* My Profile */}
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          fontFamily: 'var(--font-pixel), monospace',
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.65)',
                          textDecoration: 'none',
                          letterSpacing: 1,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          transition: 'color 150ms, background 150ms',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#FFE600'
                          e.currentTarget.style.background = 'rgba(255,230,0,0.04)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        ▶ MY PROFILE
                      </Link>

                      {/* My Feed */}
                      <Link
                        href="/feed"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          fontFamily: 'var(--font-pixel), monospace',
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.65)',
                          textDecoration: 'none',
                          letterSpacing: 1,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          transition: 'color 150ms, background 150ms',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#FFE600'
                          e.currentTarget.style.background = 'rgba(255,230,0,0.04)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        ▶ MY FEED
                      </Link>

                      {/* My Universes */}
                      <Link
                        href="/universes?filter=mine"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          fontFamily: 'var(--font-pixel), monospace',
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.65)',
                          textDecoration: 'none',
                          letterSpacing: 1,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          transition: 'color 150ms, background 150ms',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#FFE600'
                          e.currentTarget.style.background = 'rgba(255,230,0,0.04)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        ▶ MY UNIVERSES
                      </Link>

                      {/* Sign out */}
                      <button
                        onClick={async () => {
                          setDropdownOpen(false)
                          await signOut()
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          padding: '12px 16px',
                          fontFamily: 'var(--font-pixel), monospace',
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          letterSpacing: 1,
                          transition: 'color 150ms, background 150ms',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#ff4444'
                          e.currentTarget.style.background = 'rgba(255,68,68,0.06)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        ▶ SIGN OUT
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Signed-out: SIGN IN button ── */
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    fontFamily: 'var(--font-pixel), monospace',
                    fontSize: 8,
                    color: '#07070d',
                    background: '#FFE600',
                    border: 'none',
                    padding: '9px 14px',
                    cursor: 'pointer',
                    letterSpacing: 1,
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ▶ SIGN IN
                </button>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="flex md:hidden"
              onClick={() => setMobileMenuOpen(m => !m)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: 22,
                lineHeight: 1,
                padding: '4px 6px',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ───────────────────────────────────── */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#07070d',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          zIndex: 49,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 24px',
          overflowY: 'auto',
        }}>
          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
            {CENTER_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  letterSpacing: 2,
                  padding: '18px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFE600')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              >
                ▶ {link.label}
              </Link>
            ))}
          </div>

          {/* SHARE YOUR IP CTA */}
          {user ? (
            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 10,
                color: '#07070d',
                background: '#FFE600',
                textDecoration: 'none',
                padding: '16px 20px',
                letterSpacing: 1,
                textAlign: 'center',
                marginBottom: 12,
                display: 'block',
              }}
            >
              ✦ SHARE YOUR IP
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setModalOpen(true) }}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 10,
                color: '#07070d',
                background: '#FFE600',
                border: 'none',
                padding: '16px 20px',
                letterSpacing: 1,
                textAlign: 'center',
                marginBottom: 12,
                display: 'block',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              ✦ SHARE YOUR IP
            </button>
          )}

          {/* Auth section */}
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                marginBottom: 4,
              }}>
                <p style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  margin: '0 0 4px',
                  letterSpacing: 1,
                }}>
                  {displayName.toUpperCase()}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  margin: 0,
                }}>
                  {user.email ?? ''}
                </p>
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  letterSpacing: 1,
                  display: 'block',
                  textAlign: 'center',
                  transition: 'color 150ms, border-color 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#FFE600'
                  e.currentTarget.style.borderColor = '#FFE600'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                ▶ MY PROFILE
              </Link>
              <Link
                href="/feed"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  letterSpacing: 1,
                  display: 'block',
                  textAlign: 'center',
                  transition: 'color 150ms, border-color 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#FFE600'
                  e.currentTarget.style.borderColor = '#FFE600'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                ▶ MY FEED
              </Link>
              <Link
                href="/universes?filter=mine"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  letterSpacing: 1,
                  display: 'block',
                  textAlign: 'center',
                  transition: 'color 150ms, border-color 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#FFE600'
                  e.currentTarget.style.borderColor = '#FFE600'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                ▶ MY UNIVERSES
              </Link>
              <button
                onClick={async () => { setMobileMenuOpen(false); await signOut() }}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: '#ff4444',
                  background: 'none',
                  border: '1px solid rgba(255,68,68,0.3)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                ▶ SIGN OUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMobileMenuOpen(false); setModalOpen(true) }}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 10,
                color: '#07070d',
                background: '#FFE600',
                border: 'none',
                padding: '16px 20px',
                cursor: 'pointer',
                letterSpacing: 1,
                width: '100%',
              }}
            >
              ▶ SIGN IN
            </button>
          )}
        </div>
      )}

      {/* ── Sign-in modal ─────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
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
            aria-label="Sign in"
            style={{
              background: '#07070d',
              border: '1px solid rgba(255,255,255,0.12)',
              borderTop: '3px solid #FFE600',
              padding: '40px 36px 32px',
              width: '100%',
              maxWidth: 420,
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 20,
                lineHeight: 1,
                padding: '4px 8px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              ✕
            </button>

            {/* Badge */}
            <div style={{
              display: 'inline-block',
              padding: '5px 12px',
              border: '1px solid rgba(255,230,0,0.35)',
              background: 'rgba(255,230,0,0.05)',
              marginBottom: 24,
            }}>
              <span style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 7,
                color: '#FFE600',
                letterSpacing: 2,
              }}>
                ✦ OODLE CREATORS
              </span>
            </div>

            {/* Heading */}
            <h2 style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(14px, 3vw, 20px)',
              color: '#ffffff',
              margin: '0 0 10px',
              lineHeight: 1.5,
              letterSpacing: 1,
            }}>
              SIGN IN
            </h2>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.45)',
              margin: '0 0 32px',
              lineHeight: 1.6,
            }}>
              Join the community of original IP creators.
            </p>

            {/* Google sign-in button */}
            <button
              onClick={async () => {
                setSigningIn(true)
                await signInWithGoogle()
              }}
              disabled={signingIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                width: '100%',
                background: signingIn ? 'rgba(255,255,255,0.85)' : '#ffffff',
                color: '#07070d',
                border: 'none',
                padding: '15px 20px',
                cursor: signingIn ? 'wait' : 'pointer',
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                letterSpacing: 1,
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => { if (!signingIn) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <GoogleIcon />
              {signingIn ? 'CONNECTING...' : 'SIGN IN WITH GOOGLE'}
            </button>

            {/* Divider */}
            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.2)',
                margin: 0,
                lineHeight: 1.6,
              }}>
                Your account is shared with the Oodle game.
                <br />
                Sign in once, play everywhere.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
