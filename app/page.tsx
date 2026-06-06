import Link from 'next/link'
import { supabase } from '../lib/supabase'
import PixelArt from '../components/PixelArt'
import SignInButton from '../components/SignInButton'

interface Pet {
  id: string
  name: string
  pixel_data: string
  coords: unknown
  creator_name?: string
  talent?: string
}

interface LikeRow {
  pet_id: string
}

async function getPreviewPets(): Promise<Pet[]> {
  const { data } = await supabase
    .from('pets')
    .select('id, name, pixel_data, coords, creator_name, talent')
    .eq('is_dead', false)
    .order('created_at', { ascending: false })
    .limit(6)
  return (data ?? []) as Pet[]
}

async function getChipNames(): Promise<string[]> {
  const { data } = await supabase
    .from('pets')
    .select('name')
    .eq('is_dead', false)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []).map((r: { name: string }) => r.name)
}

async function getLikeCounts(petIds: string[]): Promise<Record<string, number>> {
  if (!petIds.length) return {}
  const { data } = await supabase.from('likes').select('pet_id').in('pet_id', petIds)
  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as LikeRow[]) {
    counts[row.pet_id] = (counts[row.pet_id] ?? 0) + 1
  }
  return counts
}

const FEATURES = [
  { icon: '✦', title: 'CREATE', desc: 'Design your character in any style — hand-drawn, digital, AI-generated, or uploaded. Your original IP, your way.' },
  { icon: '◈', title: 'GET DISCOVERED', desc: 'Your character gets a public profile page. Share it. Let fans find you.' },
  { icon: '⬡', title: 'SHARE YOUR IP', desc: 'One link. Your character, bio, talent, and artwork — all in one place.' },
  { icon: '◇', title: 'MONETIZE', desc: 'Fan tips, merch, brand deals, and subscriptions. Coming soon.' },
]

