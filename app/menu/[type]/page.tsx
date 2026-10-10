'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MenuData, MenuCategory, MenuItem, WineCategory } from '@/types/menu'
import { menuService } from '@/lib/menuService'
import { ALLERGENS, ALLERGEN_SRC, dishAllergens } from '@/lib/allergens'
import { type Lang, LANGUAGES, LOCALES, isLang, t, tName, tAllergen, fmtEUR, detectBrowserLang } from '@/lib/translations'
import { GoldenDivider, GradientOrbs, LogoMark } from '@/components/Brand'

type Route = 'tapas' | 'medias' | 'alergenos' | 'vinos'

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order
const noteOf = (lang: Lang, cat: MenuCategory) => (cat.note?.trim() ? tName(lang, cat.note, cat.noteI18n) : '')

/* Kept between tab changes so switching Tapas/Medias/Vinos is instant (no reload, no flash) */
let cachedMenu: MenuData | null = null
let cachedLang: Lang | null = null

/* ─── Reveal on scroll ─── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.04, rootMargin: '0px 0px -8% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/* ─── Language selector ─── */
function LanguageSelector({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === lang)!

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t(lang, 'selectLang')}
        className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full bg-white/[0.08] border border-white/15 text-white/85 hover:bg-white/[0.14] transition backdrop-blur-xl"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-[11px] font-bold tracking-wider">{current.short}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul role="listbox" className="absolute right-0 mt-2 z-50 rounded-2xl bg-[#04244f]/95 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden min-w-[170px] py-1 animate-fade-in">
            {LANGUAGES.map((l) => (
              <li key={l.code}>
                <button
                  role="option"
                  aria-selected={l.code === lang}
                  onClick={() => {
                    setLang(l.code)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    l.code === lang ? 'bg-gold/[0.14] text-white' : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  <span className="text-lg leading-none">{l.flag}</span>
                  <span className="font-medium flex-1 text-left">{l.label}</span>
                  {l.code === lang && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/* ─── Allergen legend ─── */
function AllergenLegend({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-[#04244f] border border-white/15 shadow-2xl p-6 animate-modal-pop max-h-[85vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="text-[1.7rem] leading-tight font-display font-semibold text-gold-gradient">{t(lang, 'allergenInfo')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
            aria-label={t(lang, 'close')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-white/45 mb-5">{t(lang, 'allergenLegend')}</p>
        <div className="grid grid-cols-2 gap-2">
          {ALLERGENS.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
              <Image src={a.src} alt="" width={26} height={26} className="rounded-full flex-shrink-0" />
              <span className="text-[0.8rem] text-white/80 leading-tight">{tAllergen(lang, a.id)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Title: gradient on each letter so it stays visible while animating ─── */
function AnimatedTitle({ text }: { text: string }) {
  return (
    <h1 aria-label={text} className="font-display font-semibold text-[4rem] sm:text-7xl leading-[0.95] tracking-tight [perspective:600px]">
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden="true" className="inline-block gold-char animate-title-char" style={{ animationDelay: `${0.25 + i * 0.05}s` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </h1>
  )
}

/* ─── Tab icons ─── */
function TabIcon({ kind }: { kind: Route }) {
  const common = { className: 'w-[18px] h-[18px]', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true } as const
  switch (kind) {
    case 'tapas':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="15" rx="8" ry="3.2" />
          <path strokeLinecap="round" d="M9 13.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5M12 10V3.5" />
        </svg>
      )
    case 'medias':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="14.5" rx="10" ry="4" />
          <ellipse cx="12" cy="14" rx="5.5" ry="2" />
          <path strokeLinecap="round" d="M6 7.5c1-1 2-1 3 0M10.5 6c1-1 2-1 3 0M15 7.5c1-1 2-1 3 0" />
        </svg>
      )
    case 'alergenos':
      return (
        <svg {...common}>
          <path strokeLinejoin="round" d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3z" />
          <path strokeLinecap="round" d="M12 8v4.5M12 15.8v.2" />
        </svg>
      )
    case 'vinos':
      return (
        <svg {...common}>
          <path strokeLinejoin="round" d="M7.5 3h9l-.6 5.5a3.9 3.9 0 01-7.8 0L7.5 3z" />
          <path strokeLinecap="round" d="M12 12.5V20M8.5 20.5h7M8 7h8" />
        </svg>
      )
  }
}

/* ─── Indicador "la carta sigue" mientras se puede bajar ─── */
function ScrollHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      const y = window.scrollY || doc.scrollTop
      // Visible solo si hay recorrido real y aún no estamos cerca del final
      setShow(scrollable > 240 && y < scrollable - 120)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    // Re-comprobar cuando cambia la altura (la carta carga/actualiza en vivo)
    const ro = new ResizeObserver(check)
    ro.observe(document.body)
    const timer = setTimeout(check, 800)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      ro.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#04244f]/85 border border-gold/30 backdrop-blur-md shadow-lg shadow-black/30 animate-bounce-soft">
        <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

/* ─── Allergen chips under a dish ─── */
function AllergenChips({ allergens, lang }: { allergens?: string[]; lang: Lang }) {
  const list = (allergens ?? []).filter((a) => ALLERGEN_SRC[a])
  if (!list.length) {
    return <p className="mt-2 text-[11px] italic text-white/35">{t(lang, 'askAllergens')}</p>
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {list.map((a) => (
        <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] pl-0.5 pr-2.5 py-0.5">
          <Image src={ALLERGEN_SRC[a]} alt="" width={18} height={18} className="rounded-full" />
          <span className="text-[10.5px] text-white/70">{tAllergen(lang, a)}</span>
        </span>
      ))}
    </div>
  )
}

/* ─── Dish row ─── */
function DishRow({ item, priceMode, showAllergens, lang, delay, visible, perPerson }: {
  item: MenuItem
  perPerson?: boolean
  priceMode: 'tapa' | 'media'
  showAllergens: boolean
  lang: Lang
  delay: number
  visible: boolean
}) {
  const price = item.samePrice || priceMode === 'tapa' ? item.priceTapa : item.priceMedia
  const name = tName(lang, item.name, item.nameI18n)
  const showOriginal = lang !== 'es' && name !== item.name
  const variants = (item.variants ?? []).filter((v) => !v.hidden && v.name?.trim())
  return (
    <div
      className={`group px-4 py-3.5 rounded-xl transition-colors duration-200 hover:bg-gold/[0.06] ${visible ? 'animate-fade-in-item' : 'opacity-0'}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-end gap-2">
        <span className="min-w-0 max-w-[74%] text-[0.95rem] text-white/85 leading-snug group-hover:text-white transition-colors">{name}</span>
        <span className="flex-1 border-b border-dotted border-white/[0.12] min-w-[1rem] mb-[0.32rem] group-hover:border-gold/35 transition-colors" />
        {price > 0 ? (
          <span className="text-gold-soft text-sm font-semibold tracking-wide whitespace-nowrap tabular-nums leading-snug">
            {fmtEUR(price, lang)}
            {perPerson && <span className="ml-1 text-[10.5px] font-medium text-gold-soft/60">{t(lang, 'perPerson')}</span>}
          </span>
        ) : (
          <span className="text-white/40 text-xs italic whitespace-nowrap leading-snug">{t(lang, 'ask')}</span>
        )}
      </div>
      {variants.length > 0 && (
        <p className="mt-1 text-[13px] leading-snug italic font-display tracking-wide text-gold-soft/80">
          {variants.map((v) => tName(lang, v.name, v.nameI18n)).join(' · ')}
        </p>
      )}
      {showOriginal && <p className="text-[11px] italic text-white/35 mt-0.5 font-display tracking-wide">{item.name}</p>}
      {showAllergens && <AllergenChips allergens={dishAllergens(item)} lang={lang} />}
    </div>
  )
}

/* ─── Section heading ─── */
function SectionHeading({ index, icon, title, note, people, description, visible }: {
  index: number
  icon?: string
  title: string
  note?: string
  people?: string
  description?: string
  visible: boolean
}) {
  return (
    <div className={`mb-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <div className="flex items-center gap-3">
        <span className="font-display italic text-gold/55 text-base tabular-nums w-6">{String(index + 1).padStart(2, '0')}</span>
        {icon && <span className="text-xl leading-none">{icon}</span>}
        <h2 className="text-[1.65rem] leading-none font-display font-semibold text-white tracking-tight">{title}</h2>
        <div className={`flex-1 h-px bg-gradient-to-r from-gold/35 to-transparent transition-transform duration-700 origin-left ${visible ? 'scale-x-100' : 'scale-x-0'}`} />
      </div>
      {(note || people) && (
        <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
          {note && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-[11px] font-semibold tracking-wide text-gold-soft">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <rect x="4" y="5" width="16" height="15" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="M4 10h16M9 3v4M15 3v4" />
              </svg>
              {note}
            </span>
          )}
          {people && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-[11px] font-semibold tracking-wide text-gold-soft">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <circle cx="9" cy="8" r="3" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5M16 5.5a3 3 0 010 5.5M17.5 14c1.7.6 2.7 2.4 3 5" />
              </svg>
              {people}
            </span>
          )}
        </div>
      )}
      {description && <p className="mt-2.5 ml-9 text-[12.5px] leading-relaxed text-white/55">{description}</p>}
    </div>
  )
}

/* ─── Dish category ─── */
const CategorySection = React.memo(function CategorySection({
  cat, index, priceMode, isLast, showAllergens, lang,
}: {
  cat: MenuCategory
  index: number
  priceMode: 'tapa' | 'media'
  isLast: boolean
  showAllergens: boolean
  lang: Lang
}) {
  const { ref, visible } = useReveal<HTMLElement>()
  const items = useMemo(() => cat.items.filter((it) => it.name?.trim() && !it.hidden).sort(byOrder), [cat.items])
  if (!items.length) return null
  const noAllergenData = items.every((it) => !dishAllergens(it).length)

  return (
    <section ref={ref} id={`cat-${cat.id}`} data-section className="pt-8 scroll-mt-16">
      <SectionHeading
        index={index}
        icon={cat.icon}
        title={tName(lang, cat.name, cat.nameI18n)}
        note={noteOf(lang, cat)}
        people={cat.minPeople && cat.minPeople > 1 ? t(lang, 'minPeople').replace('{n}', String(cat.minPeople)) : undefined}
        description={cat.description?.trim() ? tName(lang, cat.description, cat.descriptionI18n) : undefined}
        visible={visible}
      />
      {showAllergens && noAllergenData && (
        <p className="-mt-1 mb-3 ml-9 text-[11px] italic text-white/45">{t(lang, 'askAllergens')}</p>
      )}
      <div className={`rounded-2xl bg-white/[0.025] border border-white/[0.06] p-1 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="divide-y divide-white/[0.045]">
          {items.map((item, i) => (
            <DishRow
              key={item.id}
              item={item}
              priceMode={priceMode}
              perPerson={!!cat.pricePerPerson}
              showAllergens={showAllergens && !noAllergenData}
              lang={lang}
              delay={i * 30}
              visible={visible}
            />
          ))}
        </div>
      </div>
      {!isLast && <GoldenDivider className="mt-8 mb-0" />}
    </section>
  )
})

/* ─── Wine category ─── */
const WineCategorySection = React.memo(function WineCategorySection({
  cat, index, isLast, lang,
}: {
  cat: WineCategory
  index: number
  isLast: boolean
  lang: Lang
}) {
  const { ref, visible } = useReveal<HTMLElement>()
  const items = useMemo(() => cat.items.filter((w) => w.name?.trim() && !w.hidden).sort(byOrder), [cat.items])
  if (!items.length) return null

  return (
    <section ref={ref} id={`wine-${cat.id}`} data-section className="pt-8 scroll-mt-16">
      <SectionHeading index={index} icon="🍷" title={tName(lang, cat.name, cat.nameI18n)} visible={visible} />
      <div className={`rounded-2xl bg-white/[0.025] border border-white/[0.06] p-1 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 pt-3 pb-2 px-4 text-[10px] uppercase tracking-[0.18em] text-gold/55 font-semibold">
          <span className="flex-1">{t(lang, 'wine')}</span>
          <span className="w-16 text-right">{t(lang, 'glass')}</span>
          <span className="w-[4.5rem] text-right">{t(lang, 'bottle')}</span>
        </div>
        <div className="divide-y divide-white/[0.045]">
          {items.map((wine, i) => (
            <div
              key={wine.id}
              className={`group flex items-center gap-2 py-3.5 px-4 rounded-xl transition-colors duration-200 hover:bg-gold/[0.06] ${visible ? 'animate-fade-in-item' : 'opacity-0'}`}
              style={visible ? { animationDelay: `${i * 30}ms` } : undefined}
            >
              <span className="flex-1 min-w-0 text-[0.95rem] text-white/85 leading-snug group-hover:text-white transition-colors">
                {tName(lang, wine.name, wine.nameI18n)}
                {wine.year && <span className="text-white/40 text-xs ml-1.5 font-display italic">{wine.year}</span>}
              </span>
              <span className="w-16 text-right text-gold-soft text-sm font-semibold tabular-nums">
                {wine.priceCopa > 0 ? fmtEUR(wine.priceCopa, lang) : <span className="text-white/25">—</span>}
              </span>
              <span className="w-[4.5rem] text-right text-gold-soft text-sm font-semibold tabular-nums">
                {wine.priceBottle > 0 ? fmtEUR(wine.priceBottle, lang) : <span className="text-white/40 text-xs italic font-normal">{t(lang, 'ask')}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
      {!isLast && <GoldenDivider className="mt-8 mb-0" />}
    </section>
  )
})

/* ─── Loading placeholder ─── */
function MenuSkeleton() {
  return (
    <div className="pt-10 space-y-8" aria-hidden="true">
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="h-7 w-44 rounded-lg skeleton mb-4" />
          <div className="rounded-2xl border border-white/[0.06] p-4 space-y-4">
            {[0, 1, 2, 3, 4].map((r) => (
              <div key={r} className="flex items-center gap-3">
                <div className="h-4 rounded skeleton" style={{ width: `${55 - r * 5}%` }} />
                <div className="flex-1" />
                <div className="h-4 w-12 rounded skeleton" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── Page ───────────────────────── */

export default function MenuPage({ params }: { params: { type: string } }) {
  const route: Route = (['tapas', 'medias', 'alergenos', 'vinos'] as const).includes(params.type as Route)
    ? (params.type as Route)
    : 'medias'
  const router = useRouter()

  const [menu, setMenu] = useState<MenuData | null>(cachedMenu)
  const [lang, setLangState] = useState<Lang>(cachedLang ?? 'es')
  const [showLegend, setShowLegend] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const navRef = useRef<HTMLDivElement>(null)

  /* Language: saved choice, otherwise the browser language */
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem('carta-lang')
    } catch {}
    const initial = isLang(saved) ? saved : detectBrowserLang()
    cachedLang = initial
    setLangState(initial)
  }, [])

  const setLang = (l: Lang) => {
    cachedLang = l
    setLangState(l)
    try {
      localStorage.setItem('carta-lang', l)
    } catch {}
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  /* Carta en tiempo real: los cambios del admin llegan al instante, sin recargar.
     Si Firestore no responde en 7 s, se muestra la carta de fábrica. */
  useEffect(() => {
    let received = false
    const fallback = setTimeout(() => {
      if (!received && !cachedMenu) setMenu(menuService.getDefaultMenu())
    }, 7000)
    const unsubscribe = menuService.subscribeMenu(
      (fresh) => {
        received = true
        clearTimeout(fallback)
        cachedMenu = fresh
        setMenu(fresh)
      },
      () => {
        if (!cachedMenu) setMenu(menuService.getDefaultMenu())
      }
    )
    return () => {
      clearTimeout(fallback)
      unsubscribe()
    }
  }, [])

  /* Contador de visitas: 1 por sesión (≈ un escaneo del QR), solo se ve en el admin */
  useEffect(() => {
    try {
      if (sessionStorage.getItem('carta-visit-counted')) return
      sessionStorage.setItem('carta-visit-counted', '1')
    } catch {
      /* si sessionStorage falla, contamos igualmente */
    }
    menuService.recordVisit()
  }, [])

  const isImportantDay = !!menu?.importantDay
  const showWines = menu?.showWines ?? true
  const isVinos = route === 'vinos' && showWines
  const showAllergens = route === 'alergenos'
  const priceMode: 'tapa' | 'media' = route === 'tapas' && !isImportantDay ? 'tapa' : 'media'

  useEffect(() => {
    if (!menu) return
    if (isImportantDay && route === 'tapas') router.replace('/menu/medias')
    if (!showWines && route === 'vinos') router.replace('/menu/medias')
  }, [menu, isImportantDay, showWines, route, router])

  const categories = useMemo(
    () =>
      (menu?.categories ?? [])
        .filter((c) => c.id !== 'bebidas' && !c.hidden && c.items.some((it) => it.name?.trim() && !it.hidden))
        .sort(byOrder),
    [menu]
  )
  const wineCategories = useMemo(
    () => (menu?.wineCategories ?? []).filter((c) => !c.hidden && c.items.some((w) => w.name?.trim() && !w.hidden)).sort(byOrder),
    [menu]
  )

  /* Highlight the section in view */
  useEffect(() => {
    if (!menu) return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-section]'))
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id))
      },
      { rootMargin: '-90px 0px -65% 0px' }
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [menu, route, lang])

  /* Keep the active pill centred in the nav */
  useEffect(() => {
    const nav = navRef.current
    if (!activeSection || !nav) return
    const btn = nav.querySelector<HTMLElement>(`[data-target="${activeSection}"]`)
    if (btn) nav.scrollTo({ left: btn.offsetLeft - nav.clientWidth / 2 + btn.clientWidth / 2, behavior: 'smooth' })
  }, [activeSection])

  const tabs = [
    !isImportantDay && { key: 'tapas' as Route, label: t(lang, 'tapas') },
    { key: 'medias' as Route, label: t(lang, 'media') },
    { key: 'alergenos' as Route, label: t(lang, 'allergens') },
    showWines && { key: 'vinos' as Route, label: t(lang, 'wines') },
  ].filter(Boolean) as { key: Route; label: string }[]

  const activeTab: Route = route === 'tapas' && isImportantDay ? 'medias' : route

  const subtitle = isVinos
    ? t(lang, 'winesSub')
    : showAllergens
    ? t(lang, 'allergensSub')
    : priceMode === 'tapa'
    ? t(lang, 'tapasSub')
    : t(lang, 'mediaSub')

  const navItems = isVinos
    ? wineCategories.map((c) => ({ id: `wine-${c.id}`, label: tName(lang, c.name, c.nameI18n), icon: '🍷' }))
    : categories.map((c) => ({ id: `cat-${c.id}`, label: tName(lang, c.name, c.nameI18n), icon: c.icon }))

  const barName = menu?.barName || 'Sabores'

  return (
    <div className="min-h-screen bg-[#021530] text-white relative">
      <GradientOrbs />
      {showLegend && <AllergenLegend lang={lang} onClose={() => setShowLegend(false)} />}

      {/* ─── Hero ─── */}
      <header className="relative z-10 px-5 pt-4 pb-7 text-center overflow-hidden">
        <div className="max-w-lg mx-auto flex justify-end">
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        <div className="absolute top-[-90px] left-1/2 -translate-x-1/2 w-[22rem] h-[22rem] pointer-events-none" aria-hidden="true">
          <div
            className="w-full h-full rounded-full animate-spin-slow"
            style={{ background: 'conic-gradient(from 0deg, transparent, rgba(216,185,117,0.11), transparent, rgba(124,196,240,0.07), transparent)' }}
          />
        </div>

        <div className="relative animate-fade-in">
          <LogoMark className="mx-auto w-[4.5rem] h-[4.5rem] mb-4 animate-logo-enter" />
          <p className="text-gold/75 text-[10px] font-semibold tracking-[0.45em] uppercase mb-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {t(lang, 'welcomeTo')}
          </p>
          <AnimatedTitle text={barName} />
          <p className="mt-3 text-white/50 text-[0.95rem] italic font-display tracking-wide animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {subtitle}
          </p>
        </div>

        {/* View tabs */}
        <nav
          aria-label="Carta"
          className="mt-6 mx-auto max-w-md grid gap-1 rounded-2xl bg-white/[0.06] p-1 border border-white/[0.12] backdrop-blur-xl animate-fade-in-up"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`, animationDelay: '0.7s' }}
        >
          {tabs.map((tab) => {
            const active = tab.key === activeTab
            return (
              <Link
                key={tab.key}
                href={`/menu/${tab.key}`}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[12px] font-semibold leading-tight transition-all ${
                  active
                    ? 'bg-gradient-to-br from-gold-soft to-gold text-navy-900 shadow-md shadow-gold/25'
                    : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <TabIcon kind={tab.key} />
                <span className="text-center">{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {showAllergens && (
          <button
            onClick={() => setShowLegend(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-white/75 hover:bg-white/[0.12] hover:text-white transition animate-fade-in"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t(lang, 'allergenInfo')}
          </button>
        )}

        {isImportantDay && !showAllergens && !isVinos && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-gold/20 bg-gold/[0.06] px-4 py-3 text-center animate-fade-in">
            <p className="text-sm text-gold-soft/90">{t(lang, 'onlyMedia')}</p>
          </div>
        )}
      </header>

      {/* ─── Sticky section nav ─── */}
      {menu && navItems.length > 1 && (
        <nav className="sticky top-0 z-40 bg-[#021530]/90 backdrop-blur-2xl border-y border-white/[0.07]" aria-label="Secciones">
          <div ref={navRef} className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 w-max mx-auto px-4 py-2.5">
              {navItems.map((n) => {
                const active = activeSection === n.id
                return (
                  <button
                    key={n.id}
                    data-target={n.id}
                    onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-r from-gold-soft to-gold text-navy-900 shadow-md shadow-gold/25'
                        : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white/80'
                    }`}
                  >
                    {n.icon && <span className="mr-1.5">{n.icon}</span>}
                    {n.label}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      )}

      {/* ─── Content ─── */}
      <main className="px-4 sm:px-5 pb-24 max-w-lg mx-auto relative z-10">
        {!menu ? (
          <MenuSkeleton />
        ) : isVinos ? (
          wineCategories.map((cat, i) => (
            <WineCategorySection key={cat.id} cat={cat} index={i} isLast={i === wineCategories.length - 1} lang={lang} />
          ))
        ) : (
          categories.map((cat, i) => (
            <CategorySection
              key={cat.id}
              cat={cat}
              index={i}
              priceMode={priceMode}
              isLast={i === categories.length - 1}
              showAllergens={showAllergens}
              lang={lang}
            />
          ))
        )}

        {/* ─── Footer ─── */}
        {menu && (
          <footer className="mt-14 text-center">
            <GoldenDivider className="mb-8" />
            <LogoMark className="w-9 h-9 mx-auto opacity-70" />
            <p className="mt-3 font-display text-2xl text-white/80">{barName}</p>
            <p className="mt-4 text-xs text-white/50 max-w-xs mx-auto leading-relaxed">{t(lang, 'allergyNotice')}</p>
            <p className="mt-1.5 text-[11px] text-white/35">{t(lang, 'vatIncluded')}</p>
            {menu.updatedAt && (
              <p className="mt-5 text-[10px] text-white/25 tracking-[0.2em] uppercase">
                {t(lang, 'updated')} · {new Date(menu.updatedAt).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </footer>
        )}
      </main>

      <ScrollHint />
    </div>
  )
}
