import type { Metadata } from 'next'
import { Press_Start_2P, Noto_Sans } from 'next/font/google'
import Nav from '../components/Nav'
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
  title: 'Oodle Creators — Share Your Character IP With The World',
  description: 'Upload your original character. Get discovered by fans. Build your audience. Monetize your IP.',
  openGraph: {
    title: 'Oodle Creators — Share Your Character IP With The World',
    description: 'Upload your original character. Get discovered by fans. Build your audience. Monetize your IP.',
    images: [{ url: '/og-default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart2P.variable} ${notoSans.variable}`}>
      <body style={{ background: '#07070d', color: '#ffffff', margin: 0 }}>
        <Nav />
        <main style={{ paddingTop: 64 }}>{children}</main>
      </body>
    </html>
  )
}
