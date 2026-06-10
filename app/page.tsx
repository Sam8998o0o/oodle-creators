import Link from 'next/link'
import CharacterCard from '../components/CharacterCard'
import SignInLink from '../components/SignInLink'
import HeroCTAButton from '../components/HeroCTAButton'
import HowItWorks from '../components/HowItWorks'
import { supabase } from '../lib/supabase'

/* ── Mock data (fallback when no real characters exist) ── */

const HERO_CHIPS_FALLBACK = [
  '🐉 Drakeling · @dragonart ❤ 2.4k',
  '🌸 Sakura Ghost · @yuuki ❤ 1.8k',
  '🤖 Neon Rex · @cyberdraw ❤ 3.1k',
  '🦊 Foxy Lin · @foxworks ❤ 892',
  '🌙 Moonshard · @lunarcreator ❤ 4.2k',
  '🎭 Masker · @maskerdraw ❤ 671',
  '🔥 Ember · @emberstudio ❤ 1.1k',
  '⚡ Zappix · @zapworks ❤ 543',
]

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

interface FeaturedCharacter {
  id: string
  character_name: string
  creator_name: string
  likes: number
  fans: number
  image_url: string | null
  slug: string
}

const MOCK_CHARACTERS: FeaturedCharacter[] = [
  { id: 'm1', character_name: 'Drakeling',    creator_name: 'dragonart',   likes: 2400, fans: 341, image_url: null, slug: '' },
  { id: 'm2', character_name: 'Sakura Ghost', creator_name: 'yuuki',       likes: 1800, fans: 203, image_url: null, slug: '' },
  { id: 'm3', character_name: 'Neon Rex',     creator_name: 'cyberdraw',   likes: 3100, fans: 512, image_url: null, slug: '' },
  { id: 'm4', character_name: 'Foxy Lin',     creator_name: 'foxworks',    likes: 892,  fans: 98,  image_url: null, slug: '' },
  { id: 'm5', character_name: 'Moonshard',    creator_name: 'lunarcreator',likes: 4200, fans: 721, image_url: null, slug: '' },
  { id: 'm6', character_name: 'Masker',       creator_name: 'maskerdraw',  likes: 671,  fans: 87,  image_url: null, slug: '' },
]

async function getFeaturedCharacters(): Promise<FeaturedCharacter[]> {
  const { data } = await supabase
    .from('characters')
    .select('id, character_name, creator_name, likes, fans, image_url, slug')
    .eq('is_public', true)
    .order('likes', { ascending: false })
    .limit(12)

  return (data ?? []) as FeaturedCharacter[]
}

const FEATURES = [
  { num: '01', icon: '🎨', title: 'ANY STYLE WELCOME',   desc: 'Hand-drawn, digital, AI-generated, 3D, photography — every style has a home here.' },
  { num: '02', icon: '🔍', title: 'GET DISCOVERED',      desc: 'Appear in the gallery, leaderboards, and search. Build your fanbase organically.' },
  { num: '03', icon: '📢', title: 'SHARE YOUR IP',       desc: 'Get a public page, shareable link, and downloadable assets for your character.' },
  { num: '04', icon: '💰', title: 'MONETIZE YOUR IP',    desc: 'Fan tips, merchandise drops, brand deals. Your IP, your income. (Coming Soon)' },
]


const MONETIZE = [
  { icon: '💰', title: 'FAN TIPS',        desc: 'Fans send you tips directly' },
  { icon: '👕', title: 'MERCHANDISE',     desc: 'Sell character merch automatically' },
  { icon: '🤝', title: 'BRAND DEALS',     desc: 'Brands discover and license your IP' },
  { icon: '⭐', title: 'SUBSCRIPTIONS',   desc: 'Fans subscribe for exclusive content' },
]

