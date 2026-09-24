import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import { APP_CONFIG } from '@/lib/config'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: `${APP_CONFIG.name} | ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
  applicationName: APP_CONFIG.name,
  keywords: [
    'تمريض منزلي',
    'إسعاف منزلي',
    'رعاية صحية منزلية',
    'ممرض منزلي مصر',
    'خدمات تمريضية',
    'رحمة',
    'علاج طبيعي منزلي',
    'غيار جروح',
    'حقن ومحاليل',
    'مصر',
  ],
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  publisher: APP_CONFIG.name,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/app-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: ['/icon.svg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_CONFIG.name,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: APP_CONFIG.url,
    title: `${APP_CONFIG.name} | ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
    images: [
      {
        url: '/app-icon.png',
        width: 512,
        height: 512,
        alt: `${APP_CONFIG.name} - تمريض وإسعاف منزلي في مصر`,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: `${APP_CONFIG.name} | ${APP_CONFIG.tagline}`,
    description: APP_CONFIG.description,
    images: ['/app-icon.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0f5fbe',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
