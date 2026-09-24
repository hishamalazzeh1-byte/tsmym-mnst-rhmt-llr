import type { MetadataRoute } from 'next'
import { APP_CONFIG } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_CONFIG.url

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
