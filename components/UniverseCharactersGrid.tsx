'use client'

import Link from 'next/link'
import CharacterCard from './CharacterCard'

export interface UniverseCharacter {
  id: string
  character_name: string
  creator_name: string
  image_url: string | null
  likes: number
  fans: number
  slug: string
}

interface Props {
  characters: UniverseCharacter[]
  universeSlug: string
}

export default function UniverseCharactersGrid({ characters, universeSlug }: Props) {
  return (
    <div style={{ marginBottom: 56 }}>
      <p style={{
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        margin: '0 0 20px',
        letterSpacing: 1,
      }}>
        ✦ CHARACTERS
      </p>

      {/* Manage link — lives here so event handlers stay in a client component */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Link
          href={`/u/${universeSlug}/invite`}
          style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 8,
            color: 'rgba(255,255,255,0.45)',
            textDecoration: 'none',
            padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.12)',
            letterSpacing: 1,
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
          }}
        >
          ⚙ MANAGE
        </Link>
      </div>

      {characters.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 14,
          color: 'rgba(255,255,255,0.2)',
          margin: 0,
        }}>
          No characters in this universe yet — join and add yours!
        </p>
      ) : (
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
      )}
    </div>
  )
}
