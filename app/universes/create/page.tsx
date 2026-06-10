'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { generateSlug } from '../../../lib/utils'

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#ffffff',
  fontFamily: 'var(--font-body), sans-serif',
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  borderRadius: 0,
  transition: 'border-color 150ms',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-pixel), monospace',
  fontSize: 9,
  color: 'rgba(255,255,255,0.5)',
  letterSpacing: 1,
  display: 'block',
  marginBottom: 8,
}

export default function CreateUniversePage() {
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [userName,    setUserName]    = useState('')

  // Form state
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [isPublic,    setIsPublic]    = useState(true)
  const [imageFile,   setImageFile]   = useState<File | null>(null)
  const [imagePreview,setImagePreview]= useState<string | null>(null)
  const [isDragOver,  setIsDragOver]  = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      setUserId(user.id)
      setUserName(
        (user.user_metadata?.full_name as string | undefined)
          ?? user.email?.split('@')[0]
          ?? 'creator'
      )
      setAuthChecked(true)
    })
  }, [router])

  const applyFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Images only (JPG, PNG, GIF, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !userId) return
    setSubmitting(true)
    setError(null)

    let coverImageUrl: string | null = null

    // Upload cover image if provided
    if (imageFile) {
      const ext  = imageFile.name.split('.').pop() ?? 'jpg'
      const path = `universe-covers/${userId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('character-images')
        .upload(path, imageFile, { upsert: false })

      if (uploadErr) {
        setError(`Image upload failed: ${uploadErr.message}`)
        setSubmitting(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage
        .from('character-images')
        .getPublicUrl(uploadData.path)
      coverImageUrl = publicUrl
    }

    const slug = generateSlug(name.trim())

    // Insert universe
    const { data: universe, error: insertErr } = await supabase
      .from('universes')
      .insert({
        name:             name.trim(),
        slug,
        description:      description.trim() || null,
        cover_image_url:  coverImageUrl,
        is_public:        isPublic,
        owner_id:         userId,
        owner_name:       userName,
        member_count:     1,
        character_count:  0,
        follower_count:   0,
      })
      .select('id, slug')
      .single()

    if (insertErr) {
      setError(`Failed to create universe: ${insertErr.message}`)
      setSubmitting(false)
      return
    }

    // Auto-insert creator as owner member
    await supabase.from('universe_members').insert({
      universe_id: universe.id,
      user_id:     userId,
      role:        'owner',
    })

    router.push(`/u/${universe.slug}`)
  }

  if (!authChecked) return null

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <p style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          color: '#FFE600',
          margin: '0 0 8px',
          letterSpacing: 1,
          lineHeight: 1.6,
        }}>
          ✦ CREATE UNIVERSE
        </p>
        <p style={{
          fontFamily: 'var(--font-body), sans-serif',
          fontSize: 15,
          color: 'rgba(255,255,255,0.4)',
          margin: '0 0 40px',
          lineHeight: 1.7,
        }}>
          Build a shared world that other creators can join
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Universe Name */}
          <div>
            <label style={labelStyle}>
              UNIVERSE NAME <span style={{ color: '#FFE600' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. The Neon Realm"
              maxLength={60}
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#FFE600')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this universe, its lore, rules, and what creators can expect..."
              rows={4}
              maxLength={600}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              onFocus={e => (e.target.style.borderColor = '#FFE600')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 11,
              color: description.length >= 550 ? '#FFE600' : 'rgba(255,255,255,0.25)',
              margin: '4px 0 0',
              textAlign: 'right',
              transition: 'color 200ms',
            }}>
              {description.length} / 600
            </p>
          </div>

          {/* Cover Image */}
          <div>
            <label style={labelStyle}>COVER IMAGE</label>

            {imagePreview ? (
              <div style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="cover preview"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    fontFamily: 'var(--font-body), sans-serif',
                  }}
                  aria-label="Remove image"
                >
                  ✕ REMOVE
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) applyFile(f) }}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                style={{
                  aspectRatio: '16/9',
                  border: `2px dashed ${isDragOver ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                  background: isDragOver ? 'rgba(255,230,0,0.03)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'border-color 150ms, background 150ms',
                }}
              >
                <span style={{ fontSize: 32, opacity: 0.35 }}>🌐</span>
                <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '0 16px' }}>
                  Drop a cover image or click to browse
                  <br />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>16:9 recommended · max 10MB</span>
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
              style={{ display: 'none' }}
            />
          </div>

          {/* Public toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>VISIBILITY</p>
              <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                {isPublic ? 'Anyone can discover and join this universe' : 'Only invite members can join'}
              </p>
            </div>
            <button
              type="button"
              className={`toggle-track${isPublic ? ' on' : ''}`}
              onClick={() => setIsPublic(p => !p)}
              aria-checked={isPublic}
              role="switch"
              aria-label="Public toggle"
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: '#ff6b6b', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => router.push('/universes')}
              disabled={submitting}
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                color: 'rgba(255,255,255,0.5)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '14px 24px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                letterSpacing: 1,
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              style={{
                flex: 1,
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                color: '#07070d',
                background: !name.trim() || submitting ? 'rgba(255,230,0,0.4)' : '#FFE600',
                border: 'none',
                padding: '14px 24px',
                cursor: !name.trim() || submitting ? 'not-allowed' : 'pointer',
                letterSpacing: 1,
                transition: 'background 150ms',
              }}
            >
              {submitting ? 'CREATING...' : '✦ CREATE UNIVERSE →'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
