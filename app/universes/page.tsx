import { supabase } from '../../lib/supabase'
import UniverseCard from '../../components/UniverseCard'
import CreateUniverseButton from '../../components/CreateUniverseButton'

interface Universe {
  id: string
  name: string
  slug: string
  cover_image_url: string | null
  member_count: number
  character_count: number
  owner_name: string
}

async function getUniverses(): Promise<Universe[]> {
  const { data } = await supabase
    .from('universes')
    .select('id, name, slug, cover_image_url, member_count, character_count, owner_name')
    .eq('is_public', true)
    .order('member_count', { ascending: false })
    .limit(50)
  return (data ?? []) as Universe[]
}

export default async function UniversesPage() {
  const universes = await getUniverses()

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 48,
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(14px, 3vw, 22px)',
              color: '#FFE600',
              margin: '0 0 12px',
              letterSpacing: 1,
              lineHeight: 1.5,
            }}>
              ✦ UNIVERSES
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.4)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Shared worlds built by multiple creators
            </p>
          </div>
          <CreateUniverseButton />
        </div>

        {/* ── Grid ── */}
        {universes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(9px, 2vw, 12px)',
              color: 'rgba(255,255,255,0.25)',
              margin: '0 0 16px',
              letterSpacing: 1,
              lineHeight: 1.8,
            }}>
              NO UNIVERSES YET
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.2)',
              margin: 0,
              lineHeight: 1.7,
            }}>
              Be the first to create a shared world
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 1,
            background: 'rgba(255,255,255,0.07)',
          }}>
            {universes.map(u => (
              <div key={u.id} style={{ background: '#07070d' }}>
                <UniverseCard
                  name={u.name}
                  slug={u.slug}
                  coverImageUrl={u.cover_image_url}
                  memberCount={u.member_count ?? 0}
                  characterCount={u.character_count ?? 0}
                  ownerName={u.owner_name ?? 'creator'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
