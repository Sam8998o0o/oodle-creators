'use client'

interface Props {
  label: string
  selected: boolean
  onClick: () => void
}

export default function StyleTagPill({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-body), sans-serif',
        fontSize: 13,
        padding: '7px 16px',
        border: `1px solid ${selected ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
        background: selected ? '#FFE600' : 'transparent',
        color: selected ? '#07070d' : 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        letterSpacing: 0.5,
        transition: 'all 150ms',
        borderRadius: 0,
      }}
    >
      {label}
    </button>
  )
}
