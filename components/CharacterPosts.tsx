'use client'

export interface CharacterPost {
  id: string
  content: string
  image_url: string | null
  created_at: string
}

interface Props {
  posts: CharacterPost[]
  characterName: string
  creatorName: string
  characterImageUrl: string | null
}

function formatPostDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default function CharacterPosts({ posts, characterName, creatorName, characterImageUrl }: Props) {
  if (posts.length === 0) return null

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
      <p style={{
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        margin: '0 0 20px',
        letterSpacing: 1,
      }}>
        ✦ UPDATES
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 16px 0',
            }}>
              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                background: '#0e0e1a',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                {characterImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={characterImageUrl}
                    alt={characterName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    🎨
                  </div>
                )}
              </div>

              {/* Name + creator */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: '#ffffff',
                  margin: '0 0 2px',
                  letterSpacing: 0.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                }}>
                  {characterName}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.35)',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  by @{creatorName}
                </p>
              </div>

              {/* Date */}
              <span style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.3)',
                flexShrink: 0,
                lineHeight: 1.4,
              }}>
                {formatPostDate(post.created_at)}
              </span>
            </div>

            {/* ── Content ── */}
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.8,
              margin: 0,
              padding: '12px 16px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {post.content}
            </p>

            {/* ── Optional image ── */}
            {post.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image_url}
                alt=""
                style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
