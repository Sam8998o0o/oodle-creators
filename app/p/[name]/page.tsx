import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '../../../lib/supabase'
import CopyLinkButton from '../../../components/CopyLinkButton'
import LikeFollowButtons from '../../../components/LikeFollowButtons'
import CharacterCard from '../../../components/CharacterCard'
import { formatDate } from '../../../lib/utils'

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
  return {
    title: `${char.character_name} — Oodle Creators`,
    description: char.bio ?? `An original character created by ${char.creator_name}.`,
    openGraph: {
      title: `${char.character_name} — Oodle Creators`,
      description: char.bio ?? `Check out this character on Oodle Creators!`,
      images: char.image_url ? [{ url: char.image_url }] : [],
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        <Link href="/gallery" style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← GALLERY
        </Link>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">

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
                by @{char.creator_name}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.07)', maxWidth: 720 }}>
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
    </div>
  )
}
