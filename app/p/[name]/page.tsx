import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '../../../lib/supabase'
import CopyLinkButton from '../../../components/CopyLinkButton'
import LikeFollowButtons from '../../../components/LikeFollowButtons'
import CharacterCard from '../../../components/CharacterCard'
import { formatDate } from '../../../lib/utils'
import CreatorToolbar from '../../../components/CreatorToolbar'

interface Character {
  id: string
  character_name: string
  creator_name: string
  bio: string | null
  image_url: string | null
  style_tags: string[]
  likes: number
  fans: number
  has_talent: boolean
  talent_type: string | null
  pixel_data: Record<string, unknown> | null
  created_at: string
  slug: string
  user_id: string
  personality:  string[] | null
  emotions:     string[] | null
  catchphrase:  string | null
  world_origin: string | null
  race:         string | null
  occupation:   string | null
  abilities:    string | null
  weaknesses:   string | null
}

async function getCharacter(slug: string): Promise<Character | null> {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()
  return (data as Character | null) ?? null
}

async function getRelated(userId: string, charId: string): Promise<Character[]> {
  const { data } = await supabase
    .from('characters')
    .select('id, character_name, creator_name, image_url, likes, fans, slug')
    .eq('user_id', userId)
    .eq('is_public', true)
    .neq('id', charId)
    .limit(3)
  return (data ?? []) as Character[]
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  const char = await getCharacter(name)
  if (!char) return { title: 'Not Found — Oodle Creators' }

  const title = `${char.character_name} by @${char.creator_name} — Oodle Creators`
  const rawDesc = char.bio?.trim()
  const description = rawDesc
    ? rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc
    : `Discover ${char.character_name}, an original character IP by @${char.creator_name} on Oodle Creators.`
  const url = `https://oodle-creators.vercel.app/p/${char.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url,
      images: char.image_url
        ? [{ url: char.image_url, width: 1200, height: 630, alt: char.character_name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: char.image_url ? [char.image_url] : undefined,
    },
  }
}

export default async function CharacterPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const char = await getCharacter(name)
  if (!char) notFound()

  const related = await getRelated(char.user_id, char.id)
  const shareUrl = `https://oodle-creators.vercel.app/p/${char.slug}`
  const tweetText = `Check out ${char.character_name} on Oodle Creators! ${shareUrl}`

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 96px' }}>

        <Link href="/gallery" style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← GALLERY
        </Link>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gap: 60, alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">

          {/* LEFT — artwork */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Main image */}
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
              {char.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={char.image_url}
                  alt={char.character_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span style={{ fontSize: 64, opacity: 0.3 }}>🎨</span>
              )}
            </div>

            {/* Share row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {char.image_url && (
                <a
                  href={char.image_url}
                  download={`${char.slug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-pixel), monospace',
                    fontSize: 8,
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '10px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    letterSpacing: 1,
                  }}
                >
                  ⬇ DOWNLOAD PNG
                </a>
              )}
              <CopyLinkButton url={shareUrl} />
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  letterSpacing: 1,
                }}
              >
                𝕏 SHARE
              </a>
            </div>
          </div>

          {/* RIGHT — info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Badge + name */}
            <div>
              <span style={{
                display: 'inline-block',
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 7,
                background: '#FFE600',
                color: '#07070d',
                padding: '4px 10px',
                marginBottom: 16,
                letterSpacing: 1,
              }}>
                ✦ CREATOR
              </span>
              <h1 style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 'clamp(18px, 3vw, 28px)',
                color: '#ffffff',
                margin: '0 0 10px',
                lineHeight: 1.5,
              }}>
                {char.character_name}
              </h1>
              <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 16, color: '#FFE600', margin: '0 0 20px' }}>
                by{' '}
                <Link
                  href={`/creator/${char.creator_name}`}
                  style={{ color: '#FFE600', textDecoration: 'underline', textDecorationColor: 'rgba(255,230,0,0.35)' }}
                >
                  @{char.creator_name}
                </Link>
              </p>

              {/* Stats */}
              <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                ❤ {char.likes} · 👥 {char.fans} fans · 📅 {formatDate(char.created_at)}
              </p>
            </div>

            {/* Bio */}
            {char.bio && (
              <p style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.8,
                margin: 0,
              }}>
                {char.bio}
              </p>
            )}

            {/* Like / Follow */}
            <LikeFollowButtons
              characterId={char.id}
              initialLikes={char.likes}
              initialFans={char.fans}
            />

            {/* Style tags */}
            {char.style_tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {char.style_tags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '5px 14px',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CHARACTER PROFILE */}
            {(
              (char.personality?.length ?? 0) > 0 ||
              (char.emotions?.length ?? 0) > 0 ||
              !!char.catchphrase ||
              !!char.world_origin ||
              !!char.race ||
              !!char.occupation ||
              !!char.abilities ||
              !!char.weaknesses
            ) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
                <p style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  margin: '0 0 20px',
                  letterSpacing: 1,
                }}>✦ CHARACTER PROFILE</p>

                {/* Personality pills */}
                {(char.personality?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', letterSpacing: 1 }}>PERSONALITY</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {char.personality!.map(p => (
                        <span key={p} style={{
                          fontFamily: 'var(--font-pixel), monospace',
                          fontSize: 9,
                          padding: '6px 12px',
                          background: '#FFE600',
                          color: '#07070d',
                          letterSpacing: 0.5,
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emotions pills */}
                {(char.emotions?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', letterSpacing: 1 }}>EMOTIONS</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {char.emotions!.map(em => (
                        <span key={em} style={{
                          fontFamily: 'var(--font-body), sans-serif',
                          fontSize: 13,
                          padding: '5px 12px',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.8)',
                          border: '1px solid rgba(255,255,255,0.15)',
                        }}>{em}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catchphrase */}
                {char.catchphrase && (
                  <div style={{ position: 'relative', borderLeft: '3px solid #FFE600', paddingLeft: 16, margin: '0 0 20px' }}>
                    <span style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 48,
                      color: '#FFE600',
                      lineHeight: 1,
                      position: 'absolute',
                      top: -8,
                      left: 10,
                      opacity: 0.3,
                      userSelect: 'none',
                    }}>&quot;</span>
                    <p style={{
                      fontFamily: 'var(--font-body), sans-serif',
                      fontSize: 16,
                      color: '#FFE600',
                      fontStyle: 'italic',
                      margin: 0,
                      paddingTop: 6,
                      lineHeight: 1.7,
                    }}>{char.catchphrase}</p>
                  </div>
                )}

                {/* Stats grid */}
                {(char.world_origin || char.race || char.occupation || char.abilities) && (
                  <div style={{ display: 'grid', gap: 20, marginBottom: 16 }} className="grid-cols-1 sm:grid-cols-2">
                    {char.world_origin && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>WORLD</p>
                        <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{char.world_origin}</p>
                      </div>
                    )}
                    {char.race && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>RACE</p>
                        <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{char.race}</p>
                      </div>
                    )}
                    {char.occupation && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>OCCUPATION</p>
                        <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{char.occupation}</p>
                      </div>
                    )}
                    {char.abilities && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>ABILITIES</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {String(char.abilities).split(',').map(a => a.trim()).filter(Boolean).map(a => (
                            <span key={a} style={{
                              fontFamily: 'var(--font-body), sans-serif',
                              fontSize: 12,
                              padding: '4px 10px',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.6)',
                            }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Weaknesses */}
                {char.weaknesses && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px', letterSpacing: 1 }}>WEAKNESSES</p>
                    <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.7 }}>{char.weaknesses}</p>
                  </div>
                )}
              </div>
            )}

            {/* Talent section */}
            {char.has_talent && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
                <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 10, color: '#FFE600', margin: '0 0 16px', letterSpacing: 1 }}>
                  ✦ TALENTS
                </p>
                {char.talent_type && (
                  <span style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-pixel), monospace',
                    fontSize: 9,
                    color: '#07070d',
                    background: '#FFE600',
                    padding: '6px 14px',
                    letterSpacing: 1,
                  }}>
                    {char.talent_type === 'draw' ? '🎨 TRICK ART' : '💃 DANCE'}
                  </span>
                )}
              </div>
            )}

            {/* Oodle game section */}
            {char.pixel_data && (
              <div style={{
                background: 'rgba(255,230,0,0.04)',
                border: '1px solid rgba(255,230,0,0.15)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}>
                <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', flex: 1 }}>
                  🎮 This character is also alive in the Oodle pixel game
                </span>
                <Link href="https://oodle.vercel.app" target="_blank" style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#07070d',
                  background: '#FFE600',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  whiteSpace: 'nowrap',
                  letterSpacing: 1,
                }}>
                  MEET IN GAME →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Related characters */}
        {related.length > 0 && (
          <div style={{ marginTop: 80, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 13, color: '#ffffff', margin: '0 0 32px' }}>
              MORE FROM THIS CREATOR
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.07)', maxWidth: 720 }}>
              {related.map(r => (
                <div key={r.id} style={{ background: '#07070d' }}>
                  <CharacterCard
                    characterName={r.character_name}
                    creatorHandle={r.creator_name}
                    imageUrl={r.image_url ?? undefined}
                    likes={r.likes}
                    fans={r.fans}
                    slug={r.slug}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shown only to the character owner — client-side auth check */}
      <CreatorToolbar userId={char.user_id} slug={char.slug} />
    </div>
  )
}
