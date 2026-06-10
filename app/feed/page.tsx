'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface FeedPost {
  id: string
  content: string
  image_url: string | null
  created_at: string
  character_id: string
  character_name: string
  creator_name: string
  character_image_url: string | null
  slug: string
}

function formatPostDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default function FeedPage() {
  const router = useRouter()
  const [posts,       setPosts]       = useState<FeedPost[]>([])
  const [followCount, setFollowCount] = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }
      setAuthChecked(true)

      // Which characters does this user follow?
      const { data: follows } = await supabase
        .from('character_follows')
        .select('character_id')
        .eq('follower_id', user.id)

      const characterIds = (follows ?? []).map(
        (f: { character_id: string }) => f.character_id
      )
      setFollowCount(characterIds.length)

      if (characterIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch posts with joined character info
      const { data: postsData } = await supabase
        .from('character_posts')
        .select('id, content, image_url, created_at, character_id, characters ( character_name, creator_name, image_url, slug )')
        .in('character_id', characterIds)
        .order('created_at', { ascending: false })
        .limit(50)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPosts((postsData ?? []).map((p: any) => ({
        id:                  p.id          as string,
        content:             p.content     as string,
        image_url:           p.image_url   as string | null,
        created_at:          p.created_at  as string,
        character_id:        p.character_id as string,
        character_name:      p.characters?.character_name ?? 'Unknown',
        creator_name:        p.characters?.creator_name  ?? '',
        character_image_url: p.characters?.image_url     ?? null,
        slug:                p.characters?.slug           ?? '',
      })))

      setLoading(false)
    }

    load()
  }, [router])

  // Nothing until we've confirmed the user is signed in
  if (!authChecked) return null

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 'clamp(14px, 3vw, 22px)',
            color: '#FFE600',
            margin: '0 0 12px',
            letterSpacing: 1,
            lineHeight: 1.5,
          }}>
            ✦ MY FEED
          </p>
          <p style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 15,
            color: 'rgba(255,255,255,0.4)',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Updates from characters you follow
          </p>
        </div>

        {/* ── Content ── */}
        {loading ? (

          /* Loading skeleton */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  height: 120,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: 1 - i * 0.2,
                }}
              />
            ))}
          </div>

        ) : followCount === 0 ? (

          /* Empty state — not following anyone */
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(9px, 2vw, 12px)',
              color: 'rgba(255,255,255,0.35)',
              margin: '0 0 14px',
              letterSpacing: 1,
              lineHeight: 1.8,
            }}>
              YOU'RE NOT FOLLOWING ANYONE YET
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.3)',
              margin: '0 0 32px',
              lineHeight: 1.7,
            }}>
              Follow characters to see their updates here
            </p>
            <Link
              href="/gallery"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                color: '#07070d',
                background: '#FFE600',
                textDecoration: 'none',
                padding: '14px 24px',
                letterSpacing: 1,
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              EXPLORE GALLERY →
            </Link>
          </div>

        ) : posts.length === 0 ? (

          /* Empty state — following but no posts */
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(9px, 2vw, 12px)',
              color: 'rgba(255,255,255,0.35)',
              margin: '0 0 14px',
              letterSpacing: 1,
              lineHeight: 1.8,
            }}>
              NO UPDATES YET
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.3)',
              margin: 0,
              lineHeight: 1.7,
            }}>
              The characters you follow haven&apos;t posted anything yet
            </p>
          </div>

        ) : (

          /* Feed */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => (
              <div
                key={post.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}
              >
                {/* ── Card header ── */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px 0',
                }}>
                  {/* Avatar */}
                  <Link href={`/p/${post.slug}`} style={{ flexShrink: 0, display: 'block', textDecoration: 'none' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: '#0e0e1a',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.07)',
                        transition: 'border-color 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFE600')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                    >
                      {post.character_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.character_image_url}
                          alt={post.character_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          🎨
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Name + creator */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/p/${post.slug}`}
                      style={{
                        fontFamily: 'var(--font-pixel), monospace',
                        fontSize: 9,
                        color: '#ffffff',
                        textDecoration: 'none',
                        letterSpacing: 0.5,
                        lineHeight: 1.5,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: 2,
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FFE600')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#ffffff')}
                    >
                      {post.character_name}
                    </Link>
                    <p style={{
                      fontFamily: 'var(--font-body), sans-serif',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.35)',
                      margin: 0,
                      lineHeight: 1.4,
                    }}>
                      by @{post.creator_name}
                    </p>
                  </div>

                  {/* Timestamp */}
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

                {/* ── Post content ── */}
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
        )}
      </div>
    </div>
  )
}
