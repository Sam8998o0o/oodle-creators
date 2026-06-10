'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import StyleTagPill from '../../../components/StyleTagPill'
import CharacterCard from '../../../components/CharacterCard'

const STYLE_TAGS = ['Hand-drawn', 'Digital Art', 'AI Generated', '3D', 'Photography', 'Other']

const PERSONALITY_OPTIONS = ['Cheerful', 'Mysterious', 'Tsundere', 'Gentle', 'Crazy', 'Cold', 'Funny', 'Brave', 'Timid', 'Evil']
const EMOTION_OPTIONS     = ['😄 Cheerful', '😤 Irritable', '🥺 Sensitive', '😎 Cool', '😈 Mischievous', '🤩 Narcissistic', '😴 Lazy', '🔥 Passionate']

interface Errors {
  characterName?: string
  creatorName?: string
  submit?: string
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const slug   = params.slug as string

  /* ── Loading / auth state ── */
  const [fetchingData, setFetchingData] = useState(true)

  /* ── Immutable identity ── */
  const [charId,        setCharId]        = useState('')
  const [existingLikes, setExistingLikes] = useState(0)
  const [existingFans,  setExistingFans]  = useState(0)

  /* ── Form fields ── */
  const [characterName, setCharacterName] = useState('')
  const [creatorName,   setCreatorName]   = useState('')
  const [bio,           setBio]           = useState('')
  const [selectedTags,  setSelectedTags]  = useState<string[]>([])
  const [isPublic,      setIsPublic]      = useState(true)

  /* ── Character profile fields ── */
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([])
  const [selectedEmotions,    setSelectedEmotions]    = useState<string[]>([])
  const [catchphrase,         setCatchphrase]         = useState('')
  const [worldOrigin,         setWorldOrigin]         = useState('')
  const [race,                setRace]                = useState('')
  const [occupation,          setOccupation]          = useState('')
  const [abilities,           setAbilities]           = useState('')
  const [weaknesses,          setWeaknesses]          = useState('')

