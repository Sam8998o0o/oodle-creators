'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

interface UniverseInfo {
  id: string
  name: string
  slug: string
  owner_id: string
}

interface CharacterResult {
  id: string
  character_name: string
  creator_name: string
  image_url: string | null
  slug: string
}

interface UniverseChar {
  id: string        // universe_characters row id
  character_id: string
  character_name: string
  creator_name: string
  image_url: string | null
  slug: string
}

export default function InvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()

  const [slug,        setSlug]        = useState('')
  const [universe,    setUniverse]    = useState<UniverseInfo | null>(null)
  const [isOwner,     setIsOwner]     = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const [query,         setQuery]         = useState('')
  const [searchResults, setSearchResults] = useState<CharacterResult[]>([])
  const [searching,     setSearching]     = useState(false)
  const [adding,        setAdding]        = useState<string | null>(null)   // character_id being added
  const [removing,      setRemoving]      = useState<string | null>(null)   // row id being removed

  const [members, setMembers] = useState<UniverseChar[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Resolve slug from params
  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  // Auth guard + owner check
  useEffect(() => {
    if (!slug) return
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data: uData } = await supabase
        .from('universes')
        .select('id, name, slug, owner_id')
        .eq('slug', slug)
        .maybeSingle()

      if (!uData) { router.replace('/universes'); return }
      setUniverse(uData as UniverseInfo)

      if (uData.owner_id !== user.id) {
        router.replace(`/u/${slug}`)
        return
      }
      setIsOwner(true)
      setAuthChecked(true)
    }
    init()
  }, [slug, router])

  // Load current universe characters
  const loadMembers = useCallback(async (universeId: string) => {
    setLoadingMembers(true)
    const { data } = await supabase
      .from('universe_characters')
      .select('id, character_id, characters ( character_name, creator_name, image_url, slug )')
      .eq('universe_id', universeId)
      .order('created_at', { ascending: false })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMembers((data as any[]).map(r => ({
        id:             r.id,
        character_id:   r.character_id,
        character_name: r.characters?.character_name ?? 'Unknown',
        creator_name:   r.characters?.creator_name  ?? '',
        image_url:      r.characters?.image_url     ?? null,
        slug:           r.characters?.slug          ?? '',
      })))
    }
    setLoadingMembers(false)
  }, [])

  useEffect(() => {
    if (universe && isOwner) loadMembers(universe.id)
  }, [universe, isOwner, loadMembers])

  // Character search
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return }

    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('characters')
        .select('id, character_name, creator_name, image_url, slug')
        .ilike('character_name', `%${query.trim()}%`)
        .eq('is_public', true)
        .limit(8)

      setSearchResults((data ?? []) as CharacterResult[])
      setSearching(false)
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  async function handleAdd(char: CharacterResult) {
    if (!universe) return
    const alreadyIn = members.some(m => m.character_id === char.id)
    if (alreadyIn) return

    setAdding(char.id)
    await supabase.from('universe_characters').insert({
      universe_id:  universe.id,
      character_id: char.id,
    })
    await loadMembers(universe.id)
    setAdding(null)
    setQuery('')
    setSearchResults([])
  }

  async function handleRemove(rowId: string) {
    if (!universe) return
    setRemoving(rowId)
    await supabase.from('universe_characters').delete().eq('id', rowId)
    setMembers(prev => prev.filter(m => m.id !== rowId))
    setRemoving(null)
  }

  if (!authChecked) return null

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <Link
          href={`/u/${slug}`}
          style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
        >
          ← {universe?.name ?? 'UNIVERSE'}
        </Link>

        <p style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          color: '#FFE600',
          margin: '0 0 8px',
          letterSpacing: 1,
          lineHeight: 1.6,
        }}>
          ⚙ MANAGE UNIVERSE
        </p>
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          margin: '0 0 48px',
          lineHeight: 1.7,
        }}>
          Add or remove characters from <span style={{ color: '#ffffff' }}>{universe?.name}</span>
        </p>

        {/* ── Search to add ── */}
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 9,
            color: 'rgba(255,255,255,0.45)',
            margin: '0 0 12px',
            letterSpacing: 1,
          }}>
            ADD CHARACTER
          </p>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search character name..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 15,
                padding: '12px 16px',
                outline: 'none',
                borderRadius: 0,
                transition: 'border-color 150ms',
              }}
              onFocus={e => (e.target.style.borderColor = '#FFE600')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
            {searching && (
              <span style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.3)',
              }}>
                searching...
              </span>
            )}
          </div>

          {/* Results dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderTop: 'none',
              background: '#0e0e1a',
            }}>
              {searchResults.map(char => {
                const alreadyIn = members.some(m => m.character_id === char.id)
                return (
                  <div
                    key={char.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36,
                      background: '#07070d',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {char.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={char.image_url} alt={char.character_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, opacity: 0.3 }}>🎨</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: '#ffffff', margin: '0 0 2px', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {char.character_name}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        @{char.creator_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(char)}
                      disabled={alreadyIn || adding === char.id}
                      style={{
                        fontFamily: 'var(--font-pixel), monospace',
                        fontSize: 8,
                        color: alreadyIn ? 'rgba(255,255,255,0.3)' : '#07070d',
                        background: alreadyIn ? 'transparent' : '#FFE600',
                        border: alreadyIn ? '1px solid rgba(255,255,255,0.2)' : 'none',
                        padding: '8px 14px',
                        cursor: alreadyIn || adding === char.id ? 'not-allowed' : 'pointer',
                        letterSpacing: 1,
                        flexShrink: 0,
                        opacity: adding === char.id ? 0.6 : 1,
                        transition: 'opacity 150ms',
                      }}
                    >
                      {alreadyIn ? 'ADDED' : adding === char.id ? '...' : '+ ADD'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Current characters ── */}
        <div>
          <p style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 9,
            color: 'rgba(255,255,255,0.45)',
            margin: '0 0 16px',
            letterSpacing: 1,
          }}>
            CURRENT CHARACTERS ({members.length})
          </p>

          {loadingMembers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 60, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
              No characters added yet — search above to add some
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {members.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div style={{ width: 40, height: 40, background: '#0e0e1a', overflow: 'hidden', flexShrink: 0 }}>
                    {m.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image_url} alt={m.character_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: 0.3 }}>🎨</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/p/${m.slug}`}
                      style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 8, color: '#ffffff', textDecoration: 'none', letterSpacing: 0.5, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {m.character_name}
                    </Link>
                    <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                      by @{m.creator_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    disabled={removing === m.id}
                    style={{
                      fontFamily: 'var(--font-pixel), monospace',
                      fontSize: 8,
                      color: removing === m.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,100,100,0.7)',
                      background: 'transparent',
                      border: '1px solid rgba(255,100,100,0.2)',
                      padding: '8px 12px',
                      cursor: removing === m.id ? 'not-allowed' : 'pointer',
                      letterSpacing: 1,
                      flexShrink: 0,
                      transition: 'color 150ms, border-color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = 'rgba(255,68,68,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.2)' }}
                    aria-label={`Remove ${m.character_name}`}
                  >
                    {removing === m.id ? '...' : '✕ REMOVE'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
