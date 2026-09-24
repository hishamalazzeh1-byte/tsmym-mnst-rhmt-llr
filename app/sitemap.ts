import type { MetadataRoute } from 'next'
import { APP_CONFIG } from '@/lib/config'
import { NURSES, SERVICES } from '@/lib/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = APP_CONFIG.url

  // 1. Static Core Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/nurses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/triage`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sessions`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.7,
    },
  ]

  // 2. Dynamic Nurse Profile Pages
  const nursePages: MetadataRoute.Sitemap = NURSES.map((nurse) => ({
    url: `${baseUrl}/nurses/${nurse.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  return [...staticPages, ...nursePages]
}
