'use client'

import { Fragment, useRef, useEffect, useState } from 'react'

const STEPS = [
  {
    num: '01',
    icon: '📤',
    title: 'UPLOAD YOUR CHARACTER',
    desc: 'Upload any image of your character — plush doll photo, illustration, toy design, AI art. Add your character\'s name, backstory, and style.',
  },
  {
    num: '02',
    icon: '🌏',
    title: 'GET DISCOVERED',
    desc: 'Your character appears in the global gallery instantly. Collectors and fans worldwide discover and follow your IP.',
  },
  {
    num: '03',
    icon: '🚀',
    title: 'BUILD & MONETIZE',
    desc: 'Build your fanbase. Unlock merchandise drops, fan tips, and brand licensing opportunities.',
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}
    >
      {/* ── Section title ── */}
      <div style={{ marginBottom: 64, textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 'clamp(13px, 2vw, 20px)',
          color: '#ffffff',
          margin: '0 0 16px',
          letterSpacing: 1,
          display: 'inline-block',
        }}>
          HOW IT WORKS
        </h2>
        {/* Yellow underline accent */}
        <div style={{ width: 60, height: 3, background: '#FFE600', margin: '0 auto' }} />
      </div>

      {/* ── Steps row ── */}
      <div className="hiw-row">
        {STEPS.map((step, i) => (
          <Fragment key={step.num}>

            {/* Animated arrow between steps — CSS hides on mobile */}
            {i > 0 && (
              <div
                className="hiw-arrow"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.4s ease ${i * 0.2 - 0.05}s`,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 20,
                  color: '#FFE600',
                  display: 'block',
                  animation: visible ? 'pulse-arrow 1.6s ease-in-out infinite' : 'none',
                }}>
                  →
                </span>
              </div>
            )}

            {/* Step card */}
            <div style={{
              flex: 1,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              padding: '40px',
              // Scroll-triggered fade-up, staggered per card
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: `opacity 0.55s ease ${i * 0.2}s, transform 0.55s ease ${i * 0.2}s`,
            }}>

              {/* Step number */}
              <div style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 11,
                color: '#FFE600',
                marginBottom: 20,
                letterSpacing: 2,
              }}>
                {step.num}
              </div>

              {/* Icon */}
              <div style={{ fontSize: 36, marginBottom: 20, lineHeight: 1 }}>
                {step.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 12,
                color: '#ffffff',
                margin: '0 0 16px',
                lineHeight: 1.8,
                letterSpacing: 0.5,
              }}>
                {step.title}
              </h3>

              {/* Description */}
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.75,
                margin: 0,
              }}>
                {step.desc}
              </p>

            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}
