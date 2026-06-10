import type { MetadataRoute } from 'next'
import { supabase } from '../lib/supabase'

const BASE_URL = 'https://oodle-creators.vercel.app'

// Revalidate the sitemap every hour so new characters/creators are picked up
// without having to rebuild the whole app.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // One query covers both character pages and creator pages.
  // We only need slug, creator_name, and created_at.
  const { data } = await supabase
    .from('characters')
    .select('slug, creator_name, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const chars = (data ?? []) as Array<{
    slug: string
    creator_name: string
    created_at: string
  }>

  // Deduplicate creator handles, keeping the most-recent created_at per handle
  // (rows are already newest-first so the first occurrence wins).
  const creatorMap = new Map<string, string>()
  for (const c of chars) {
    if (!creatorMap.has(c.creator_name)) {
      creatorMap.set(c.creator_name, c.created_at)
    }
  }

  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/gallery`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/create`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const characterPages: MetadataRoute.Sitemap = chars.map(c => ({
    url: `${BASE_URL}/p/${c.slug}`,
    lastModified: new Date(c.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const creatorPages: MetadataRoute.Sitemap = Array.from(creatorMap.entries()).map(
    ([handle, lastDate]) => ({
      url: `${BASE_URL}/creator/${encodeURIComponent(handle)}`,
      lastModified: new Date(lastDate),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  )

  return [...staticPages, ...characterPages, ...creatorPages]
}
