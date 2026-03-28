'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { MenuData } from '@/types/menu'
import { menuService } from '@/lib/menuService'

const fmt = (n: number) =>
  n === 0 ? 'Consultar' : n.toFixed(2).replace('.', ',') + ' €'

export default function MenuPage({ params }: { params: { type: string } }) {
  const isTapas = params.type === 'tapas'
  const label = isTapas ? 'Tapas' : 'Media Ración'

  const [menu, setMenu] = useState<MenuData | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    menuService.getMenu().then(setMenu)
  }, [])

  useEffect(() => {
    if (!menu) return
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
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeCategory])

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-200/60 text-sm tracking-widest uppercase">
            Cargando carta…
          </p>
        </div>
      </div>
    )
  }

  const sorted = [...menu.categories].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      {/* ─── Hero ─── */}
      <header className="relative pt-14 pb-10 px-6 text-center overflow-hidden">
        {/* warm ambient glow */}
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-600/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-500/5 blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-amber-400/60 text-xs font-medium tracking-[0.25em] uppercase mb-2">
            Bienvenido a
          </p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-amber-50 leading-none">
            {menu.barName}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-amber-500/30 bg-amber-500/8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="text-sm font-semibold text-amber-300 tracking-wider uppercase">
            {label}
          </span>
        </motion.div>

        {/* decorative line */}
        <div className="mt-8 mx-auto w-20 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </header>

      {/* ─── Sticky category nav ─── */}
      <nav
        ref={navRef}
        className="sticky top-0 z-40 bg-[#0d0d0d]/85 backdrop-blur-xl border-b border-white/[0.04]"
      >
        <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
          {sorted.map((cat) => (
            <button
              key={cat.id}
              data-cat={`cat-${cat.id}`}
              onClick={() =>
                sectionRefs.current[`cat-${cat.id}`]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeCategory === `cat-${cat.id}`
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
              }`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Menu sections ─── */}
      <div className="px-5 pb-28 max-w-lg mx-auto">
        {sorted.map((cat) => (
          <section
            key={cat.id}
            id={`cat-${cat.id}`}
            ref={(el) => {
              sectionRefs.current[`cat-${cat.id}`] = el
            }}
            className="pt-10"
          >
            {/* section header */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6"
            >
              {cat.icon && <span className="text-2xl">{cat.icon}</span>}
              <h2 className="text-xl font-display font-bold text-amber-50 tracking-tight">
                {cat.name}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/25 to-transparent" />
            </motion.div>

            {/* items grid */}
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
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-10px' }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="group flex items-baseline gap-2 py-3.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-[0.9rem] text-amber-100/85 leading-snug flex-shrink-0 max-w-[70%]">
                        {item.name}
                      </span>
                      <span className="flex-1 border-b border-dotted border-white/[0.08] min-w-[1.5rem] self-end mb-1.5" />
                      <span
                        className={`text-sm font-semibold tracking-wide whitespace-nowrap ${
                          displayPrice === 0
                            ? 'text-amber-400/50 text-xs italic'
                            : 'text-amber-400'
                        }`}
                      >
                        {fmt(displayPrice)}
                      </span>
                    </motion.div>
                  )
                })}
            </div>
          </section>
        ))}
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-lg mx-auto">
          <a
            href={isTapas ? '/menu/medias' : '/menu/tapas'}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600/15 to-orange-600/15 border border-amber-500/25 text-amber-300 text-sm font-semibold tracking-wide transition-all hover:from-amber-600/25 hover:to-orange-600/25 hover:border-amber-500/40 active:scale-[0.98]"
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
        </div>
      </div>
    </div>
  )
}
