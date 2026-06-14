'use client'

import { useState, useEffect } from 'react'

const STEPS = [
  {
    target: null as string | null,
    title: '✦ WELCOME TO OODLE CREATORS',
    text: 'Your home for original character IPs — toys, mascots, healing characters, illustrated stories.',
    button: 'START TOUR →',
    isFinal: false,
  },
  {
    target: '[data-tour="gallery"]',
    title: '🎨 EXPLORE THE GALLERY',
    text: 'Browse original characters from creators worldwide.',
    button: 'NEXT →',
    isFinal: false,
  },
  {
    target: '[data-tour="share-ip"]',
    title: '✦ SHARE YOUR IP',
    text: 'Upload your character and get your own public page.',
    button: 'NEXT →',
    isFinal: false,
  },
  {
    target: '[data-tour="universes"]',
    title: '🌍 JOIN A UNIVERSE',
    text: 'Build shared worlds with other creators.',
    button: "LET'S GO! →",
    isFinal: true,
  },
]

const TOOLTIP_W = 280

function clearHighlights() {
  document.querySelectorAll<HTMLElement>('[data-tour]').forEach(el => {
    el.style.boxShadow = ''
    el.style.position  = ''
    el.style.zIndex    = ''
  })
  const nav = document.querySelector<HTMLElement>('nav')
  if (nav) nav.style.zIndex = ''
}

