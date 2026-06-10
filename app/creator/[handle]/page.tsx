import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '../../../lib/supabase'
import CharacterCard from '../../../components/CharacterCard'
import { formatNumber } from '../../../lib/utils'

interface Character {
  id: string
  character_name: string
  creator_name: string
  image_url: string | null
  likes: number
  fans: number
  slug: string
}

/* cache() deduplicates the query — generateMetadata and the page
   component both call this, but Supabase only runs the DB round-trip once. */
const getCreatorCharacters = cache(async (handle: string): Promise<Character[]> => {
  const { data } = await supabase
    .from('characters')
    .select('id, character_name, creator_name, image_url, likes, fans, slug')
    .eq('creator_name', handle)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  return (data ?? []) as Character[]
})

export async function generateMetadata(
  { params }: { params: Promise<{ handle: string }> }
): Promise<Metadata> {
  const { handle } = await params
  const chars = await getCreatorCharacters(handle)
  if (chars.length === 0) return { title: 'Not Found — Oodle Creators' }

  const title = `@${handle} — Oodle Creators`
  const description = `${chars.length} original character${chars.length !== 1 ? 's' : ''} by @${handle} on Oodle Creators.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: chars[0].image_url ? [{ url: chars[0].image_url }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function CreatorPage(
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const characters = await getCreatorCharacters(handle)

  if (characters.length === 0) notFound()

  const totalLikes = characters.reduce((sum, c) => sum + c.likes, 0)
  const totalFans  = characters.reduce((sum, c) => sum + c.fans, 0)

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Back link */}
        <Link
          href="/gallery"
          style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 13,
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 40,
          }}
        >
          ← GALLERY
        </Link>

        {/* ── Creator header ──────────────────────────────────── */}
        <div style={{ marginBottom: 64 }}>
          <span style={{
            display: 'inline-block',
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 7,
            background: '#FFE600',
            color: '#07070d',
            padding: '4px 10px',
            marginBottom: 20,
            letterSpacing: 1,
          }}>
            ✦ CREATOR
          </span>

          <h1 style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 'clamp(16px, 4vw, 24px)',
            color: '#FFE600',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}>
            @{handle}
          </h1>

          <p style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 14,
            color: 'rgba(255,255,255,0.45)',
            margin: 0,
            lineHeight: 1,
          }}>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{characters.length}</span>
            {characters.length === 1 ? ' character' : ' characters'}
            {' · '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{formatNumber(totalLikes)}</span>
            {' total likes'}
            {' · '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{formatNumber(totalFans)}</span>
            {' total fans'}
          </p>
        </div>

        {/* ── Characters grid ──────────────────────────────────── */}
        <h2 style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 11,
          color: '#ffffff',
          margin: '0 0 32px',
          letterSpacing: 1,
        }}>
          CHARACTERS BY @{handle}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.07)',
        }}>
          {characters.map(c => (
            <div key={c.id} style={{ background: '#07070d' }}>
              <CharacterCard
                characterName={c.character_name}
                creatorHandle={c.creator_name}
                imageUrl={c.image_url ?? undefined}
                likes={c.likes}
                fans={c.fans}
                slug={c.slug}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
