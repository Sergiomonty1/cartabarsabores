'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { MenuData, MenuCategory, WineCategory } from '@/types/menu'
import { menuService } from '@/lib/menuService'

const fmt = (n: number) =>
  n === 0 ? 'Consultar' : n.toFixed(2).replace('.', ',') + ' €'

const fmtWine = (n: number) =>
  n === 0 ? '—' : n.toFixed(2).replace('.', ',') + ' €'

/* ─── Allergen image map ─── */
const ALLERGEN_IMAGES: Record<string, { src: string; label: string }> = {
  gluten:     { src: '/alergenos/gluten.png',              label: 'Gluten' },
  huevo:      { src: '/alergenos/alergenos-huevos.png',    label: 'Huevo' },
  lacteo:     { src: '/alergenos/lacteos.png',             label: 'Lácteo' },
  mostaza:    { src: '/alergenos/mostaza.png',             label: 'Mostaza' },
  soja:       { src: '/alergenos/alergenos-soja.png',      label: 'Soja' },
  sulfitos:   { src: '/alergenos/alergenos-sulfitos.png',  label: 'Sulfitos' },
  apio:       { src: '/alergenos/apio.png',                label: 'Apio' },
  cacahuetes: { src: '/alergenos/cacahuetes.png',          label: 'Cacahuetes' },
  crustaceo:  { src: '/alergenos/crustaceo.png',           label: 'Crustáceo' },
  pescado:    { src: '/alergenos/pescado.png',             label: 'Pescado' },
  sesamo:        { src: '/alergenos/sesamo.png',              label: 'Sésamo' },
  'fruto-cascara': { src: '/alergenos/fruto-cascara.png',      label: 'Frutos de cáscara' },
  molusco:       { src: '/alergenos/molusco.png',              label: 'Molusco' },
}

function AllergenIcons({ allergens }: { allergens?: string[] }) {
  if (!allergens || allergens.length === 0) return null
  return (
    <span className="inline-flex items-center gap-1 ml-2 flex-shrink-0">
      {allergens.map((a) => {
        const info = ALLERGEN_IMAGES[a]
        if (!info) return null
        if (!info.src) {
          return (
            <span
              key={a}
              className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white/10 text-[8px] font-bold text-white/70 border border-white/20"
              title={info.label}
            >
              {info.label.slice(0, 2).toUpperCase()}
            </span>
          )
        }
        return (
          <Image
            key={a}
            src={info.src}
            alt={info.label}
            width={22}
            height={22}
            className="rounded-full"
            title={info.label}
          />
        )
      })}
    </span>
  )
}

/* ─── Lightweight gradient orbs (CSS only, reduced blur) ─── */
function GradientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
    </div>
  )
}

/* ─── CSS shimmer divider (no framer-motion) ─── */
function GoldenDivider() {
  return (
    <div className="relative h-px my-6 overflow-hidden animate-scale-in">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-200/40 to-transparent" />
      <div className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-sky-100/70 to-transparent animate-shimmer" />
    </div>
  )
}

