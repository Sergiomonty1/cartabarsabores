import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Sabores — Carta',
  description: 'Carta de tapas, medias raciones, vinos y alérgenos en 5 idiomas. Actualizada en tiempo real.',
  icons: { icon: '/logo.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#021530',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
