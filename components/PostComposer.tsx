'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  characterId: string
  onClose: () => void
  onPublished: () => void
}

const MAX_CHARS = 500
const MAX_IMAGE = 10 * 1024 * 1024  // 10 MB

export default function PostComposer({ characterId, onClose, onPublished }: Props) {
  const [content,    setContent]    = useState('')
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function applyFile(f: File) {
    if (!f.type.startsWith('image/')) {
      setError('Images only (JPG, PNG, GIF, WEBP)')
      return
    }
    if (f.size > MAX_IMAGE) {
      setError('Image must be under 10MB')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePublish() {
    const trimmed = content.trim()
    if (!trimmed) return
    setPublishing(true)
    setError(null)

    let imageUrl: string | null = null

    if (file) {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `posts/${characterId}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('character-images')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`)
        setPublishing(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('character-images')
        .getPublicUrl(uploadData.path)

      imageUrl = publicUrl
    }

    const { error: dbError } = await supabase
      .from('character_posts')
      .insert({
        character_id: characterId,
        content:      trimmed,
        image_url:    imageUrl,
      })

    if (dbError) {
      setError(`Publish failed: ${dbError.message}`)
      setPublishing(false)
      return
    }

    setPublishing(false)
    onPublished()
    onClose()
  }

  const charsLeft = MAX_CHARS - content.length
  const nearLimit = charsLeft <= 50

  const inputBorderStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontFamily: 'var(--font-body), sans-serif',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 150ms',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0e0e1a',
          borderTop: '3px solid #FFE600',
          padding: '36px 32px',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: 12,
          color: '#FFE600',
          margin: '0 0 24px',
          letterSpacing: 1,
          lineHeight: 1.8,
        }}>
          ✦ POST AN UPDATE
        </p>

        {/* ── Textarea ── */}
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="What's your character up to today?"
            rows={4}
            maxLength={MAX_CHARS}
            style={{
              ...inputBorderStyle,
              width: '100%',
              boxSizing: 'border-box',
              fontSize: 15,
              lineHeight: 1.7,
              padding: '12px 14px',
              resize: 'vertical',
              minHeight: 100,
            }}
            onFocus={e => (e.target.style.borderColor = '#FFE600')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <p style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 11,
            color: nearLimit ? '#FFE600' : 'rgba(255,255,255,0.3)',
            margin: '4px 0 0',
            textAlign: 'right',
            transition: 'color 200ms',
          }}>
            {content.length} / {MAX_CHARS}
          </p>
        </div>

        {/* ── Optional image ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontFamily: 'var(--font-pixel), monospace',
            fontSize: 9,
            color: '#ffffff',
            letterSpacing: 1,
            margin: '0 0 8px',
          }}>
            ADD IMAGE (optional)
          </p>

          {preview ? (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="preview"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={clearFile}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-body), sans-serif',
                  lineHeight: 1,
                }}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) applyFile(f) }}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              style={{
                border: `2px dashed ${isDragOver ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                background: isDragOver ? 'rgba(255,230,0,0.03)' : 'transparent',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'border-color 150ms',
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.4 }}>🖼️</span>
              <span style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
              }}>
                Drop an image or click to browse · max 10MB
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

        {error && (
          <p style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 13,
            color: '#ff6b6b',
            marginBottom: 16,
          }}>
            {error}
          </p>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            style={{
              flex: 1,
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 9,
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '14px',
              cursor: publishing ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              transition: 'border-color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!content.trim() || publishing}
            style={{
              flex: 2,
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 9,
              color: '#07070d',
              background: !content.trim() || publishing ? 'rgba(255,230,0,0.4)' : '#FFE600',
              border: 'none',
              padding: '14px',
              cursor: !content.trim() || publishing ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              transition: 'background 150ms',
            }}
          >
            {publishing ? 'PUBLISHING...' : 'PUBLISH →'}
          </button>
        </div>
      </div>
    </div>
  )
}
