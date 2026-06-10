import Link from 'next/link'
import { formatNumber } from '../lib/utils'

export interface UniverseCardProps {
  name: string
  slug: string
  coverImageUrl: string | null
  memberCount: number
  characterCount: number
  ownerName: string
}

export default function UniverseCard({
  name,
  slug,
  coverImageUrl,
  memberCount,
  characterCount,
  ownerName,
}: UniverseCardProps) {
  return (
    <Link
      href={`/u/${slug}`}
      className="character-card"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      {/* Cover image — 16:9 */}
      <div style={{
        aspectRatio: '16/9',
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
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: 32, opacity: 0.25 }}>🌐</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 10,
          color: '#ffffff',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {name}
        </span>
        <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          by @{ownerName}
        </span>
        <div style={{
          display: 'flex',
          gap: 14,
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 12,
          color: 'rgba(255,255,255,0.35)',
          marginTop: 2,
        }}>
          <span>👥 {formatNumber(memberCount)}</span>
          <span>🎨 {formatNumber(characterCount)}</span>
        </div>
      </div>
    </Link>
  )
}
