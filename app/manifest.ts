import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'رحمة | التمريض والإسعاف المنزلي في مصر',
    short_name: 'رحمة',
    description:
      'منصة ذكية وسلسة للرعاية التمريضية والإسعافية المنزلية تربط المريض بأقرب ممرض معتمد في كافة محافظات مصر.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f5fbe',
    dir: 'rtl',
    lang: 'ar',
    orientation: 'portrait',
    categories: ['medical', 'health', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
