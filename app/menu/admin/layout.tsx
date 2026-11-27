import type { Metadata } from 'next'
import { RegisterServiceWorker } from '@/components/AppInstall'

/** Solo el panel de admin se instala como app (desde él se puede abrir la carta). */
export const metadata: Metadata = {
  title: 'Sabores — Admin',
  manifest: '/manifest.webmanifest',
  icons: { apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }] },
  appleWebApp: { capable: true, title: 'Sabores Admin', statusBarStyle: 'black-translucent' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RegisterServiceWorker />
    </>
  )
}
