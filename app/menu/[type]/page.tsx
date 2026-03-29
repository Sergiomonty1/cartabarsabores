'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { MenuData } from '@/types/menu'
import { menuService } from '@/lib/menuService'

const fmt = (n: number) =>
  n === 0 ? 'Consultar' : n.toFixed(2).replace('.', ',') + ' €'

/* ─── Floating particles background ─── */
function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-particle"
          style={{
            width: `${40 + i * 8}px`,
            height: `${40 + i * 8}px`,
            left: `${(i * 23) % 100}%`,
            top: `${(i * 31) % 100}%`,
            opacity: 0.03,
            background: `radial-gradient(circle, ${
              i % 3 === 0
                ? 'rgba(245, 158, 11, 0.6)'
                : i % 3 === 1
                ? 'rgba(249, 115, 22, 0.5)'
                : 'rgba(234, 88, 12, 0.4)'
            }, transparent)`,
            animationDuration: `${12 + i * 2}s`,
            animationDelay: `${-i * 3}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Animated shimmer divider ─── */
function AnimatedDivider() {
  return (
    <div className="relative h-px my-2 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      <div className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent animate-shimmer" />
    </div>
  )
}

export default function MenuPage({ params }: { params: { type: string } }) {
  const isTapas = params.type === 'tapas'
  const label = isTapas ? 'Tapas' : 'Media Ración'

  // ✅ Renders INSTANTLY with hardcoded defaults — no spinner ever
  const [menu, setMenu] = useState<MenuData>(() => menuService.getDefaultMenu())
  const [activeCategory, setActiveCategory] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

  // Silently fetch fresh data from Firestore in the background
  useEffect(() => {
    menuService.fetchMenu().then((fresh) => setMenu(fresh))
  }, [])

  // Intersection observer for active category highlighting
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

  // Scroll active category pill into view (horizontal only — no page scroll)
  useEffect(() => {
    if (!activeCategory || !navRef.current) return
    const btn = navRef.current.querySelector(
      `[data-cat="${activeCategory}"]`
    ) as HTMLElement | null
    if (btn && navRef.current) {
      const container = navRef.current
      const scrollLeft =
        btn.offsetLeft - container.clientWidth / 2 + btn.clientWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [activeCategory])

  const sorted = [...menu.categories].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden relative">
      <FloatingParticles />

      {/* Ambient gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-amber-900/[0.06] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-amber-900/[0.04] to-transparent" />
      </div>

      {/* ─── Hero ─── */}
      <header className="relative pt-12 pb-8 px-6 text-center overflow-hidden z-10">
        {/* Pulsing glow behind title */}
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <motion.img
            src="/logo.svg"
            alt="Sabores"
            className="mx-auto w-44 h-auto mb-4 opacity-80"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          <p className="text-amber-400/50 text-[10px] font-semibold tracking-[0.35em] uppercase mb-3">
            Bienvenido a
          </p>
          <h1
            className="text-5xl sm:text-6xl font-display font-bold tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {menu.barName}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-5 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="text-sm font-semibold text-amber-300/90 tracking-wider uppercase">
            {label}
          </span>
        </motion.div>

        <div className="mt-8 mx-auto w-24">
          <AnimatedDivider />
        </div>
      </header>

      {/* ─── Sticky category nav ─── */}
      <nav className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/[0.03]">
        <div
          ref={navRef}
          className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide"
        >
          {sorted.map((cat) => (
            <motion.button
              key={cat.id}
              data-cat={`cat-${cat.id}`}
              onClick={() =>
                sectionRefs.current[`cat-${cat.id}`]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              whileTap={{ scale: 0.93 }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeCategory === `cat-${cat.id}`
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/55'
              }`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* ─── Menu sections ─── */}
      <div className="px-5 pb-28 max-w-lg mx-auto relative z-10">
        {sorted.map((cat, catIndex) => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={(el) => {
              sectionRefs.current[`cat-${cat.id}`] = el
            }}
            className="pt-10"
          >
            {/* Animated section header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 mb-5"
            >
              {cat.icon && (
                <motion.span
                  className="text-2xl"
                  initial={{ rotate: -20, scale: 0.5 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  {cat.icon}
                </motion.span>
              )}
              <h2 className="text-xl font-display font-bold text-amber-50 tracking-tight">
                {cat.name}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
            </motion.div>

            {/* Menu items with staggered entrance */}
            <div className="space-y-0.5">
              {cat.items
                .sort((a, b) => a.order - b.order)
                .map((item, i) => {
                  const displayPrice = item.samePrice
                    ? item.priceTapa
                    : isTapas
                    ? item.priceTapa
                    : item.priceMedia

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-10px' }}
                      transition={{
                        duration: 0.35,
                        delay: i * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group flex items-baseline gap-2 py-3.5 px-3 -mx-3 rounded-xl transition-all duration-300 hover:bg-amber-500/[0.03] hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.02)]"
                    >
                      <span className="text-[0.9rem] text-amber-100/80 leading-snug flex-shrink-0 max-w-[70%] group-hover:text-amber-100 transition-colors">
                        {item.name}
                      </span>
                      <span className="flex-1 border-b border-dotted border-white/[0.06] min-w-[1.5rem] self-end mb-1.5 group-hover:border-amber-500/15 transition-colors" />
                      <span
                        className={`font-semibold tracking-wide whitespace-nowrap transition-colors ${
                          displayPrice === 0
                            ? 'text-amber-400/40 text-xs italic'
                            : 'text-amber-400/90 text-sm group-hover:text-amber-300'
                        }`}
                      >
                        {fmt(displayPrice)}
                      </span>
                    </motion.div>
                  )
                })}
            </div>

            {catIndex < sorted.length - 1 && (
              <div className="mt-8">
                <AnimatedDivider />
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pointer-events-none">
        <motion.div
          className="pointer-events-auto max-w-lg mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <a
            href={isTapas ? '/menu/medias' : '/menu/tapas'}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600/12 to-orange-600/12 border border-amber-500/20 text-amber-300 text-sm font-semibold tracking-wide transition-all hover:from-amber-600/20 hover:to-orange-600/20 hover:border-amber-500/35 active:scale-[0.98] backdrop-blur-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Ver carta de {isTapas ? 'Medias Raciones' : 'Tapas'}
          </a>
        </motion.div>
      </div>
    </div>
  )
}
