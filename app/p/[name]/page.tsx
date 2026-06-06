import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '../../../lib/supabase'
import PixelArt from '../../../components/PixelArt'
import CopyLinkButton from '../../../components/CopyLinkButton'

interface Pet {
  id: string
  name: string
  pixel_data: string
  coords: unknown
  creator_name?: string
  talent?: string
  talent_drawing?: string
  created_at: string
}

interface LikeRow {
  pet_id: string
}

async function getPet(name: string): Promise<Pet | null> {
  const { data } = await supabase
    .from('pets')
    .select('id, name, pixel_data, coords, creator_name, talent, talent_drawing, created_at')
    .eq('name', decodeURIComponent(name))
    .eq('is_dead', false)
    .maybeSingle()
  return (data as Pet | null) ?? null
}

async function getLikeCount(petId: string): Promise<number> {
  const { data } = await supabase.from('likes').select('pet_id').eq('pet_id', petId)
  return (data as LikeRow[] | null)?.length ?? 0
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  const pet = await getPet(name)
  if (!pet) return { title: 'Not Found' }
  return {
    title: `${pet.name} — Oodle Creators`,
    description: pet.talent
      ? `${pet.name} is an original character with talent: ${pet.talent}. Created by ${pet.creator_name ?? 'an Oodle creator'}.`
      : `${pet.name} is an original character created by ${pet.creator_name ?? 'an Oodle creator'}.`,
    openGraph: {
      title: `${pet.name} — Oodle Creators`,
      description: `Check out this character on Oodle Creators!`,
    },
  }
}

export default async function IPPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const pet = await getPet(name)
  if (!pet) notFound()

  const likeCount = await getLikeCount(pet.id)
  const age = Math.floor((Date.now() - new Date(pet.created_at).getTime()) / 86400000)
  const shareUrl = `https://oodle-creators.vercel.app/p/${encodeURIComponent(pet.name)}`
  const tweetText = `Check out ${pet.name} on Oodle Creators!${pet.talent ? ` Talent: ${pet.talent}` : ''} ${shareUrl}`

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav
        style={{ borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', background: 'rgba(7,7,13,0.9)' }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="pixel-font text-sm" style={{ color: 'var(--y)' }}>OODLE</Link>
          <Link href="/gallery" className="body-font text-xs hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ← GALLERY
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* LEFT — character artwork */}
          <div className="flex flex-col items-center gap-6">
            <div
              className="p-8 flex items-center justify-center"
              style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            >
              <PixelArt
                pixelData={pet.pixel_data}
                coords={pet.coords as never}
                size={240}
              />
            </div>
            {pet.talent_drawing && (
              <div className="w-full">
                <p className="pixel-font mb-3 text-center" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>TALENT DRAWING</p>
                <div className="p-4 flex items-center justify-center" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pet.talent_drawing}
                    alt={`${pet.name} talent drawing`}
                    style={{ imageRendering: 'pixelated', maxWidth: 200, maxHeight: 200 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — info */}
          <div className="flex flex-col gap-6">
            {/* Name + likes */}
            <div>
              <h1 className="pixel-font leading-relaxed mb-2" style={{ fontSize: 'clamp(16px, 3vw, 28px)', color: '#fff' }}>
                {pet.name}
              </h1>
              {pet.creator_name && (
                <p className="body-font text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  by {pet.creator_name}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                <span
                  className="body-font px-4 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--card)', color: '#fff' }}
                >
                  ♡ {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                </span>
                <span className="body-font text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {age === 0 ? 'Created today' : `${age} day${age !== 1 ? 's' : ''} old`}
                </span>
              </div>
            </div>

            {/* Talent badge */}
            {pet.talent && (
              <div>
                <p className="pixel-font mb-2" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>TALENT</p>
                <span
                  className="inline-block body-font px-4 py-2 text-sm capitalize"
                  style={{ background: 'rgba(255,230,0,0.08)', color: 'var(--y)', border: '1px solid rgba(255,230,0,0.2)' }}
                >
                  {pet.talent}
                </span>
              </div>
            )}

            {/* Stats */}
            <div
              className="p-5 grid grid-cols-2 gap-4"
              style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            >
              <div>
                <p className="pixel-font mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>AGE</p>
                <p className="body-font text-sm text-white">{age} day{age !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="pixel-font mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>LIKES</p>
                <p className="body-font text-sm text-white">{likeCount}</p>
              </div>
              <div>
                <p className="pixel-font mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>STATUS</p>
                <p className="body-font text-sm" style={{ color: '#00ff88' }}>ALIVE</p>
              </div>
              {pet.talent && (
                <div>
                  <p className="pixel-font mb-1" style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>TALENT</p>
                  <p className="body-font text-sm capitalize" style={{ color: 'var(--y)' }}>{pet.talent}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="https://oodle.vercel.app"
                target="_blank"
                className="pixel-font text-xs px-6 py-4 text-center transition-all hover:opacity-90"
                style={{ background: 'var(--y)', color: '#07070d' }}
              >
                ▶ MEET IN GAME
              </Link>

              <div className="flex gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 pixel-font text-xs px-4 py-3 text-center border transition-all hover:bg-white/5"
                  style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                >
                  SHARE ON X
                </a>
                <CopyLinkButton url={shareUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* More from gallery */}
        <div className="mt-20 pt-12" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-6">
            <span className="pixel-font" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>MORE CHARACTERS</span>
            <Link href="/gallery" className="body-font text-xs hover:opacity-80" style={{ color: 'var(--y)' }}>VIEW ALL →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
