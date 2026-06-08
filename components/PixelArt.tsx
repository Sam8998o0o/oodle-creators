'use client'

import { useEffect, useRef } from 'react'

interface PetCoords {
  eyes: { x: number; y: number }[]
  legs: { x: number; y: number }[]
  center: { x: number; y: number }
  has_eyes: boolean
  has_legs: boolean
}

interface Props {
  pixelData: string
  coords?: PetCoords | null
  size?: number
  className?: string
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  style: string,
  cx: number,
  cy: number,
  size: number,
  color = '#eaeaea',
) {
  const p = Math.max(1, Math.floor(size / 4))
  const dot = (r: number, c: number, fill = color) => {
    ctx.fillStyle = fill
    ctx.fillRect(Math.round(cx + c * p), Math.round(cy + r * p), p, p)
  }
  switch (style) {
    case 'eye_round':
    default: {
      for (let r = -1; r <= 1; r++)
        for (let c = -1; c <= 1; c++) dot(r, c)
      dot(-1, -1, '#ffffff')
    }
  }
}

export default function PixelArt({ pixelData, coords, size = 96, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pixelData) return
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, size, size)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 2, 2, size - 4, size - 4)

      if (coords?.eyes && coords.eyes.length > 0) {
        const eyeSize = Math.round(size * 0.09)
        const ex = coords.eyes.reduce((s, e) => s + e.x, 0) / coords.eyes.length * size
        const ey = coords.eyes[0].y * size
        drawEye(ctx, 'eye_round', Math.round(ex - eyeSize * 1.3), Math.round(ey), eyeSize)
        drawEye(ctx, 'eye_round', Math.round(ex + eyeSize * 1.3), Math.round(ey), eyeSize)
      }
    }
    img.src = pixelData
  }, [pixelData, coords, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
