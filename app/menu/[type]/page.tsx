'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import type { MenuData } from '@/types/menu'
import { menuService } from '@/lib/menuService'

const fmt = (n: number) =>
  n === 0 ? 'Consultar' : n.toFixed(2).replace('.', ',') + ' €'

/* ─── Animated gradient orbs (luxury background) ─── */
function GradientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {/* Film grain overlay */}
      <div className="fixed inset-0 opacity-[0.015] mix-blend-overlay noise-bg" />
    </div>
  )
}

/* ─── Animated shimmer divider ─── */
function GoldenDivider() {
  return (
    <motion.div
      className="relative h-px my-6 overflow-hidden"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-200/40 to-transparent" />
      <div className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-sky-100/70 to-transparent animate-shimmer" />
    </motion.div>
  )
}

/* ─── Letter-by-letter text reveal ─── */
function AnimatedTitle({ text }: { text: string }) {
  return (
    <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight leading-none">
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.3 + i * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
          style={{
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </h1>
  )
}

export default function MenuPage({ params }: { params: { type: string } }) {
  const isTapas = params.type === 'tapas'
  const label = isTapas ? 'Tapas' : 'Media Ración'

  const [menu, setMenu] = useState<MenuData>(() => menuService.getDefaultMenu())
  const [activeCategory, setActiveCategory] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)

  // Parallax on hero
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, 120])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    menuService.fetchMenu().then((fresh) => setMenu(fresh))
  }, [])

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

  const sorted = [...menu.categories]
    .filter((c) => c.id !== 'bebidas')
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-[#031f4a] text-white overflow-x-hidden relative">
      <GradientOrbs />

      {/* ─── Hero with parallax ─── */}
      <motion.header
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative pt-14 pb-10 px-6 text-center overflow-hidden z-10"
      >
        {/* Rotating glow ring */}
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 pointer-events-none">
          <div className="w-full h-full rounded-full animate-spin-slow"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(56,189,248,0.08), transparent, rgba(59,130,246,0.05), transparent)',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Logo with rotation entrance */}
          <motion.div
            className="mx-auto w-20 h-20 mb-5 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              <circle cx="32" cy="32" r="30" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5"/>
              <circle cx="32" cy="32" r="22" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3"/>
              <g stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
                <line x1="24" y1="18" x2="24" y2="28"/>
                <line x1="24" y1="28" x2="24" y2="46"/>
                <line x1="21" y1="18" x2="21" y2="26"/>
                <line x1="27" y1="18" x2="27" y2="26"/>
                <path d="M21 26 Q21 30 24 30 Q27 30 27 26"/>
              </g>
              <g stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
                <line x1="40" y1="30" x2="40" y2="46"/>
                <path d="M40 18 Q46 24 43 30 L40 30 Z" fill="#38bdf8" fillOpacity="0.15"/>
              </g>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64">
                  <stop offset="0%" stopColor="#38bdf8"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <motion.p
            className="text-sky-500/60 text-[10px] font-semibold tracking-[0.4em] uppercase mb-3"
            initial={{ opacity: 0, letterSpacing: '0.8em' }}
            animate={{ opacity: 1, letterSpacing: '0.4em' }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Bienvenido a
          </motion.p>

          <AnimatedTitle text={menu.barName} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, type: 'spring' }}
          className="mt-6 inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-sky-300/15 bg-sky-300/[0.04] backdrop-blur-xl shadow-[0_0_40px_rgba(135,206,235,0.08)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-200 shadow-[0_0_8px_rgba(135,206,235,0.6)]" />
          </span>
          <span className="text-sm font-semibold text-sky-600/80 tracking-wider uppercase">
            {label}
          </span>
        </motion.div>

        <div className="mt-8 mx-auto w-32">
          <GoldenDivider />
        </div>
      </motion.header>

      {/* ─── Sticky category nav ─── */}
      <nav className="sticky top-0 z-40 bg-[#031f4a]/70 backdrop-blur-2xl border-b border-white/[0.08]">
        <div
          ref={navRef}
          className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide"
        >
          {sorted.map((cat, i) => (
            <motion.button
              key={cat.id}
              data-cat={`cat-${cat.id}`}
              onClick={() =>
                sectionRefs.current[`cat-${cat.id}`]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.08, duration: 0.3 }}
              whileTap={{ scale: 0.93 }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeCategory === `cat-${cat.id}`
                  ? 'bg-gradient-to-r from-sky-300 to-blue-400 text-white shadow-lg shadow-sky-300/30 scale-105'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700'
              }`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* ─── Menu sections ─── */}
      <div className="px-5 pb-32 max-w-lg mx-auto relative z-10">
        {sorted.map((cat, catIndex) => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={(el) => {
              sectionRefs.current[`cat-${cat.id}`] = el
            }}
            className="pt-10"
          >
            {/* Category header with line draw */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              {cat.icon && (
                <motion.span
                  className="text-2xl"
                  initial={{ rotate: -20, scale: 0, opacity: 0 }}
                  whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
                >
                  {cat.icon}
                </motion.span>
              )}
              <motion.h2
                className="text-xl font-display font-bold text-gray-900 tracking-tight"
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                {cat.name}
              </motion.h2>
              <motion.div
                className="flex-1 h-px bg-gradient-to-r from-sky-300/25 to-transparent"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>

            {/* Glassmorphism card */}
            <motion.div
              className="rounded-2xl bg-white/[0.015] border border-white/[0.04] backdrop-blur-sm p-1 shadow-[0_0_60px_rgba(245,158,11,0.02)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="divide-y divide-white/[0.03]">
                {cat.items
                  .filter((item) => item.name && item.name.trim() !== '')
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
                        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        viewport={{ once: true, margin: '-10px' }}
                        transition={{
                          duration: 0.4,
                          delay: i * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`group py-3.5 px-4 rounded-xl transition-all duration-300 hover:bg-sky-200/[0.12] menu-item-hover ${
                          displayPrice === 0 ? 'text-center' : 'flex items-baseline gap-2'
                        }`}
                      >
                        {displayPrice === 0 ? (
                          <span className="text-[0.9rem] text-sky-700/70 leading-snug group-hover:text-sky-900 transition-colors">
                            {item.name}
                          </span>
                        ) : (
                          <>
                            <span className="text-[0.9rem] text-sky-700/75 leading-snug flex-shrink-0 max-w-[70%] group-hover:text-sky-900 transition-colors duration-300">
                              {item.name}
                            </span>
                            <span className="flex-1 border-b border-dotted border-gray-300/[0.04] min-w-[1.5rem] self-end mb-1.5 group-hover:border-sky-400/20 transition-colors duration-500" />
                            <span className="text-sky-600/90 text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-300 group-hover:text-sky-800 group-hover:scale-105">
                              {fmt(displayPrice)}
                            </span>
                          </>
                        )}
                      </motion.div>
                    )
                  })}
              </div>
            </motion.div>

            {catIndex < sorted.length - 1 && <GoldenDivider />}
          </section>
        ))}
      </div>

      {/* ─── Bottom bar with glow pulse ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-8 bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent pointer-events-none">
        <motion.div
          className="pointer-events-auto max-w-lg mx-auto"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6, type: 'spring' }}
        >
          <a
            href={isTapas ? '/menu/medias' : '/menu/tapas'}
            className="group relative flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600/12 to-blue-700/10 border border-sky-500/20 text-sky-100 text-sm font-semibold tracking-wide transition-all hover:from-sky-600/20 hover:to-blue-700/20 hover:border-sky-400/30 active:scale-[0.98] backdrop-blur-xl overflow-hidden"
          >
            {/* Glow sweep on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-400/10 to-transparent animate-shimmer" />
            </div>
            <svg
              className="w-4 h-4 relative z-10 transition-transform group-hover:rotate-180 duration-500"
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
            <span className="relative z-10">Ver carta de {isTapas ? 'Medias Raciones' : 'Tapas'}</span>
          </a>
        </motion.div>
      </div>
    </div>
  )
}