const ROADMAP = [
  { label: 'LIVE',     color: '#00ff88', bg: 'rgba(0,255,136,0.06)',    items: ['Platform launch', 'Gallery', 'Creator profiles'] },
  { label: 'BUILDING', color: '#FFE600', bg: 'rgba(255,230,0,0.04)',    items: ['Follow system', 'Search', 'Download assets'] },
  { label: 'PLANNED',  color: '#7b7bff', bg: 'rgba(123,123,255,0.04)',  items: ['Creator badge', 'Fan tips', 'Leaderboard'] },
  { label: 'VISION',   color: '#ff69b4', bg: 'rgba(255,105,180,0.04)', items: ['Merchandise', 'Brand deals', 'Subscriptions'] },
]

/* ── Section divider helper ───────────────────────────── */
const Divider = () => (
  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0 24px' }} />
)

/* ── Page ─────────────────────────────────────────────── */

export default async function LandingPage() {
  const fetched = await getFeaturedCharacters()

  // Chip strings for the scrolling row — fall back to mock text when DB is empty
  const realChips = fetched.map(c =>
    `${c.character_name} · @${c.creator_name} ❤ ${formatLikes(c.likes ?? 0)}`
  )
  const heroChips =
    realChips.length === 0
      ? HERO_CHIPS_FALLBACK
      : realChips.length < 6
        ? [...realChips, ...realChips]
        : realChips

  // Card data — use real characters if available, otherwise fall back to mock
  const featuredChars = fetched.length > 0 ? fetched : MOCK_CHARACTERS

  return (
    <div style={{ background: '#07070d' }}>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Badge */}
        <div className="fade-up delay-0" style={{
          display: 'inline-block',
          padding: '8px 18px',
          border: '1px solid rgba(255,230,0,0.4)',
          background: 'rgba(255,230,0,0.04)',
          marginBottom: 32,
        }}>
          <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 9, color: '#FFE600', letterSpacing: 2 }}>
            ✦ IP CHARACTER SHARING COMMUNITY
          </span>
        </div>

        {/* H1 */}
        <h1 className="fade-up delay-1" style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 'clamp(18px, 5vw, 80px)',
          lineHeight: 1.5,
          margin: '0 0 28px',
          maxWidth: 800,
          background: 'linear-gradient(135deg, #ffffff 0%, #FFE600 50%, #ff69b4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          SHARE YOUR CHARACTER IP WITH THE WORLD
        </h1>

        {/* Subtitle */}
        <p className="fade-up delay-2" style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 18,
          color: 'rgba(255,255,255,0.6)',
          maxWidth: 580,
          lineHeight: 1.7,
          margin: '0 0 40px',
        }}>
          Upload your original character. Get discovered by fans. Build your audience. Monetize your IP.
        </p>

        {/* Scrolling chip row */}
        <div className="fade-up delay-3" style={{
          width: '100%',
          overflow: 'hidden',
          marginBottom: 44,
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}>
          <div className="scroll-track" style={{ display: 'flex', width: 'max-content', flexWrap: 'nowrap', animation: 'scroll-left 30s linear infinite' }}>
            {[...heroChips, ...heroChips].map((chip, i) => (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 18px',
                margin: '0 8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 14,
                color: 'rgba(255,255,255,0.55)',
                whiteSpace: 'nowrap',
              }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="fade-up delay-4 flex-col sm:flex-row" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <HeroCTAButton />
          <Link href="/gallery" style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 11,
            color: '#ffffff',
            background: 'transparent',
            textDecoration: 'none',
            padding: '16px 28px',
            border: '1px solid rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}>
            EXPLORE GALLERY →
          </Link>
        </div>

        {/* Sign in link — client component island */}
        <SignInLink />
      </section>

      <Divider />

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 0 0' }}>
        <div style={{ display: 'grid' }} className="grid-cols-1 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div key={f.num} style={{
              padding: '40px',
              borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 11, color: '#FFE600', marginBottom: 20 }}>
                {f.num}
              </div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 13, color: '#ffffff', marginBottom: 14, lineHeight: 1.6 }}>
                {f.title}
              </div>
              <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      <HowItWorks />

      <Divider />

      {/* ── FEATURED CREATORS ───────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 0' }}>
        <div style={{ marginBottom: 32, padding: '0 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 16, color: '#ffffff', margin: '0 0 12px' }}>
            FEATURED CREATORS
          </h2>
          <div style={{ width: 60, height: 3, background: '#FFE600' }} />
        </div>

        {/* Single horizontal scrolling row */}
        <div
          className="scrollable-pills"
          style={{
            display: 'flex',
            gap: 1,
            background: 'rgba(255,255,255,0.07)',
            padding: '0 24px',
          }}
        >
          {featuredChars.map(c => (
            <div key={c.id} style={{ flexShrink: 0, width: 220, background: '#07070d' }}>
              <CharacterCard
                characterName={c.character_name}
                creatorHandle={c.creator_name}
                imageUrl={c.image_url ?? undefined}
                likes={c.likes}
                fans={c.fans}
                slug={c.slug || undefined}
                isVerified={!!c.slug}
              />
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── MONETIZE ────────────────────────────────────────── */}
      <section id="monetize" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 16, color: '#ffffff', margin: '0 0 48px', textAlign: 'center' }}>
          MONETIZE YOUR IP
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.07)' }}>
          {MONETIZE.map(m => (
            <div key={m.title} style={{
              background: '#07070d',
              padding: '32px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: 14, right: 14,
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 7,
                background: '#FFE600',
                color: '#07070d',
                padding: '3px 8px',
                letterSpacing: 0.5,
              }}>
                COMING SOON
              </span>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{m.icon}</div>
              <div style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 11, color: '#ffffff', marginBottom: 10 }}>
                {m.title}
              </div>
              <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── ROADMAP ─────────────────────────────────────────── */}
      <section id="roadmap" style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 16, color: '#ffffff', margin: '0 0 48px' }}>
          ROADMAP
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {ROADMAP.map(r => (
            <div key={r.label} style={{
              borderLeft: `4px solid ${r.color}`,
              background: r.bg,
              padding: '28px 28px 28px 32px',
              marginBottom: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: r.color,
                  border: `1px solid ${r.color}`,
                  padding: '3px 8px',
                  letterSpacing: 1,
                }}>
                  {r.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {r.items.map(item => (
                  <span key={item} style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                    · {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── OODLE GAME BONUS ────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderLeft: '4px solid #FFE600',
          padding: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 12,
              color: '#FFE600',
              border: '1px solid rgba(255,230,0,0.3)',
              padding: '4px 12px',
              marginBottom: 20,
              letterSpacing: 1,
            }}>
              🎮 BONUS FEATURE
            </div>
            <h2 style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 'clamp(13px, 2vw, 18px)',
              color: '#ffffff',
              lineHeight: 1.6,
              margin: '0 0 20px',
            }}>
              Bring Your IP Into a Pixel Mini-Game
            </h2>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              margin: '0 0 28px',
              maxWidth: 480,
            }}>
              Oodle is a browser-based pixel pet game. Upload your character here and it can come alive as a pixel pet in the game.
            </p>
            <Link href="https://oodle.vercel.app" target="_blank" style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 10,
              color: '#ffffff',
              textDecoration: 'none',
              padding: '12px 22px',
              border: '1px solid rgba(255,255,255,0.3)',
              letterSpacing: 1,
              transition: 'border-color 150ms',
            }}>
              PLAY OODLE →
            </Link>
          </div>

          {/* Pixel art placeholder */}
          <div style={{
            width: 80, height: 80,
            flexShrink: 0,
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(255,230,0,0.1) 0, rgba(255,230,0,0.1) 10px, transparent 10px, transparent 20px),
              repeating-linear-gradient(-45deg, rgba(255,230,0,0.1) 0, rgba(255,230,0,0.1) 10px, transparent 10px, transparent 20px)
            `,
            border: '1px solid rgba(255,230,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 32 }}>🎮</span>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 12, color: '#FFE600' }}>
          OODLE CREATORS
        </span>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { label: 'Gallery', href: '/gallery' },
            { label: 'Create', href: '/create' },
            { label: 'Game', href: 'https://oodle.vercel.app' },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Oodle Creators
        </span>
      </footer>
    </div>
  )
}