  /* ── Image state ── */
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imageFile,        setImageFile]        = useState<File | null>(null)
  const [imagePreview,     setImagePreview]     = useState<string | null>(null)
  const [isDragOver,       setIsDragOver]       = useState(false)

  /* ── UX state ── */
  const [loading,         setLoading]         = useState(false)
  const [errors,          setErrors]          = useState<Errors>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting,        setDeleting]        = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Auth guard + ownership check + pre-fill ── */
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data: char } = await supabase
        .from('characters')
        .select('id, character_name, creator_name, bio, image_url, style_tags, is_public, likes, fans, user_id, personality, emotions, catchphrase, world_origin, race, occupation, abilities, weaknesses')
        .eq('slug', slug)
        .maybeSingle()

      if (!char || char.user_id !== user.id) { router.replace('/'); return }

      setCharId(char.id)
      setCharacterName(char.character_name)
      setCreatorName(char.creator_name)
      setBio(char.bio ?? '')
      setSelectedTags((char.style_tags as string[]) ?? [])
      setIsPublic(char.is_public)
      setExistingImageUrl(char.image_url)
      setImagePreview(char.image_url)
      setExistingLikes(char.likes)
      setExistingFans(char.fans)
      setSelectedPersonality((char.personality as string[] | null) ?? [])
      setSelectedEmotions((char.emotions as string[] | null) ?? [])
      setCatchphrase(char.catchphrase ?? '')
      setWorldOrigin(char.world_origin ?? '')
      setRace(char.race ?? '')
      setOccupation(char.occupation ?? '')
      setAbilities(Array.isArray(char.abilities) ? (char.abilities as string[]).join(', ') : (char.abilities as string | null) ?? '')
      setWeaknesses(char.weaknesses ?? '')
      setFetchingData(false)
    }
    init()
  }, [slug, router])

  /* ── Image helpers ── */
  const applyFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) {
      setErrors(e => ({ ...e, submit: 'Image must be under 10MB' }))
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
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

  const togglePersonality = (p: string) =>
    setSelectedPersonality(prev =>
      prev.includes(p) ? prev.filter(i => i !== p) : prev.length < 3 ? [...prev, p] : prev
    )

  const toggleEmotion = (em: string) =>
    setSelectedEmotions(prev =>
      prev.includes(em) ? prev.filter(i => i !== em) : prev.length < 3 ? [...prev, em] : prev
    )

  const revertImage = () => {
    setImageFile(null)
    setImagePreview(existingImageUrl)
    // Reset the hidden file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Errors = {}
    if (!characterName.trim()) e.characterName = 'Character name is required'
    if (!creatorName.trim())   e.creatorName   = 'Creator name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Save ── */
  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); router.replace('/'); return }

    let imageUrl: string | null = existingImageUrl

    if (imageFile) {
      const ext      = imageFile.name.split('.').pop() ?? 'png'
      const filePath = `${user.id}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(filePath, imageFile, { upsert: false })

      if (uploadError) {
        setErrors({ submit: `Upload failed: ${uploadError.message}` })
        setLoading(false)
        return
      }

      imageUrl = supabase.storage.from('character-images').getPublicUrl(uploadData.path).data.publicUrl
    }

    const { error: updateError } = await supabase
      .from('characters')
      .update({
        character_name: characterName.trim(),
        creator_name:   creatorName.trim(),
        bio:            bio.trim() || null,
        image_url:      imageUrl,
        style_tags:     selectedTags,
        is_public:      isPublic,
        personality:    selectedPersonality,
        emotions:       selectedEmotions,
        catchphrase:    catchphrase.trim() || null,
        world_origin:   worldOrigin.trim() || null,
        race:           race.trim() || null,
        occupation:     occupation.trim() || null,
        abilities:      abilities.split(',').map(a => a.trim()).filter(Boolean),
        weaknesses:     weaknesses.trim() || null,
      })
      .eq('id', charId)
      .eq('user_id', user.id) // belt-and-suspenders: only own rows

    if (updateError) {
      setErrors({ submit: `Save failed: ${updateError.message}` })
      setLoading(false)
      return
    }

    router.push(`/p/${slug}`)
  }

  /* ── Delete ── */
  const handleDelete = async () => {
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setDeleting(false); return }

    await supabase
      .from('characters')
      .delete()
      .eq('id', charId)
      .eq('user_id', user.id)

    router.push('/profile')
  }

  /* ── Shared style objects ── */
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

  /* ── Loading screen ── */
  if (fetchingData) {
    return (
      <div style={{
        background: '#07070d',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          LOADING...
        </span>
      </div>
    )
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <Link
            href="/profile"
            style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}
          >
            ← MY PROFILE
          </Link>
          <h1 style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 'clamp(14px, 3vw, 22px)', color: '#ffffff', margin: '0 0 12px' }}>
            EDIT CHARACTER
          </h1>
          <p style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Update your character&apos;s details and settings
          </p>
        </div>

        {/* Two-column layout — identical structure to /create */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }} className="grid-cols-1 lg:grid-cols-2">

          {/* ── LEFT: Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Image upload zone */}
            <div>
              <label style={labelStyle}>CHARACTER IMAGE</label>
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
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                    />
                    {/* Subtle overlay hint on hover */}
                    <span style={{
                      position: 'absolute',
                      bottom: 8,
                      fontFamily: 'var(--font-body), sans-serif',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.35)',
                    }}>
                      Click or drag to replace
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 48, opacity: 0.5 }}>⬆</span>
                    <span style={{ fontFamily: 'var(--font-pixel), monospace', fontSize: 11, color: '#ffffff', textAlign: 'center', lineHeight: 1.8 }}>
                      Drop your character design here
                    </span>
                    <span style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                      or click to browse
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

              {/* Only show revert if user has staged a new file */}
              {imageFile && (
                <button
                  onClick={revertImage}
                  style={{
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 8,
                    padding: 0,
                  }}
                >
                  ↩ Revert to original image
                </button>
              )}

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
                    onClick={() =>
                      setSelectedTags(prev =>
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      )
                    }
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

            {/* Submit error */}
            {errors.submit && (
              <p style={{ ...errorStyle, padding: '12px 16px', border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.05)' }}>
                {errors.submit}
              </p>
            )}

            {/* Save button */}
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
              {loading ? 'SAVING...' : 'SAVE CHANGES →'}
            </button>

            {/* ── Danger zone ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, marginTop: 4 }}>
              <p style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 8,
                color: 'rgba(255,100,100,0.6)',
                marginBottom: 14,
                letterSpacing: 1,
              }}>
                DANGER ZONE
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 9,
                  color: '#ff4444',
                  background: 'transparent',
                  border: '1px solid rgba(255,68,68,0.45)',
                  padding: '14px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  transition: 'border-color 150ms, background 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#ff4444'
                  e.currentTarget.style.background = 'rgba(255,68,68,0.06)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,68,68,0.45)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                🗑 DELETE CHARACTER
              </button>
            </div>

          </div>

          {/* ── RIGHT: Live preview ── */}
          <div style={{ position: 'sticky', top: 88 }}>
            <p style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 20,
              letterSpacing: 1,
            }}>
              PREVIEW
            </p>
            <div style={{ maxWidth: 260 }}>
              <CharacterCard
                characterName={characterName || 'CHARACTER NAME'}
                creatorHandle={creatorName || 'creator'}
                imageUrl={imagePreview ?? undefined}
                likes={existingLikes}
                fans={existingFans}
                isVerified={isPublic}
              />
            </div>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 12,
              color: 'rgba(255,255,255,0.25)',
              marginTop: 16,
            }}>
              This is how your character appears in the gallery
            </p>
          </div>

        </div>
      </div>

      {/* ── Delete confirmation modal ─────────────────────── */}
      {showDeleteModal && (
        <div
          onClick={() => { if (!deleting) setShowDeleteModal(false) }}
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
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              background: '#07070d',
              border: '1px solid rgba(255,255,255,0.12)',
              borderTop: '3px solid #ff4444',
              padding: '36px 32px',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <h3 style={{
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 14,
              color: '#ff4444',
              margin: '0 0 16px',
              letterSpacing: 1,
              lineHeight: 1.5,
            }}>
              ARE YOU SURE?
            </h3>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              margin: '0 0 6px',
              lineHeight: 1.7,
            }}>
              This will permanently delete{' '}
              <strong style={{ color: '#ffffff' }}>{characterName}</strong>.
            </p>
            <p style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 13,
              color: 'rgba(255,100,100,0.65)',
              margin: '0 0 28px',
            }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: 'rgba(255,255,255,0.65)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '13px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-pixel), monospace',
                  fontSize: 8,
                  color: '#ffffff',
                  background: deleting ? 'rgba(255,68,68,0.5)' : '#ff4444',
                  border: 'none',
                  padding: '13px',
                  cursor: deleting ? 'wait' : 'pointer',
                  letterSpacing: 1,
                  transition: 'opacity 150ms',
                }}
              >
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
