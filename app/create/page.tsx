'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { signInWithGoogle } from '../../lib/auth'
import { generateSlug } from '../../lib/utils'
import StyleTagPill from '../../components/StyleTagPill'
import CharacterCard from '../../components/CharacterCard'

const STYLE_TAGS = ['Hand-drawn', 'Digital Art', 'AI Generated', '3D', 'Photography', 'Other']

const PERSONALITY_OPTIONS = ['Cheerful', 'Mysterious', 'Tsundere', 'Gentle', 'Crazy', 'Cold', 'Funny', 'Brave', 'Timid', 'Evil']
const EMOTION_OPTIONS     = ['😄 Cheerful', '😤 Irritable', '🥺 Sensitive', '😎 Cool', '😈 Mischievous', '🤩 Narcissistic', '😴 Lazy', '🔥 Passionate']

interface Errors {
  image?: string
  characterName?: string
  creatorName?: string
  submit?: string
}

export default function CreatePage() {
  const router = useRouter()

  // Form state
  const [characterName, setCharacterName] = useState('')
  const [creatorName,   setCreatorName]   = useState('')
  const [bio,           setBio]           = useState('')
  const [selectedTags,  setSelectedTags]  = useState<string[]>([])
  const [isPublic,      setIsPublic]      = useState(true)
  const [imageFile,     setImageFile]     = useState<File | null>(null)
  const [imagePreview,  setImagePreview]  = useState<string | null>(null)
  const [isDragOver,    setIsDragOver]    = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [errors,        setErrors]        = useState<Errors>({})

  // Character profile fields
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([])
  const [selectedEmotions,    setSelectedEmotions]    = useState<string[]>([])
  const [catchphrase,         setCatchphrase]         = useState('')
  const [worldOrigin,         setWorldOrigin]         = useState('')
  const [race,                setRace]                = useState('')
  const [occupation,          setOccupation]          = useState('')
  const [abilities,           setAbilities]           = useState('')
  const [weaknesses,          setWeaknesses]          = useState('')

  // Success modal
  const [successSlug, setSuccessSlug] = useState<string | null>(null)
  const [successName, setSuccessName] = useState('')
  const [copied,      setCopied]      = useState(false)

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) {
      setErrors(e => ({ ...e, image: 'File must be under 10MB' }))
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(e => ({ ...e, image: undefined }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) applyFile(file)
  }, [applyFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const togglePersonality = (p: string) =>
    setSelectedPersonality(prev =>
      prev.includes(p) ? prev.filter(i => i !== p) : prev.length < 3 ? [...prev, p] : prev
    )

  const toggleEmotion = (em: string) =>
    setSelectedEmotions(prev =>
      prev.includes(em) ? prev.filter(i => i !== em) : prev.length < 3 ? [...prev, em] : prev
    )

  const handleCopy = async () => {
    if (!successSlug) return
    try {
      await navigator.clipboard.writeText(`https://oodle-creators.vercel.app/p/${successSlug}`)
      setCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable
    }
  }

  const validate = (): boolean => {
    const e: Errors = {}
    if (!imageFile)            e.image         = 'Please select an image'
    if (!characterName.trim()) e.characterName = 'Character name is required'
    if (!creatorName.trim())   e.creatorName   = 'Creator name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      signInWithGoogle()
      return
    }

    // Upload image
    const ext = imageFile!.name.split('.').pop() ?? 'png'
    const filePath = `${user.id}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(filePath, imageFile!, { upsert: false })

    if (uploadError) {
      setErrors({ submit: `Upload failed: ${uploadError.message}` })
      setLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('character-images')
      .getPublicUrl(uploadData.path)

    // Insert character
    const slug = generateSlug(characterName)
    const { data: charData, error: insertError } = await supabase
      .from('characters')
      .insert({
        user_id:        user.id,
        character_name: characterName.trim(),
        creator_name:   creatorName.trim(),
        bio:            bio.trim() || null,
        image_url:      publicUrl,
        style_tags:     selectedTags,
        is_public:      isPublic,
        slug,
        personality:    selectedPersonality,
        emotions:       selectedEmotions,
        catchphrase:    catchphrase.trim() || null,
        world_origin:   worldOrigin.trim() || null,
        race:           race.trim() || null,
        occupation:     occupation.trim() || null,
        abilities:      abilities.split(',').map(a => a.trim()).filter(Boolean),
        weaknesses:     weaknesses.trim() || null,
      })
      .select('slug')
      .single()

    if (insertError) {
      setErrors({ submit: `Publish failed: ${insertError.message}` })
      setLoading(false)
      return
    }

    const finalSlug = (charData as { slug: string }).slug
    setLoading(false)
    setSuccessSlug(finalSlug)
    setSuccessName(characterName.trim())
  }

  /* ── Shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontFamily: 'var(--font-body), sans-serif',
    fontSize: 15,
    padding: '12px 14px',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 150ms',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-pixel), monospace',
    fontSize: 9,
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 8,
  }

  const errorStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body), sans-serif',
    fontSize: 13,
    color: '#ff6b6b',
    marginTop: 6,
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
            ← BACK
          </Link>
          <h1 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 'clamp(14px, 3vw, 22px)', color: '#ffffff', margin: '0 0 12px' }}>
            SHARE YOUR IP
          </h1>
          <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Upload your character and share it with the community
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gap: 48, alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">

          {/* ── LEFT: Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Upload zone */}
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                style={{
                  border: `2px dashed ${isDragOver ? '#FFE600' : 'rgba(255,255,255,0.2)'}`,
                  background: isDragOver ? 'rgba(255,230,0,0.03)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: 24,
                  transition: 'border-color 150ms, background 150ms',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                ) : (
                  <>
                    <span style={{ fontSize: 48, opacity: 0.5 }}>⬆</span>
                    <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 11, color: '#ffffff', textAlign: 'center', lineHeight: 1.8 }}>
                      Drop your character design here
                    </span>
                    <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                      or click to browse
                    </span>
                    <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                      Any style — hand-drawn, digital, AI-generated, 3D, photography
                    </span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {['JPG', 'PNG', 'GIF', 'WEBP', 'Max 10MB'].map(b => (
                        <span key={b} style={{
                          fontFamily: 'var(--font-body), sans-serif',
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '2px 8px',
                        }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {imagePreview && (
                <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 8,
                  padding: 0,
                }}>
                  Remove image
                </button>
              )}
              {errors.image && <p style={errorStyle}>{errors.image}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Character name */}
            <div>
              <label style={labelStyle}>CHARACTER NAME *</label>
              <input
                type="text"
                value={characterName}
                onChange={e => setCharacterName(e.target.value)}
                placeholder="e.g. Drakeling"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#FFE600')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              {errors.characterName && <p style={errorStyle}>{errors.characterName}</p>}
            </div>

            {/* Creator name */}
            <div>
              <label style={labelStyle}>CREATOR NAME *</label>
              <input
                type="text"
                value={creatorName}
                onChange={e => setCreatorName(e.target.value)}
                placeholder="e.g. dragonart"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#FFE600')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              {errors.creatorName && <p style={errorStyle}>{errors.creatorName}</p>}
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>YOUR STORY / BIO</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell your character's story..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = '#FFE600')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {/* Style tags */}
            <div>
              <label style={labelStyle}>STYLE TAGS (select all that apply)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STYLE_TAGS.map(tag => (
                  <StyleTagPill
                    key={tag}
                    label={tag}
                    selected={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>

            {/* ── CHARACTER PROFILE ─────────────────────────────── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
              <p style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 10,
                color: '#FFE600',
                margin: '0 0 24px',
                letterSpacing: 1,
              }}>✦ CHARACTER PROFILE</p>

              {/* PERSONALITY */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>PERSONALITY (pick up to 3)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PERSONALITY_OPTIONS.map(p => {
                    const sel = selectedPersonality.includes(p)
                    const dim = selectedPersonality.length >= 3 && !sel
                    return (
                      <button key={p} type="button" onClick={() => togglePersonality(p)} disabled={dim} style={{
                        fontFamily: 'var(--font-pixel), monospace', fontSize: 9,
                        padding: '7px 14px',
                        border: `1px solid ${sel ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                        background: sel ? '#FFE600' : 'transparent',
                        color: sel ? '#07070d' : 'rgba(255,255,255,0.6)',
                        cursor: dim ? 'default' : 'pointer', opacity: dim ? 0.35 : 1,
                        transition: 'all 150ms', borderRadius: 0, letterSpacing: 0.5,
                      }}>{p}</button>
                    )
                  })}
                </div>
              </div>

              {/* EMOTIONS */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>EMOTIONS (pick up to 3)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {EMOTION_OPTIONS.map(em => {
                    const sel = selectedEmotions.includes(em)
                    const dim = selectedEmotions.length >= 3 && !sel
                    return (
                      <button key={em} type="button" onClick={() => toggleEmotion(em)} disabled={dim} style={{
                        fontFamily: 'var(--font-pixel), monospace', fontSize: 9,
                        padding: '7px 14px',
                        border: `1px solid ${sel ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                        background: sel ? '#FFE600' : 'transparent',
                        color: sel ? '#07070d' : 'rgba(255,255,255,0.6)',
                        cursor: dim ? 'default' : 'pointer', opacity: dim ? 0.35 : 1,
                        transition: 'all 150ms', borderRadius: 0, letterSpacing: 0.5,
                      }}>{em}</button>
                    )
                  })}
                </div>
              </div>

              {/* CATCHPHRASE */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>CATCHPHRASE</label>
                <input
                  type="text"
                  value={catchphrase}
                  onChange={e => setCatchphrase(e.target.value.slice(0, 50))}
                  placeholder="你的角色的口頭禪..."
                  style={inputStyle}
                  maxLength={50}
                  onFocus={e => (e.target.style.borderColor = '#FFE600')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', textAlign: 'right' }}>
                  {catchphrase.length} / 50
                </p>
              </div>

              {/* WORLD ORIGIN & RACE */}
              <div style={{ display: 'grid', gap: 16, marginBottom: 20 }} className="grid-cols-1 sm:grid-cols-2">
                <div>
                  <label style={labelStyle}>WORLD ORIGIN</label>
                  <input type="text" value={worldOrigin} onChange={e => setWorldOrigin(e.target.value)}
                    placeholder="來自什麼世界 / 宇宙..." style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#FFE600')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label style={labelStyle}>RACE</label>
                  <input type="text" value={race} onChange={e => setRace(e.target.value)}
                    placeholder="種族，例如：人類、精靈、機器人..." style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#FFE600')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>

              {/* OCCUPATION & WEAKNESSES */}
              <div style={{ display: 'grid', gap: 16, marginBottom: 20 }} className="grid-cols-1 sm:grid-cols-2">
                <div>
                  <label style={labelStyle}>OCCUPATION</label>
                  <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)}
                    placeholder="職業，例如：魔法師、偵探、學生..." style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#FFE600')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label style={labelStyle}>WEAKNESSES</label>
                  <input type="text" value={weaknesses} onChange={e => setWeaknesses(e.target.value)}
                    placeholder="弱點..." style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#FFE600')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>

              {/* ABILITIES */}
              <div>
                <label style={labelStyle}>ABILITIES</label>
                <input type="text" value={abilities} onChange={e => setAbilities(e.target.value)}
                  placeholder="技能，用逗號分隔，例如：飛行, 讀心術, 變身" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#FFE600')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
                  Separate abilities with commas — displayed as pills on the public page
                </p>
              </div>
            </div>

            {/* Public toggle */}
            <div>
              <label style={labelStyle}>PUBLIC</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsPublic(p => !p)}
                  className={`toggle-track${isPublic ? ' on' : ''}`}
                  aria-label="Toggle public"
                >
                  <div className="toggle-thumb" />
                </button>
                <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {isPublic
                    ? 'Anyone can discover your character in the gallery'
                    : 'Only you can see this character'}
                </span>
              </div>
            </div>

            {/* Submit */}
            {errors.submit && (
              <p style={{ ...errorStyle, padding: '12px 16px', border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.05)' }}>
                {errors.submit}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 13,
                color: '#07070d',
                background: loading ? 'rgba(255,230,0,0.5)' : '#FFE600',
                border: 'none',
                padding: '18px',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 1,
                transition: 'opacity 150ms',
              }}
            >
              {loading ? 'PUBLISHING...' : 'PUBLISH TO GALLERY →'}
            </button>

            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', margin: 0 }}>
              ✦ Oodle game users — your pixel pets automatically appear here
            </p>
          </div>

          {/* ── RIGHT: Live preview ── */}
          <div style={{ position: 'sticky', top: 88 }}>
            <p style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 20, letterSpacing: 1 }}>
              PREVIEW
            </p>
            <div style={{ maxWidth: 260 }}>
              <CharacterCard
                characterName={characterName || 'CHARACTER NAME'}
                creatorHandle={creatorName || 'creator'}
                imageUrl={imagePreview ?? undefined}
                likes={0}
                fans={0}
                isVerified
              />
            </div>
            <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
              This is how your character will appear in the gallery
            </p>
          </div>

        </div>
      </div>

      {/* ── Success modal ───────────────────────────────── */}
      {successSlug && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: '#07070d',
              border: '1px solid rgba(255,255,255,0.12)',
              borderTop: '3px solid #FFE600',
              padding: '40px 36px 36px',
              width: '100%',
              maxWidth: 480,
              position: 'relative',
            }}
          >
            {/* ✕ close → go to character page */}
            <button
              onClick={() => router.push(`/p/${successSlug}`)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 20,
                lineHeight: 1,
                padding: '4px 8px',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              ✕
            </button>

            {/* Title */}
            <h2
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 'clamp(11px, 2.5vw, 17px)',
                color: '#FFE600',
                margin: '0 0 16px',
                letterSpacing: 1,
                lineHeight: 1.7,
              }}
            >
              ✦ YOUR CHARACTER IS LIVE!
            </h2>

            {/* Character name */}
            <p
              style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 'clamp(10px, 2vw, 13px)',
                color: '#FFE600',
                margin: '0 0 32px',
                letterSpacing: 1,
                lineHeight: 1.7,
              }}
            >
              {successName}
            </p>

            {/* Shareable link box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: 24,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-body), sans-serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  padding: '12px 14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {`https://oodle-creators.vercel.app/p/${successSlug}`}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#07070d',
                  background: copied ? '#a3d977' : '#FFE600',
                  border: 'none',
                  borderLeft: '1px solid rgba(255,255,255,0.12)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: 1,
                  flexShrink: 0,
                  transition: 'background 200ms',
                }}
              >
                {copied ? 'COPIED ✓' : 'COPY LINK'}
              </button>
            </div>

            {/* Three action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {/* 𝕏 Share on X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just shared my character ${successName} on Oodle Creators! Check it out 👇 https://oodle-creators.vercel.app/p/${successSlug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: '1 1 120px',
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '13px 8px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: 1,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFE600')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              >
                𝕏 SHARE ON X
              </a>

              {/* 🔗 Copy link */}
              <button
                onClick={handleCopy}
                style={{
                  flex: '1 1 120px',
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '13px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: 1,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FFE600')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              >
                🔗 COPY LINK
              </button>

              {/* → View character */}
              <button
                onClick={() => router.push(`/p/${successSlug}`)}
                style={{
                  flex: '1 1 120px',
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#07070d',
                  background: '#FFE600',
                  border: '1px solid #FFE600',
                  padding: '13px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: 1,
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                → VIEW MY CHARACTER
              </button>
            </div>

            {/* Gallery link */}
            <div style={{ textAlign: 'center' }}>
              <Link
                href="/gallery"
                style={{
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.35)',
                  textDecoration: 'none',
                  letterSpacing: 1,
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                GO TO GALLERY →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
