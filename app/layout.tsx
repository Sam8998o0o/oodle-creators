import type { Metadata } from 'next'
import { Press_Start_2P, Noto_Sans } from 'next/font/google'
import './globals.css'

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Oodle Creators — Build Your Character IP',
  description: 'The IP creator community platform. Build your original character, get discovered, and monetize your IP.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart2P.variable} ${notoSans.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