/* ─── CSS animated title (no framer-motion) ─── */
function AnimatedTitle({ text }: { text: string }) {
  return (
    <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block animate-title-char"
          style={{ animationDelay: `${0.3 + i * 0.05}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  )
}

/* ─── Category section (pure CSS animations) ─── */
const CategorySection = React.memo(function CategorySection({
  cat,
  isTapas,
  isLast,
  showAllergens,
}: {
  cat: MenuCategory
  isTapas: boolean
  isLast: boolean
  showAllergens: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const items = useMemo(
    () => cat.items.filter((it) => it.name?.trim()).sort((a, b) => a.order - b.order),
    [cat.items]
  )

  return (
    <section ref={ref} id={`cat-${cat.id}`} className="pt-10">
      <div className={`flex items-center gap-3 mb-6 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        {cat.icon && <span className="text-2xl">{cat.icon}</span>}
        <h2 className="text-xl font-display font-bold text-white tracking-tight">{cat.name}</h2>
        <div className={`flex-1 h-px bg-gradient-to-r from-sky-300/25 to-transparent transition-transform duration-700 origin-left ${visible ? 'scale-x-100' : 'scale-x-0'}`} />
      </div>

      <div className={`rounded-2xl bg-white/[0.015] border border-white/[0.04] p-1 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="divide-y divide-white/[0.03]">
          {items.map((item, i) => {
            const displayPrice = item.samePrice ? item.priceTapa : isTapas ? item.priceTapa : item.priceMedia
            return (
              <div
                key={item.id}
                className={`group py-3.5 px-4 rounded-xl transition-colors duration-200 hover:bg-sky-400/[0.12] ${
                  showAllergens ? 'flex items-center gap-2' : displayPrice === 0 ? 'text-center' : 'flex items-baseline gap-2'
                } ${visible ? 'animate-fade-in-item' : 'opacity-0'}`}
                style={visible ? { animationDelay: `${i * 30}ms` } : undefined}
              >
                {showAllergens ? (
                  <>
                    <span className="text-[0.9rem] text-white/75 leading-snug flex-shrink-0 max-w-[55%] group-hover:text-white transition-colors duration-200">
                      {item.name}
                    </span>
                    <AllergenIcons allergens={item.allergens} />
                    <span className="flex-1 border-b border-dotted border-white/[0.04] min-w-[0.5rem] self-end mb-1.5 group-hover:border-white/20 transition-colors duration-300" />
                    <span className="text-white/90 text-sm font-semibold tracking-wide whitespace-nowrap ml-1 group-hover:text-white">
                      {fmt(displayPrice)}
                    </span>
                  </>
                ) : displayPrice === 0 ? (
                  <span className="text-[0.9rem] text-white/70 leading-snug group-hover:text-white transition-colors">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <span className="text-[0.9rem] text-white/75 leading-snug flex-shrink-0 max-w-[70%] group-hover:text-white transition-colors duration-200">
                      {item.name}
                    </span>
                    <span className="flex-1 border-b border-dotted border-white/[0.04] min-w-[1.5rem] self-end mb-1.5 group-hover:border-white/20 transition-colors duration-300" />
                    <span className="text-white/90 text-sm font-semibold tracking-wide whitespace-nowrap group-hover:text-white">
                      {fmt(displayPrice)}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!isLast && <GoldenDivider />}
    </section>
  )
})

/* ─── Wine category section ─── */
const WineCategorySection = React.memo(function WineCategorySection({
  cat,
  isLast,
}: {
  cat: WineCategory
  isLast: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const items = useMemo(
    () => [...cat.items].sort((a, b) => a.order - b.order),
    [cat.items]
  )

  return (
    <section ref={ref} id={`wine-${cat.id}`} className="pt-10">
      <div className={`flex items-center gap-3 mb-6 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <span className="text-2xl">🍷</span>
        <h2 className="text-xl font-display font-bold text-white tracking-tight">{cat.name}</h2>
        <div className={`flex-1 h-px bg-gradient-to-r from-sky-300/25 to-transparent transition-transform duration-700 origin-left ${visible ? 'scale-x-100' : 'scale-x-0'}`} />
      </div>

      <div className={`rounded-2xl bg-white/[0.015] border border-white/[0.04] p-1 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header row */}
        <div className="flex items-center gap-2 py-2.5 px-4 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
          <span className="flex-1">Vino</span>
          <span className="w-16 text-center">Copa</span>
          <span className="w-20 text-center">Botella</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {items.map((wine, i) => (
            <div
              key={wine.id}
              className={`group flex items-center gap-2 py-3.5 px-4 rounded-xl transition-colors duration-200 hover:bg-sky-400/[0.12] ${visible ? 'animate-fade-in-item' : 'opacity-0'}`}
              style={visible ? { animationDelay: `${i * 30}ms` } : undefined}
            >
              <span className="text-[0.9rem] text-white/75 leading-snug flex-1 group-hover:text-white transition-colors duration-200">
                {wine.name}
                {wine.year && <span className="text-white/40 text-xs ml-1.5">({wine.year})</span>}
              </span>
              <span className="w-16 text-center text-white/90 text-sm font-semibold tracking-wide group-hover:text-white">
                {fmtWine(wine.priceCopa)}
              </span>
              <span className="w-20 text-center text-white/90 text-sm font-semibold tracking-wide group-hover:text-white">
                {fmtWine(wine.priceBottle)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isLast && <GoldenDivider />}
    </section>
  )
})

export default function MenuPage({ params }: { params: { type: string } }) {
  const isTapasRoute = params.type === 'tapas'
  const isAlergenosRoute = params.type === 'alergenos'
  const isVinosRoute = params.type === 'vinos'
  const [menu, setMenu] = useState<MenuData>(() => menuService.getDefaultMenu())
  const [importantDay, setImportantDay] = useState(false)
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

  const isImportantDay = menu.importantDay ?? importantDay
  const showWines = menu.showWines ?? true
  const isTapas = !isImportantDay && isTapasRoute
  const showAllergens = isAlergenosRoute
  const showingTapasBlocked = isImportantDay && isTapasRoute

  useEffect(() => {
    menuService.fetchMenu().then((fresh) => {
      setMenu(fresh)
      setImportantDay(fresh.importantDay ?? false)
    })
  }, [])

  useEffect(() => {
    if (importantDay && params.type === 'tapas') {
      router.replace('/menu/medias')
    }
  }, [importantDay, params.type, router])

  // Category intersection observer for nav highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveCategory(e.target.id)
        })
      },
      { threshold: 0.15, rootMargin: '-100px 0px -60% 0px' }
    )
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [menu])

  // Auto-scroll active nav button into view
  useEffect(() => {
    if (!activeCategory || !navRef.current) return
    const btn = navRef.current.querySelector(`[data-cat="${activeCategory}"]`) as HTMLElement | null
    if (btn) {
      const container = navRef.current
      container.scrollTo({
        left: btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2,
        behavior: 'smooth',
      })
    }
  }, [activeCategory])

  const sorted = useMemo(
    () => [...menu.categories].filter((c) => c.id !== 'bebidas').sort((a, b) => a.order - b.order),
    [menu.categories]
  )

  const sortedWines = useMemo(
    () => [...(menu.wineCategories || [])].sort((a, b) => a.order - b.order),
    [menu.wineCategories]
  )

  return (
    <div className="min-h-screen bg-[#031f4a] text-white overflow-x-hidden relative">
      <GradientOrbs />

      {/* ─── Hero ─── */}
      <header className="relative pt-14 pb-10 px-6 text-center overflow-hidden z-10">
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 pointer-events-none">
          <div
            className="w-full h-full rounded-full animate-spin-slow"
            style={{ background: 'conic-gradient(from 0deg, transparent, rgba(56,189,248,0.08), transparent, rgba(59,130,246,0.05), transparent)' }}
          />
        </div>

        <div className="animate-fade-in">
          <div className="mx-auto w-20 h-20 mb-5 flex items-center justify-center animate-logo-enter">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              <circle cx="32" cy="32" r="30" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5"/>
              <circle cx="32" cy="32" r="22" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3"/>
              <g stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
                <line x1="24" y1="18" x2="24" y2="28"/><line x1="24" y1="28" x2="24" y2="46"/>
                <line x1="21" y1="18" x2="21" y2="26"/><line x1="27" y1="18" x2="27" y2="26"/>
                <path d="M21 26 Q21 30 24 30 Q27 30 27 26"/>
              </g>
              <g stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
                <line x1="40" y1="30" x2="40" y2="46"/>
                <path d="M40 18 Q46 24 43 30 L40 30 Z" fill="#38bdf8" fillOpacity="0.15"/>
              </g>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64">
                  <stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <p className="text-sky-500/60 text-[10px] font-semibold tracking-[0.4em] uppercase mb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Bienvenido a
          </p>

          <AnimatedTitle text={menu.barName} />
        </div>

        <div className="mt-6 inline-flex items-center rounded-full bg-white/10 p-1 border border-white/20 backdrop-blur-xl animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          {isImportantDay ? (
            <>
              <a
                href="/menu/medias"
                className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                  !showAllergens && !isVinosRoute ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                Media
              </a>
              <a
                href="/menu/alergenos"
                className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                  showAllergens ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                Alérgenos
              </a>
              {showWines && (
                <a
                  href="/menu/vinos"
                  className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                    isVinosRoute ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Vinos
                </a>
              )}
            </>
          ) : (
            <>
              <a
                href="/menu/tapas"
                className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                  isTapas && !showAllergens && !isVinosRoute ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                Tapas
              </a>
              <a
                href="/menu/medias"
                className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                  !isTapas && !showAllergens && !isVinosRoute ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                Media
              </a>
              <a
                href="/menu/alergenos"
                className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                  showAllergens ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                }`}
              >
                Alérgenos
              </a>
              {showWines && (
                <a
                  href="/menu/vinos"
                  className={`flex-1 text-center px-4 py-2 rounded-full font-semibold transition ${
                    isVinosRoute ? 'bg-white text-[#031f4a] shadow-md' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Vinos
                </a>
              )}
            </>
          )}
        </div>

        {isImportantDay && !showAllergens && (
          <div className="mx-auto mt-4 max-w-lg rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-sm text-white/80">
              Solo disponible carta de Media Ración.
            </p>
          </div>
        )}

        <div className="mt-8 mx-auto w-32">
          <GoldenDivider />
        </div>
      </header>

      {/* ─── Sticky category nav ─── */}
      <nav className="sticky top-0 z-40 bg-[#031f4a]/70 backdrop-blur-2xl border-b border-white/[0.08]">
        <div ref={navRef} className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
          {isVinosRoute
            ? sortedWines.map((cat, i) => (
                <button
                  key={cat.id}
                  data-cat={`wine-${cat.id}`}
                  onClick={() =>
                    document.getElementById(`wine-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 animate-fade-in ${
                    activeCategory === `wine-${cat.id}`
                      ? 'bg-gradient-to-r from-sky-300 to-blue-400 text-white shadow-lg shadow-sky-300/30 scale-105'
                      : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/50'
                  }`}
                  style={{ animationDelay: `${0.8 + i * 0.08}s` }}
                >
                  <span className="mr-1.5">🍷</span>
                  {cat.name}
                </button>
              ))
            : sorted.map((cat, i) => (
                <button
                  key={cat.id}
                  data-cat={`cat-${cat.id}`}
                  onClick={() =>
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 animate-fade-in ${
                    activeCategory === `cat-${cat.id}`
                      ? 'bg-gradient-to-r from-sky-300 to-blue-400 text-white shadow-lg shadow-sky-300/30 scale-105'
                      : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/50'
                  }`}
                  style={{ animationDelay: `${0.8 + i * 0.08}s` }}
                >
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))
          }
        </div>
      </nav>

      {/* ─── Menu sections ─── */}
      <div className="px-5 pb-32 max-w-lg mx-auto relative z-10">
        {isVinosRoute ? (
          sortedWines.map((cat, i) => (
            <WineCategorySection key={cat.id} cat={cat} isLast={i === sortedWines.length - 1} />
          ))
        ) : showingTapasBlocked ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center mt-10">
            <p className="text-sm text-white/80">
              Solo disponible carta de Media Ración.
            </p>
            <a
              href="/menu/medias"
              className="mt-4 inline-block px-5 py-2 rounded-lg bg-sky-300 text-black font-bold hover:bg-sky-200"
            >
              Ir a Media
            </a>
          </div>
        ) : (
          sorted.map((cat, i) => (
            <CategorySection key={cat.id} cat={cat} isTapas={isTapas} isLast={i === sorted.length - 1} showAllergens={showAllergens} />
          ))
        )}
      </div>
    </div>
  )
}
