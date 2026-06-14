import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '../../../lib/supabase'
import UniverseActionButtons from '../../../components/UniverseActionButtons'
import UniverseCharactersGrid, { type UniverseCharacter } from '../../../components/UniverseCharactersGrid'
import UniverseDeletionBanner from '../../../components/UniverseDeletionBanner'
import { formatNumber } from '../../../lib/utils'

/* ── Types ── */

interface Universe {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  owner_id: string
  owner_name: string
  member_count: number
  character_count: number
  follower_count: number
  is_public: boolean
  created_at: string
}

interface Member {
  user_id: string
  role: string
  display_name: string | null
  avatar_url: string | null
}

interface UniverseUpdate {
  id: string
  content: string
  image_url: string | null
  created_at: string
  character_name: string
  creator_name: string
  character_image_url: string | null
  slug: string
}

/* ── Data fetchers ── */

async function getUniverse(slug: string): Promise<Universe | null> {
  const { data } = await supabase
    .from('universes')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()
  return (data as Universe | null) ?? null
}

async function getMembers(universeId: string): Promise<Member[]> {
  const { data } = await supabase
    .from('universe_members')
    .select('user_id, role, profiles ( display_name, avatar_url )')
    .eq('universe_id', universeId)
    .order('created_at', { ascending: true })
    .limit(20)

  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(m => ({
    user_id:      m.user_id as string,
    role:         m.role    as string,
    display_name: (m.profiles as { display_name: string | null } | null)?.display_name ?? null,
    avatar_url:   (m.profiles as { avatar_url:   string | null } | null)?.avatar_url   ?? null,
  }))
}

async function getUniverseCharacters(universeId: string): Promise<UniverseCharacter[]> {
  const { data } = await supabase
    .from('universe_characters')
    .select('characters ( id, character_name, creator_name, image_url, likes, fans, slug )')
    .eq('universe_id', universeId)
    .order('created_at', { ascending: false })
    .limit(24)

  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .map(r => r.characters)
    .filter(Boolean) as UniverseCharacter[]
}

