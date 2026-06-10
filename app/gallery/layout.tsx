import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Creator Gallery — Oodle Creators',
  description: 'Discover original character IPs from creators worldwide. Browse fan art, illustrations, AI-generated characters and more.',
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
