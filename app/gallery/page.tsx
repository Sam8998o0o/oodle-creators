'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [filter,       setFilter]       = useState<Filter>('newest')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchInput,  setSearchInput]  = useState('')
  const [searchTerm,   setSearchTerm]   = useState('')
  const [characters,   setCharacters]   = useState<Character[]>([])
  const [loading,      setLoading]      = useState(true)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Debounce: commit searchTerm 300ms after typing stops */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchTerm(searchInput.trim()), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  useEffect(() => {
    fetchCharacters(filter, selectedTags, searchTerm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, selectedTags, searchTerm])

  async function fetchCharacters(activeFilter: Filter, activeTags: string[], activeSearch: string) {
    setLoading(true)

    let query = supabase
      .from('characters')
      .select('id, character_name, creator_name, image_url, likes, fans, slug, has_talent, created_at')
      .eq('is_public', true)

    if (activeFilter === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (activeFilter === 'most_liked') {
      query = query.order('likes', { ascending: false })
    } else if (activeFilter === 'has_talent') {
      query = query.eq('has_talent', true).order('created_at', { ascending: false })
    }

    if (activeTags.length > 0) {
      query = query.contains('style_tags', activeTags)
    }

    if (activeSearch) {
      query = query.or(`character_name.ilike.%${activeSearch}%,creator_name.ilike.%${activeSearch}%`)
    }

    const { data, error } = await query.limit(60)
    if (!error) setCharacters((data ?? []) as Character[])
    setLoading(false)
  }

  const STYLE_TAGS = ['Hand-drawn', 'Digital Art', 'AI Generated', '3D', 'Photography', 'Other']

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

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          {/* Search icon */}
          <span style={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            🔍
          </span>

          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="SEARCH CHARACTERS..."
            className="gallery-search"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 11,
              padding: '16px 52px',
              outline: 'none',
              letterSpacing: 1,
              transition: 'border-color 150ms',
            }}
            onFocus={e => (e.target.style.borderColor = '#FFE600')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />

          {/* Clear button — only visible when input has text */}
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 18,
                lineHeight: 1,
                padding: '4px 8px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="scrollable-pills" style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', flexWrap: 'nowrap' }}>
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

        {/* Style tag filter pills */}
        <div className="scrollable-pills" style={{ display: 'flex', gap: 8, marginBottom: 40, overflowX: 'auto', flexWrap: 'nowrap' }}>
          {/* ALL pill — selected when no tags are active */}
          <button
            onClick={() => setSelectedTags([])}
            style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 9,
              padding: '8px 16px',
              border: '1px solid',
              borderColor: selectedTags.length === 0 ? '#FFE600' : 'rgba(255,255,255,0.15)',
              background: selectedTags.length === 0 ? '#FFE600' : 'transparent',
              color: selectedTags.length === 0 ? '#07070d' : 'rgba(255,255,255,0.55)',
              cursor: 'pointer',
              letterSpacing: 1,
              transition: 'all 150ms',
            }}
          >
            ALL
          </button>

          {STYLE_TAGS.map(tag => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags(prev =>
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  )
                }
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  padding: '8px 16px',
                  border: '1px solid',
                  borderColor: active ? '#FFE600' : 'rgba(255,255,255,0.15)',
                  background: active ? '#FFE600' : 'transparent',
                  color: active ? '#07070d' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  transition: 'all 150ms',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
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
              {searchTerm
                ? `NO RESULTS FOR "${searchTerm.toUpperCase()}"`
                : 'NO CHARACTERS FOUND'}
            </p>
            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>
              {searchTerm
                ? 'Try a different search term or adjust the filters'
                : 'Be the first to share your IP'}
            </p>
            {!searchTerm && (
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