async function getUniverseUpdates(universeId: string): Promise<UniverseUpdate[]> {
  // Get character_ids in this universe first
  const { data: ucData } = await supabase
    .from('universe_characters')
    .select('character_id')
    .eq('universe_id', universeId)

  if (!ucData || ucData.length === 0) return []

  const characterIds = ucData.map((r: { character_id: string }) => r.character_id)

  const { data } = await supabase
    .from('character_posts')
    .select('id, content, image_url, created_at, character_id, characters ( character_name, creator_name, image_url, slug )')
    .in('character_id', characterIds)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(p => ({
    id:                  p.id          as string,
    content:             p.content     as string,
    image_url:           p.image_url   as string | null,
    created_at:          p.created_at  as string,
    character_name:      p.characters?.character_name ?? 'Unknown',
    creator_name:        p.characters?.creator_name  ?? '',
    character_image_url: p.characters?.image_url     ?? null,
    slug:                p.characters?.slug           ?? '',
  }))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/* ── Metadata ── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const universe = await getUniverse(slug)
  if (!universe) return { title: 'Not Found — Oodle Creators' }

  const title = `${universe.name} — Oodle Creators Universe`
  const description = universe.description
    ?? `A shared creator universe on Oodle Creators, built by @${universe.owner_name}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: universe.cover_image_url
        ? [{ url: universe.cover_image_url, width: 1200, height: 630, alt: universe.name }]
        : [],
    },
  }
}

/* ── Page ── */

export default async function UniversePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const universe = await getUniverse(slug)
  if (!universe) notFound()

  const [members, characters, updates] = await Promise.all([
    getMembers(universe.id),
    getUniverseCharacters(universe.id),
    getUniverseUpdates(universe.id),
  ])

  const isOwner = false // determined client-side by UniverseActionButtons

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>

      {/* ── Cover image with gradient overlay ── */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden', maxHeight: 300 }}>
        {universe.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={universe.cover_image_url}
            alt={universe.name}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            height: 220,
            background: 'linear-gradient(135deg, rgba(255,230,0,0.08) 0%, rgba(123,123,255,0.06) 50%, rgba(7,7,13,1) 100%)',
          }} />
        )}
        {/* Bottom fade to page background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(7,7,13,0) 30%, rgba(7,7,13,0.7) 75%, #07070d 100%)',
        }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 96px' }}>

        {/* ── Back link ── */}
        <Link
          href="/universes"
          style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 24, marginTop: 8 }}
        >
          ← UNIVERSES
        </Link>

        {/* ── Deletion consent banner (client island, visible only to members with a pending vote) ── */}
        <UniverseDeletionBanner universeId={universe.id} />

        {/* ── Universe header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 'clamp(16px, 3.5vw, 28px)',
            color: '#ffffff',
            margin: '0 0 16px',
            lineHeight: 1.5,
            letterSpacing: 1,
          }}>
            {universe.name}
          </h1>

          {universe.description && (
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.8,
              margin: '0 0 20px',
              maxWidth: 680,
            }}>
              {universe.description}
            </p>
          )}

          {/* Stats */}
          <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
            👥 {formatNumber(universe.member_count ?? 0)} members
            {' · '}
            🎨 {formatNumber(universe.character_count ?? 0)} characters
            {' · '}
            ❤ {formatNumber(universe.follower_count ?? 0)} followers
            {' · '}
            by{' '}
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>@{universe.owner_name}</span>
          </p>

          {/* Action buttons — client component handles follow / join */}
          <UniverseActionButtons universeId={universe.id} />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 48 }}>

          {/* ── Members ── */}
          {members.length > 0 && (
            <div style={{ marginBottom: 56 }}>
              <p style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 10,
                color: 'rgba(255,255,255,0.35)',
                margin: '0 0 20px',
                letterSpacing: 1,
              }}>
                ✦ MEMBERS
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {members.map(m => (
                  <div key={m.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48,
                      height: 48,
                      background: m.avatar_url ? '#0e0e1a' : '#FFE600',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: m.role === 'owner' ? '2px solid #FFE600' : '1px solid rgba(255,255,255,0.07)',
                      flexShrink: 0,
                    }}>
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.avatar_url}
                          alt={m.display_name ?? ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 14, color: '#07070d', lineHeight: 1 }}>
                          {(m.display_name ?? '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Name + role */}
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 7, color: '#ffffff', margin: '0 0 2px', letterSpacing: 0.5, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.display_name ?? 'Creator'}
                      </p>
                      {m.role === 'owner' && (
                        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 6, color: '#FFE600', letterSpacing: 0.5 }}>
                          OWNER
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Characters + Manage link — client component ── */}
          <UniverseCharactersGrid
            characters={characters}
            universeSlug={universe.slug}
          />

          {/* ── Updates ── */}
          {updates.length > 0 && (
            <div>
              <p style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 10,
                color: 'rgba(255,255,255,0.35)',
                margin: '0 0 20px',
                letterSpacing: 1,
              }}>
                ✦ UPDATES
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
                {updates.map(post => (
                  <div
                    key={post.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Post header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 0' }}>
                      <Link href={`/p/${post.slug}`} style={{ flexShrink: 0, display: 'block', textDecoration: 'none' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          background: '#0e0e1a',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}>
                          {post.character_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.character_image_url} alt={post.character_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, opacity: 0.4 }}>🎨</div>
                          )}
                        </div>
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/p/${post.slug}`}
                          style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: '#ffffff', textDecoration: 'none', letterSpacing: 0.5, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}
                        >
                          {post.character_name}
                        </Link>
                        <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                          by @{post.creator_name}
                        </p>
                      </div>
                      <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                        {formatDate(post.created_at)}
                      </span>
                    </div>

                    {/* Content */}
                    <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: 0, padding: '10px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {post.content}
                    </p>

                    {post.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
