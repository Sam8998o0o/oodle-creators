import Link from 'next/link'
import { formatNumber } from '../lib/utils'

export interface CharacterCardProps {
  imageUrl?: string
  characterName: string
  creatorHandle: string
  likes: number
  fans: number
  isVerified?: boolean
  isCTA?: boolean
  slug?: string
}

export default function CharacterCard({
  imageUrl,
  characterName,
  creatorHandle,
  likes,
  fans,
  isVerified,
  isCTA,
  slug,
}: CharacterCardProps) {

  if (isCTA) {
    return (
      <Link href="/create" style={{
        background: 'rgba(255,230,0,0.05)',
        border: '1px solid rgba(255,230,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 'auto',
        textDecoration: 'none',
        padding: '32px 24px',
        gap: 16,
        minHeight: 220,
      }}
      className="character-card"
      >
        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 10, color: '#FFE600', textAlign: 'center', lineHeight: 1.8 }}>
          ✦ YOUR CHARACTER<br />COULD BE HERE
        </span>
        <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          SHARE YOUR IP<br />Be discovered →
        </span>
      </Link>
    )
  }

  const href = slug ? `/p/${slug}` : '#'

  return (
    <Link href={href} style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'block',
      textDecoration: 'none',
      position: 'relative',
    }}
    className="character-card"
    >
      {isVerified && (
        <span style={{
          position: 'absolute',
          top: 8, right: 8,
          background: '#FFE600',
          color: '#07070d',
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 7,
          padding: '3px 6px',
          zIndex: 1,
          letterSpacing: 0.5,
        }}>
          ✦ CREATOR
        </span>
      )}

      {/* Image */}
      <div style={{
        aspectRatio: '1',
        background: '#0e0e1a',
        backgroundImage: `
          repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 24px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 24px)
        `,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={characterName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{ fontSize: 36, opacity: 0.4 }}>🎨</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 10, color: '#ffffff' }}>
          {characterName}
        </span>
        <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          by @{creatorHandle}
        </span>
        <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          <span>❤ {formatNumber(likes)}</span>
          <span>👥 {formatNumber(fans)}</span>
        </div>
      </div>
    </Link>
  )
}
