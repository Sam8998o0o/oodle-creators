'use client'

import { useState } from 'react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-1 pixel-font text-xs px-4 py-3 border transition-all hover:bg-white/5"
      style={{ borderColor: copied ? 'var(--y)' : 'var(--border)', color: copied ? 'var(--y)' : 'rgba(255,255,255,0.5)', fontSize: 9 }}
    >
      {copied ? 'COPIED!' : 'COPY LINK'}
    </button>
  )
}
