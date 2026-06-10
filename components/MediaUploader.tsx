'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  characterId: string
  onClose: () => void
  onUploadComplete: () => void
}

const ACCEPT   = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm'
const MAX_IMG  = 10 * 1024 * 1024   // 10 MB
const MAX_VID  = 50 * 1024 * 1024   // 50 MB

export default function MediaUploader({ characterId, onClose, onUploadComplete }: Props) {
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [caption,    setCaption]    = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function applyFile(f: File) {
    const isVideo = f.type.startsWith('video/')
    if (f.size > (isVideo ? MAX_VID : MAX_IMG)) {
      setError(`File must be under ${isVideo ? '50MB' : '10MB'}`)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) applyFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    const isVideo  = file.type.startsWith('video/')
    const ext      = file.name.split('.').pop() ?? 'jpg'
    const path     = `media/${characterId}/${Date.now()}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('character-images')
      .getPublicUrl(uploadData.path)

    const { error: dbError } = await supabase
      .from('character_media')
      .insert({
        character_id: characterId,
        file_url:     publicUrl,
        file_type:    isVideo ? 'video' : 'image',
        caption:      caption.trim() || null,
      })

    if (dbError) {
      setError(`Save failed: ${dbError.message}`)
      setUploading(false)
      return
    }

    // Reset for next upload; notify parent to refresh gallery
    setFile(null)
    setPreview(null)
    setCaption('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploading(false)
    onUploadComplete()
  }

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
          maxWidth: 480,
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
          ✦ ADD TO GALLERY
        </p>

        {/* ── Upload zone ── */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          style={{
            border: `2px dashed ${isDragOver ? '#FFE600' : 'rgba(255,255,255,0.2)'}`,
            background: isDragOver ? 'rgba(255,230,0,0.03)' : 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 20,
            marginBottom: 8,
            transition: 'border-color 150ms',
            overflow: 'hidden',
          }}
        >
          {preview && file ? (
            file.type.startsWith('video/') ? (
              <video
                src={preview}
                controls
                style={{ maxHeight: 160, maxWidth: '100%', display: 'block' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
              />
            )
          ) : (
            <>
              <span style={{ fontSize: 40, opacity: 0.5 }}>📷</span>
              <span style={{
                fontFamily: 'var(--font-pixel), monospace',
                fontSize: 9,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 1.8,
                letterSpacing: 0.5,
              }}>
                Drop media here or click to browse
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['JPG', 'PNG', 'GIF', 'WEBP', 'MP4', 'MOV', 'WEBM'].map(b => (
                  <span key={b} style={{
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '2px 6px',
                  }}>
                    {b}
                  </span>
                ))}
              </div>
              <span style={{
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
              }}>
                Images max 10MB · Videos max 50MB
              </span>
            </>
          )}
        </div>

        {file && (
          <button
            onClick={() => {
              setFile(null)
              setPreview(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            style={{
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 0 12px',
            }}
          >
            Remove file
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
          style={{ display: 'none' }}
        />

        {/* ── Caption ── */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>CAPTION (optional)</label>
          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value.slice(0, 100))}
            placeholder="Describe this media..."
            style={inputStyle}
            maxLength={100}
            onFocus={e => (e.target.style.borderColor = '#FFE600')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <p style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            margin: '4px 0 0',
            textAlign: 'right',
          }}>
            {caption.length} / 100
          </p>
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
            disabled={uploading}
            style={{
              flex: 1,
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 9,
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '14px',
              cursor: uploading ? 'not-allowed' : 'pointer',
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
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              flex: 2,
              fontFamily: 'var(--font-pixel), monospace',
              fontSize: 9,
              color: '#07070d',
              background: !file || uploading ? 'rgba(255,230,0,0.4)' : '#FFE600',
              border: 'none',
              padding: '14px',
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              transition: 'background 150ms',
            }}
          >
            {uploading ? 'UPLOADING...' : 'UPLOAD →'}
          </button>
        </div>
      </div>
    </div>
  )
}
