'use client'

import { useState, useEffect, useRef } from 'react'

const STEPS = [
  {
    target: null as string | null,
    title: '✦ WELCOME TO OODLE CREATORS',
    text: 'Your home for original character IPs. Toys, mascots, healing characters, illustrated stories — share your creation with the world.',
    button: 'START TOUR →',
  },
  {
    target: '[data-tour="gallery"]',
    title: '🎨 EXPLORE THE GALLERY',
    text: 'Browse original characters from creators worldwide. Like and follow the ones you love.',
    button: 'NEXT →',
  },
  {
    target: '[data-tour="share-ip"]',
    title: '✦ SHARE YOUR IP',
    text: 'Upload your character — any style, any format. Get your own public page and start building your fanbase.',
    button: 'NEXT →',
  },
  {
    target: '[data-tour="universes"]',
    title: '🌍 JOIN A UNIVERSE',
    text: 'Collaborate with other creators. Build shared worlds and grow your community together.',
    button: "LET'S GO! →",
  },
]

const TOOLTIP_W = 440

function clearHighlights() {
  document.querySelectorAll<HTMLElement>('[data-tour]').forEach(el => {
    el.style.boxShadow = ''
    el.style.position = ''
    el.style.zIndex = ''
  })
  const nav = document.querySelector<HTMLElement>('nav')
  if (nav) nav.style.zIndex = ''
}

export default function OnboardingTour() {
  const [active,  setActive]  = useState(false)
  const [step,    setStep]    = useState(0)
  const [rect,    setRect]    = useState<DOMRect | null>(null)
  const [opacity, setOpacity] = useState(1)
  const mountedRef = useRef(true)

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  // Show tour for first-time visitors
  useEffect(() => {
    if (!localStorage.getItem('oodle-creators-onboarded')) setActive(true)
  }, [])

  // Highlight the current step's target element
  useEffect(() => {
    clearHighlights()
    if (!active) return

    const target = STEPS[step].target
    if (!target) { setRect(null); return }

    const el = document.querySelector<HTMLElement>(target)
    if (!el) { setRect(null); return }

    setRect(el.getBoundingClientRect())
    el.style.boxShadow = '0 0 0 3px #FFE600, 0 0 20px rgba(255,230,0,0.4)'
    el.style.position   = 'relative'
    el.style.zIndex     = '9992'

    // Bring the nav above the overlay so the highlighted link is accessible
    const nav = document.querySelector<HTMLElement>('nav')
    if (nav) nav.style.zIndex = '9992'

    return () => { clearHighlights() }
  }, [step, active])

  // Keep rect in sync with window size
  useEffect(() => {
    if (!active) return
    const target = STEPS[step].target
    if (!target) return
    function onResize() {
      const el = document.querySelector<HTMLElement>(target!)
      if (el && mountedRef.current) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [step, active])

  function dismiss() {
    clearHighlights()
    localStorage.setItem('oodle-creators-onboarded', 'true')
    setActive(false)
  }

  function advance() {
    setOpacity(0)
    setTimeout(() => {
      if (!mountedRef.current) return
      if (step >= STEPS.length - 1) { dismiss(); return }
      setStep(s => s + 1)
      // Double rAF ensures browser paints new content at opacity-0 before fading in
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (mountedRef.current) setOpacity(1)
      }))
    }, 150)
  }

  if (!active) return null

  const s = STEPS[step]
  const hasRect = rect != null && rect.width > 0 && rect.height > 0

  let tooltipTop  = 0
  let tooltipLeft = 0
  let arrowLeft   = 0
  let showArrow   = false

  if (hasRect) {
    tooltipTop  = rect.bottom + 16
    tooltipLeft = Math.max(24, Math.min(
      rect.left + rect.width / 2 - TOOLTIP_W / 2,
      window.innerWidth - TOOLTIP_W - 24,
    ))
    // Clamp arrow so it stays inside the tooltip box
    arrowLeft = Math.max(20, Math.min(
      rect.left + rect.width / 2 - tooltipLeft,
      TOOLTIP_W - 20,
    ))
    showArrow = true
  }

  return (
    <>
      {/* Dark overlay — click anywhere to skip */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7,7,13,0.85)',
          zIndex: 9990,
        }}
      />

      {/* Tooltip box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          ...(hasRect
            ? { top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W, maxWidth: 'calc(100vw - 48px)', transform: 'none' }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: TOOLTIP_W, maxWidth: 'calc(100vw - 48px)' }
          ),
          zIndex: 9993,
          background: '#07070d',
          borderTop:    '3px solid #FFE600',
          borderRight:  '1px solid rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          borderLeft:   '1px solid rgba(255,255,255,0.1)',
          padding: '28px 28px 20px',
          opacity,
          transition: 'opacity 150ms ease',
        }}
      >
        {/* CSS triangle arrow — pointing UP toward the highlighted nav element */}
        {showArrow && (
          <div style={{
            position: 'absolute',
            top: -10,
            left: arrowLeft,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft:   '9px solid transparent',
            borderRight:  '9px solid transparent',
            borderBottom: '10px solid #FFE600',
          }} />
        )}

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 11,
          color: '#FFE600',
          margin: '0 0 14px',
          lineHeight: 1.8,
          letterSpacing: 1,
        }}>
          {s.title}
        </h2>

        {/* Body */}
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 14,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.7,
          margin: '0 0 24px',
        }}>
          {s.text}
        </p>

        {/* Footer: progress dots + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {STEPS.map((_, i) => (
              <span key={i} style={{
                fontSize: i <= step ? 10 : 8,
                color: i <= step ? '#FFE600' : 'rgba(255,255,255,0.2)',
                lineHeight: 1,
                transition: 'color 200ms',
              }}>
                {i <= step ? '●' : '○'}
              </span>
            ))}
          </div>

          {/* SKIP + primary action */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={dismiss}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 7,
                color: 'rgba(255,255,255,0.35)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: 1,
                padding: '8px 4px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
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
                padding: '10px 18px',
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
        </div>
      </div>
    </>
  )
}
