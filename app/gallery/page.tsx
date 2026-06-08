'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import CharacterCard from '../../components/CharacterCard'

type Filter = 'newest' | 'most_liked' | 'has_talent'

interface Character {
  id: string
  character_name: string
  creator_name: string
  image_url: string | null
  likes: number
  fans: number
  slug: string
  has_talent: boolean
  created_at: string
}

export default function GalleryPage() {
  const [filter, setFilter] = useState<Filter>('newest')
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCharacters()
  }, [filter])

  async function fetchCharacters() {
    setLoading(true)

    let query = supabase
      .from('characters')
      .select('id, character_name, creator_name, image_url, likes, fans, slug, has_talent, created_at')
      .eq('is_public', true)

    if (filter === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (filter === 'most_liked') {
      query = query.order('likes', { ascending: false })
    } else if (filter === 'has_talent') {
      query = query.eq('has_talent', true).order('created_at', { ascending: false })
    }

    const { data, error } = await query.limit(60)
    if (!error) setCharacters((data ?? []) as Character[])
    setLoading(false)
  }

  const TABS: { key: Filter; label: string }[] = [
    { key: 'newest',    label: 'NEWEST' },
    { key: 'most_liked', label: 'MOST LIKED' },
    { key: 'has_talent', label: 'HAS TALENT' },
  ]

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <Link href="/" style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
              ← Back
            </Link>
            <h1 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 'clamp(14px, 3vw, 22px)', color: '#ffffff', margin: '0 0 10px' }}>
              CREATOR GALLERY
            </h1>
            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Discover original character IPs from creators worldwide
            </p>
          </div>
          <Link href="/create" style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 9,
            color: '#07070d',
            background: '#FFE600',
            textDecoration: 'none',
            padding: '12px 20px',
            letterSpacing: 1,
            alignSelf: 'flex-end',
          }}>
            SHARE YOUR IP →
          </Link>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                padding: '10px 18px',
                border: '1px solid',
                borderColor: filter === tab.key ? '#FFE600' : 'rgba(255,255,255,0.2)',
                background: filter === tab.key ? '#FFE600' : 'transparent',
                color: filter === tab.key ? '#07070d' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                letterSpacing: 1,
                transition: 'all 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 1,
            background: 'rgba(255,255,255,0.07)',
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                background: '#0d0d16',
                aspectRatio: '1',
              }} className="skeleton" />
            ))}
          </div>
        ) : characters.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
                  isVerified
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              NO CHARACTERS FOUND
            </p>
            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>
              Be the first to share your IP
            </p>
            <Link href="/create" style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 10,
              color: '#07070d',
              background: '#FFE600',
              textDecoration: 'none',
              padding: '14px 24px',
            }}>
              SHARE YOUR IP →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
