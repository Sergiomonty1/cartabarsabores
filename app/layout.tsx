import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { RegisterServiceWorker } from '@/components/AppInstall'

export const metadata: Metadata = {
  title: 'Sabores — Carta',
  description: 'Carta de tapas, medias raciones, vinos y alérgenos en 5 idiomas. Actualizada en tiempo real.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/logo.svg' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: 'Sabores', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#021530',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