const MONETIZE = [
  { icon: '♡', title: 'Fan Tips', desc: 'Let fans send you tokens directly.' },
  { icon: '◈', title: 'Merchandise', desc: 'Print your IP on physical goods.' },
  { icon: '◇', title: 'Brand Deals', desc: 'Connect with brands looking for IP.' },
  { icon: '✦', title: 'Creator Subscription', desc: 'Offer exclusive content to subscribers.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'CREATE YOUR CHARACTER', desc: 'Design your original character in any style — hand-drawn, digital, AI-generated, or uploaded.' },
  { step: '02', title: 'PUBLISH YOUR IP', desc: 'Your character automatically gets a public creator profile page.' },
  { step: '03', title: 'GROW YOUR FOLLOWING', desc: 'Share your IP link, collect likes, and build your fan base.' },
]

const ROADMAP = [
  { phase: 'PHASE 1', title: 'Creator Profiles', status: 'LIVE', items: ['Public IP pages', 'Creator gallery', 'Like system'] },
  { phase: 'PHASE 2', title: 'Community', status: 'SOON', items: ['Follow creators', 'Fan comments', 'Creator feed'] },
  { phase: 'PHASE 3', title: 'Monetization', status: 'COMING', items: ['Fan tips', 'IP licensing', 'Brand deals'] },
  { phase: 'PHASE 4', title: 'Ecosystem', status: 'FUTURE', items: ['Merch store', 'Creator DAO', 'IP marketplace'] },
]

export default async function LandingPage() {
  const [pets, chipNames] = await Promise.all([getPreviewPets(), getChipNames()])
  const likeCounts = await getLikeCounts(pets.map(p => p.id))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav
        style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', background: 'rgba(7,7,13,0.85)' }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="pixel-font text-sm" style={{ color: 'var(--y)' }}>OODLE</Link>
          <div className="hidden md:flex gap-8">
            {[
              { label: 'GALLERY', href: '/gallery' },
              { label: 'CREATORS', href: '/gallery' },
              { label: 'ROADMAP', href: '#roadmap' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="body-font text-xs tracking-widest hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <SignInButton />
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div
          className="inline-block mb-6 px-4 py-2 text-xs tracking-widest body-font"
          style={{ border: '1px solid var(--border)', color: 'var(--y)', background: 'rgba(255,230,0,0.05)' }}
        >
          ✦ IP CREATOR COMMUNITY PLATFORM
        </div>
        <h1 className="pixel-font leading-relaxed mb-6" style={{ fontSize: 'clamp(18px, 3.5vw, 36px)', color: '#fff' }}>
          BUILD YOUR<br />
          <span style={{ color: 'var(--y)' }}>CHARACTER IP</span><br />
          LET THE WORLD<br />
          DISCOVER YOU
        </h1>
        <p className="body-font text-base mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Design your character in any style. Upload your original IP, build your audience, and let the world discover your creation.
        </p>

        {chipNames.length > 0 && (
          <div className="overflow-hidden mb-10" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            <div className="flex gap-3 whitespace-nowrap w-max" style={{ animation: 'scroll 30s linear infinite' }}>
              {[...chipNames, ...chipNames].map((name, i) => (
                <span
                  key={i}
                  className="inline-block px-3 py-1 text-xs body-font"
                  style={{ border: '1px solid var(--border)', color: 'rgba(255,255,255,0.5)', background: 'var(--card)', borderRadius: 2 }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <Link
            href="https://oodle.vercel.app"
            target="_blank"
            className="pixel-font text-xs px-6 py-4 transition-all hover:opacity-90"
            style={{ background: 'var(--y)', color: '#07070d' }}
          >
            ✦ START BUILDING YOUR IP
          </Link>
          <Link
            href="/gallery"
            className="pixel-font text-xs px-6 py-4 border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: '#fff' }}
          >
            EXPLORE GALLERY →
          </Link>
          <Link
            href="https://oodle.vercel.app"
            target="_blank"
            className="pixel-font text-xs px-6 py-4 border transition-all hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.5)' }}
          >
            ▶ PLAY THE GAME
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="pixel-font text-center mb-12 text-sm" style={{ color: 'var(--y)' }}>WHAT IS OODLE CREATORS?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="p-6" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div className="pixel-font text-2xl mb-4" style={{ color: 'var(--y)' }}>{f.icon}</div>
              <div className="pixel-font text-xs mb-3 text-white">{f.title}</div>
              <p className="body-font text-sm" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CREATOR GALLERY PREVIEW */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <h2 className="pixel-font text-sm" style={{ color: '#fff' }}>CREATOR GALLERY</h2>
          <Link href="/gallery" className="body-font text-sm hover:opacity-80" style={{ color: 'var(--y)' }}>
            VIEW ALL →
          </Link>
        </div>
        {pets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {pets.map(pet => (
              <Link
                key={pet.id}
                href={`/p/${encodeURIComponent(pet.name)}`}
                className="group p-4 flex flex-col items-center gap-2 transition-all hover:scale-105"
                style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
              >
                <PixelArt pixelData={pet.pixel_data} coords={pet.coords as never} size={80} />
                <span className="pixel-font text-center" style={{ fontSize: 8, color: 'var(--y)' }}>{pet.name}</span>
                {pet.creator_name && (
                  <span className="body-font text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{pet.creator_name}</span>
                )}
                <span className="body-font text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>♡ {likeCounts[pet.id] ?? 0}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 body-font" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No pets yet.{' '}
            <Link href="https://oodle.vercel.app" target="_blank" className="underline hover:opacity-80" style={{ color: 'var(--y)' }}>
              Be the first!
            </Link>
          </div>
        )}
      </section>

      {/* MONETIZATION */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="p-12" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
          <h2 className="pixel-font text-sm mb-3 text-center" style={{ color: 'var(--y)' }}>MONETIZE YOUR IP</h2>
          <p className="body-font text-center mb-12" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            Own your character. Own your revenue.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MONETIZE.map(m => (
              <div key={m.title} className="p-5 relative" style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="absolute top-3 right-3">
                  <span className="body-font text-xs px-2 py-0.5" style={{ background: 'rgba(255,230,0,0.1)', color: 'var(--y)', border: '1px solid rgba(255,230,0,0.2)', fontSize: 9 }}>
                    COMING SOON
                  </span>
                </div>
                <div className="pixel-font text-xl mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>{m.icon}</div>
                <div className="pixel-font mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>{m.title}</div>
                <p className="body-font text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="pixel-font text-sm mb-12 text-center" style={{ color: '#fff' }}>HOW IT WORKS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="text-center">
              <div
                className="pixel-font text-3xl mb-4 mx-auto w-16 h-16 flex items-center justify-center"
                style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--y)' }}
              >
                {s.step}
              </div>
              <div className="pixel-font mb-3 text-white" style={{ fontSize: 9 }}>{s.title}</div>
              <p className="body-font text-sm" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BONUS — pixel mini-game callout */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div
          className="p-8 flex flex-col md:flex-row items-center gap-6"
          style={{ border: '1px solid rgba(255,230,0,0.15)', background: 'rgba(255,230,0,0.03)' }}
        >
          <div className="pixel-font text-3xl flex-shrink-0" style={{ color: 'var(--y)' }}>▶</div>
          <div>
            <p className="pixel-font mb-2" style={{ fontSize: 9, color: 'var(--y)' }}>BONUS</p>
            <p className="body-font" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Bring your IP into the pixel mini-game. Your character becomes a pixel pet inside the Oodle game world.
            </p>
          </div>
          <Link
            href="https://oodle.vercel.app"
            target="_blank"
            className="pixel-font text-xs px-5 py-3 flex-shrink-0 transition-all hover:opacity-90"
            style={{ background: 'var(--y)', color: '#07070d', fontSize: 9 }}
          >
            PLAY NOW →
          </Link>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="pixel-font text-sm mb-12 text-center" style={{ color: 'var(--y)' }}>ROADMAP</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROADMAP.map(r => (
            <div key={r.phase} className="p-6" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="body-font text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.phase}</span>
                <span
                  className="body-font text-xs px-2 py-0.5"
                  style={{
                    background: r.status === 'LIVE' ? 'rgba(0,255,0,0.1)' : 'rgba(255,230,0,0.08)',
                    color: r.status === 'LIVE' ? '#00ff88' : 'var(--y)',
                    border: `1px solid ${r.status === 'LIVE' ? 'rgba(0,255,136,0.2)' : 'rgba(255,230,0,0.15)'}`,
                    fontSize: 9,
                  }}
                >
                  {r.status}
                </span>
              </div>
              <div className="pixel-font mb-4 text-white" style={{ fontSize: 9 }}>{r.title}</div>
              <ul className="space-y-2">
                {r.items.map(item => (
                  <li key={item} className="body-font text-xs flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span style={{ color: 'var(--y)' }}>—</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="pixel-font mb-6" style={{ fontSize: 'clamp(14px, 2.5vw, 24px)', color: '#fff' }}>
          READY TO BUILD<br />
          <span style={{ color: 'var(--y)' }}>YOUR IP?</span>
        </h2>
        <p className="body-font mb-8 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Publish your original character on Oodle Creators and claim your creator page today.
        </p>
        <Link
          href="https://oodle.vercel.app"
          target="_blank"
          className="pixel-font text-xs px-8 py-4 inline-block transition-all hover:opacity-90"
          style={{ background: 'var(--y)', color: '#07070d' }}
        >
          ✦ START NOW — IT&apos;S FREE
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="pixel-font text-sm mb-4" style={{ color: 'var(--y)' }}>OODLE</div>
        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          <Link href="/gallery" className="body-font text-xs hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Gallery</Link>
          <Link href="https://oodle.vercel.app" target="_blank" className="body-font text-xs hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Play the Game</Link>
          <Link href="#roadmap" className="body-font text-xs hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>Roadmap</Link>
        </div>
        <p className="body-font text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2026 Oodle. All character IPs belong to their creators.
        </p>
      </footer>

      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
