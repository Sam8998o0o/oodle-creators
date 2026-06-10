import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile', '/edit'],
    },
    sitemap: 'https://oodle-creators.vercel.app/sitemap.xml',
  }
}