export default function OnboardingTour() {
  // `checked` stays false until the client-side storage read completes.
  // This prevents any render before we know whether to show the tour.
  const [checked, setChecked] = useState(false)
  const [visible, setVisible] = useState(false)
  const [step,    setStep]    = useState(0)
  const [rect,    setRect]    = useState<DOMRect | null>(null)

  useEffect(() => {
    const neverShow      = localStorage.getItem('oodle-creators-no-tour')
    const skippedSession = sessionStorage.getItem('oodle-creators-tour-skipped')
    if (!neverShow && !skippedSession) setVisible(true)
    setChecked(true)
  }, [])

  // Highlight the current step's target nav element
  useEffect(() => {
    clearHighlights()
    if (!visible) return

    const target = STEPS[step].target
    if (!target) { setRect(null); return }

    const el = document.querySelector<HTMLElement>(target)
    if (!el) { setRect(null); return }

    setRect(el.getBoundingClientRect())
    el.style.boxShadow = '0 0 0 3px #FFE600, 0 0 20px rgba(255,230,0,0.4)'
    el.style.position  = 'relative'
    el.style.zIndex    = '9999'

    // Bring the nav visually above the overlay
    const nav = document.querySelector<HTMLElement>('nav')
    if (nav) nav.style.zIndex = '9999'

    return () => { clearHighlights() }
  }, [step, visible])

  // Keep tooltip position correct when the window resizes
  useEffect(() => {
    if (!visible) return
    const target = STEPS[step].target
    if (!target) return
    function onResize() {
      const el = document.querySelector<HTMLElement>(target!)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [step, visible])

  // Skip: hide for this browser session, show again next visit
  function skip() {
    sessionStorage.setItem('oodle-creators-tour-skipped', 'true')
    clearHighlights()
    setVisible(false)
  }

  // Never show: permanent localStorage flag
  function neverShowAgain() {
    localStorage.setItem('oodle-creators-no-tour', 'true')
    clearHighlights()
    setVisible(false)
  }

  function advance() {
    if (step >= STEPS.length - 1) {
      skip()   // completing the tour = session-skip (not permanent)
      return
    }
    setStep(s => s + 1)
  }

  // Don't render until storage has been read, and only if the tour should show
  if (!checked || !visible) return null

  const s         = STEPS[step]
  const isWelcome = step === 0
  const hasRect   = rect != null && rect.width > 0 && rect.height > 0

  // Tooltip position for steps 1–3
  let tooltipTop  = 0
  let tooltipLeft = 0
  let arrowLeft   = 0
  let showArrow   = false

  if (!isWelcome && hasRect) {
    tooltipTop  = rect.bottom + 12
    tooltipLeft = Math.max(16, Math.min(
      rect.left + rect.width / 2 - TOOLTIP_W / 2,
      window.innerWidth - TOOLTIP_W - 16,
    ))
    arrowLeft = Math.max(12, Math.min(
      rect.left + rect.width / 2 - tooltipLeft,
      TOOLTIP_W - 12,
    ))
    showArrow = true
  }

  /* ── STEP 0: welcome modal — no overlay, no highlight ── */
  if (isWelcome) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: '#07070d',
        borderTop:    '3px solid #FFE600',
        borderRight:  '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderLeft:   '1px solid rgba(255,255,255,0.1)',
        padding: '40px 36px 32px',
        width: 480,
        maxWidth: 'calc(100vw - 48px)',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 13,
          color: '#FFE600',
          margin: '0 0 16px',
          lineHeight: 1.8,
          letterSpacing: 1,
        }}>
          {s.title}
        </h2>

        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 15,
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.7,
          margin: '0 0 32px',
        }}>
          {s.text}
        </p>

        <button
          type="button"
          onClick={advance}
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 10,
            color: '#07070d',
            background: '#FFE600',
            border: 'none',
            padding: '14px 28px',
            cursor: 'pointer',
            letterSpacing: 1,
            display: 'block',
            width: '100%',
            marginBottom: 16,
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {s.button}
        </button>

        <button
          type="button"
          onClick={neverShowAgain}
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 7,
            color: 'rgba(255,255,255,0.25)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: 1,
            transition: 'color 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
        >
          DON'T SHOW AGAIN
        </button>
      </div>
    )
  }

  /* ── STEPS 1–3: visual overlay + tooltip ── */
  return (
    <>
      {/* Dark overlay — pointer-events: none so page stays fully interactive */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9998,
        pointerEvents: 'none',
      }} />

      {/* Tooltip */}
      <div style={{
        position: 'fixed',
        top:  hasRect ? tooltipTop  : '50%',
        left: hasRect ? tooltipLeft : '50%',
        transform: hasRect ? 'none' : 'translate(-50%, -50%)',
        width: TOOLTIP_W,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9999,
        pointerEvents: 'auto',
        background: '#07070d',
        borderTop:    '3px solid #FFE600',
        borderRight:  '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        borderLeft:   '1px solid rgba(255,255,255,0.1)',
        padding: '20px 20px 16px',
      }}>
        {/* CSS triangle arrow pointing UP toward the nav element */}
        {showArrow && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: arrowLeft,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft:   '8px solid transparent',
            borderRight:  '8px solid transparent',
            borderBottom: '8px solid #FFE600',
          }} />
        )}

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 9,
          color: '#FFE600',
          margin: '0 0 10px',
          lineHeight: 1.8,
          letterSpacing: 1,
        }}>
          {s.title}
        </h3>

        {/* Body */}
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.6,
          margin: '0 0 14px',
        }}>
          {s.text}
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
          {STEPS.map((_, i) => (
            <span key={i} style={{
              fontSize: i <= step ? 9 : 7,
              color: i <= step ? '#FFE600' : 'rgba(255,255,255,0.2)',
              lineHeight: 1,
            }}>
              {i <= step ? '●' : '○'}
            </span>
          ))}
        </div>

        {/* Footer: SKIP (left) + action button (right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={skip}
            style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 7,
              color: 'rgba(255,255,255,0.3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: 1,
              padding: '6px 0',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            SKIP
          </button>

          <button
            type="button"
            onClick={advance}
            style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 8,
              color: '#07070d',
              background: '#FFE600',
              border: 'none',
              padding: '8px 14px',
              cursor: 'pointer',
              letterSpacing: 1,
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {s.button}
          </button>
        </div>

        {/* DON'T SHOW AGAIN — only on the final step */}
        {s.isFinal && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <button
              type="button"
              onClick={neverShowAgain}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 6,
                color: 'rgba(255,255,255,0.2)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: 1,
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
            >
              DON'T SHOW AGAIN
            </button>
          </div>
        )}
      </div>
    </>
  )
}
