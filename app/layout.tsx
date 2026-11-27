import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Sabores — Carta',
  description: 'Carta de tapas, medias raciones, vinos y alérgenos en 5 idiomas. Actualizada en tiempo real.',
  icons: { icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/logo.svg' }] },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#021530',
  // La web ya es oscura: así el «modo oscuro automático» del móvil no le cambia los colores
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
