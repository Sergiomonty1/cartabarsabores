'use client'

import { useEffect, useState } from 'react'

/**
 * La carta como app: registra el service worker (funciona sin internet) y guarda el aviso de
 * instalación del navegador para que el botón «Instalar» lo pueda lanzar cuando el usuario quiera.
 */

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
declare global {
  interface Window {
    __saboresInstall?: InstallPrompt | null
  }
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

export function RegisterServiceWorker() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      window.__saboresInstall = e as InstallPrompt
      window.dispatchEvent(new Event('sabores-installable'))
    }
    const onInstalled = () => {
      window.__saboresInstall = null
      window.dispatchEvent(new Event('sabores-installable'))
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          // Guarda también lo que esta página ya cargó antes de que el service worker existiera
          const urls = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin) && /\/_next\/static\/|\/alergenos\/|\.(png|svg)$/.test(u))
          reg.active?.postMessage({ type: 'cache-urls', urls: [...urls, location.pathname] })
        })
        .catch(() => {})
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return null
}

/** Botón «Instalar la carta». Solo aparece cuando el navegador permite instalarla (o en iPhone, con la ayuda). */
export function InstallAppButton({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const [canInstall, setCanInstall] = useState(false)
  const [ios, setIos] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const update = () => setCanInstall(!!window.__saboresInstall)
    update()
    window.addEventListener('sabores-installable', update)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent))
    return () => window.removeEventListener('sabores-installable', update)
  }, [])

  if (!canInstall && !ios) return null

  const install = async () => {
    const p = window.__saboresInstall
    if (!p) return setShowIosHelp((v) => !v)
    await p.prompt()
    try {
      await p.userChoice
    } finally {
      window.__saboresInstall = null
      setCanInstall(false)
    }
  }

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <button
        type="button"
        onClick={install}
        title="Instalar la carta como app en este móvil"
        className={`inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold/[0.08] text-gold-soft font-semibold transition active:scale-95 hover:bg-gold/[0.14] ${
          compact ? 'px-3 py-2 text-xs rounded-xl' : 'px-4 py-2 text-[13px]'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v6m0 0l-2.5-2.5M12 14l2.5-2.5" />
        </svg>
        {compact ? 'Instalar' : 'Instalar la carta en el móvil'}
      </button>
      {showIosHelp && (
        <span className="mt-2 max-w-[16rem] text-center text-[11px] leading-snug text-white/60">
          En el iPhone: pulsa <strong className="text-white/80">Compartir</strong> y luego{' '}
          <strong className="text-white/80">Añadir a pantalla de inicio</strong>.
        </span>
      )}
    </span>
  )
}

/** Dentro de la app instalada (que abre el admin), botón para volver al admin desde la carta. */
export function BackToAdmin() {
  const [inApp, setInApp] = useState(false)
  useEffect(() => setInApp(isStandalone()), [])
  if (!inApp) return null
  return (
    <a
      href="/menu/admin"
      className="fixed left-3 z-50 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-[#04244f]/95 px-3.5 py-2 text-xs font-semibold text-gold-soft shadow-lg shadow-black/30 active:scale-95 transition"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
      </svg>
      Admin
    </a>
  )
}

/** true cuando la web está abierta como app instalada (no en el navegador). */
export function useIsInstalledApp() {
  const [inApp, setInApp] = useState(false)
  useEffect(() => setInApp(isStandalone()), [])
  return inApp
}
