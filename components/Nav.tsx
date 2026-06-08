'use client'

import Link from 'next/link'
import { signInWithGoogle } from '../lib/auth'

const CENTER_LINKS = [
  { label: 'GALLERY',      href: '/gallery' },
  { label: 'HOW IT WORKS', href: '/#how-it-works' },
  { label: 'MONETIZE',     href: '/#monetize' },
  { label: 'ROADMAP',      href: '/#roadmap' },
]

export default function Nav() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 64,
      zIndex: 50,
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

        {/* Center links — hidden on mobile */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="hidden md:flex">
          {CENTER_LINKS.map(link => (
            <Link key={link.label} href={link.href} style={{
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

        {/* Right buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <Link
            href="/create"
            className="hidden sm:block"
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
          <button
            onClick={() => signInWithGoogle()}
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
        </div>
      </div>
    </nav>
  )
}
