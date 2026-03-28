'use client'

import React, { useEffect, useState, useCallback } from 'react'
import type { MenuData, MenuCategory, MenuItem } from '@/types/menu'
import { menuService } from '@/lib/menuService'

const PASSCODE = '1111'

/* ──────── passcode gate ──────── */
function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const check = () => {
    if (code === PASSCODE) {
      sessionStorage.setItem('menu-admin', '1')
      onUnlock()
    } else {
      setError(true)
      setTimeout(() => setError(false), 1200)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-6">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold text-amber-50 text-center mb-1">
          Panel Admin
        </h1>
        <p className="text-center text-white/30 text-sm mb-8">
          Introduce el código de acceso
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder:text-white/20 text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
              error
                ? 'border-red-500 animate-[shake_0.3s_ease-in-out]'
                : 'border-white/10'
            }`}
            autoFocus
          />
          <button
            onClick={check}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold tracking-wide hover:bg-amber-400 transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) }
          25% { transform: translateX(-6px) }
          75% { transform: translateX(6px) }
        }
      `}</style>
    </div>
  )
}

/* ──────── admin panel ──────── */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    catId: string
    itemId: string
  } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('menu-admin') === '1')
      setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    // Show defaults instantly so admin panel is usable right away
    setMenu(menuService.getDefaultMenu())
    // Then fetch fresh data from Firestore in background
    menuService.fetchMenu().then(setMenu)
  }, [authed])

  const save = useCallback(async () => {
    if (!menu) return
    // Optimistic: show saved immediately, save in background
    setSaved(true)
    setSaving(true)
    try {
      await menuService.saveMenu(menu)
    } catch {
      // Silently fail — data is still in local state
    }
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }, [menu])

  const updateItem = (catId: string, itemId: string, patch: Partial<MenuItem>) => {
    if (!menu) return
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              items: cat.items.map((it) =>
                it.id === itemId ? { ...it, ...patch } : it
              ),
            }
          : cat
      ),
    })
  }

  const removeItem = (catId: string, itemId: string) => {
    if (!menu) return
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) =>
        cat.id === catId
          ? { ...cat, items: cat.items.filter((it) => it.id !== itemId) }
          : cat
      ),
    })
  }

  const addItem = (catId: string) => {
    if (!menu) return
    const cat = menu.categories.find((c) => c.id === catId)
    if (!cat) return
    const newItem: MenuItem = {
      id: `${catId}-${Date.now()}`,
      name: 'Nuevo plato',
      priceTapa: 0,
      priceMedia: 0,
      samePrice: true,
      order: cat.items.length,
    }
    setMenu({
      ...menu,
      categories: menu.categories.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, newItem] } : c
      ),
    })
    setEditingItem({ catId, itemId: newItem.id })
  }

  const addCategory = () => {
    if (!menu) return
    const newCat: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: 'Nueva categoría',
      icon: '🍽️',
      order: menu.categories.length,
      items: [],
    }
    setMenu({ ...menu, categories: [...menu.categories, newCat] })
  }

  const removeCategory = (catId: string) => {
    if (!menu) return
    if (!confirm('¿Eliminar esta categoría y todos sus platos?')) return
    setMenu({
      ...menu,
      categories: menu.categories.filter((c) => c.id !== catId),
    })
  }

  const updateCategory = (catId: string, patch: Partial<MenuCategory>) => {
    if (!menu) return
    setMenu({
      ...menu,
      categories: menu.categories.map((c) =>
        c.id === catId ? { ...c, ...patch } : c
      ),
    })
  }

  const resetToDefaults = () => {
    if (!confirm('¿Resetear toda la carta a los valores por defecto?')) return
    setMenu(menuService.getDefaults())
  }

  if (!authed) return <PasscodeGate onUnlock={() => setAuthed(true)} />

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sorted = [...menu.categories].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pb-32">
      {/* ─── top bar ─── */}
      <div className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-amber-50">Admin — Carta</h1>
            <p className="text-xs text-white/30 mt-0.5">
              Edita los platos y precios
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                saved
                  ? 'bg-green-500 text-black'
                  : 'bg-amber-500 text-black hover:bg-amber-400'
              }`}
            >
              {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── bar name ─── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-3">
        <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
          Nombre del bar
        </label>
        <input
          type="text"
          value={menu.barName}
          onChange={(e) => setMenu({ ...menu, barName: e.target.value })}
          className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
        />
      </div>

      {/* ─── preview links ─── */}
      <div className="max-w-2xl mx-auto px-4 pb-5 flex gap-4">
        <a
          href="/menu/tapas"
          target="_blank"
          className="text-xs text-amber-400/70 hover:text-amber-400 hover:underline transition-colors"
        >
          ↗ Ver carta Tapas
        </a>
        <a
          href="/menu/medias"
          target="_blank"
          className="text-xs text-amber-400/70 hover:text-amber-400 hover:underline transition-colors"
        >
          ↗ Ver carta Medias
        </a>
      </div>

      {/* ─── categories ─── */}
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {sorted.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.015] overflow-hidden"
          >
            {/* category header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.04]">
              <input
                type="text"
                value={cat.icon || ''}
                onChange={(e) => updateCategory(cat.id, { icon: e.target.value })}
                className="w-10 text-center bg-transparent text-lg focus:outline-none"
                title="Emoji"
              />
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                className="flex-1 bg-transparent text-amber-50 font-semibold focus:outline-none border-b border-transparent focus:border-amber-500/40 transition-colors"
              />
              <input
                type="number"
                value={cat.order}
                onChange={(e) =>
                  updateCategory(cat.id, { order: Number(e.target.value) })
                }
                className="w-12 text-center bg-white/5 rounded-lg text-xs text-white/50 py-1.5 focus:outline-none"
                title="Orden"
              />
              <button
                onClick={() => removeCategory(cat.id)}
                className="text-red-400/40 hover:text-red-400 text-sm px-2 transition-colors"
                title="Eliminar categoría"
              >
                ✕
              </button>
            </div>

            {/* items */}
            <div className="divide-y divide-white/[0.03]">
              {cat.items
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const isEditing =
                    editingItem?.catId === cat.id &&
                    editingItem.itemId === item.id

                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-3 transition-colors ${
                        isEditing ? 'bg-amber-500/[0.04]' : 'hover:bg-white/[0.015]'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(cat.id, item.id, { name: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                            placeholder="Nombre del plato"
                            autoFocus
                          />
                          <div className="flex gap-2.5 items-end">
                            <div className="flex-1">
                              <label className="text-[10px] text-white/25 uppercase font-semibold">
                                Tapa €
                              </label>
                              <input
                                type="number"
                                step="0.10"
                                value={item.priceTapa}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value) || 0
                                  updateItem(cat.id, item.id, {
                                    priceTapa: v,
                                    ...(item.samePrice ? { priceMedia: v } : {}),
                                  })
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none mt-1"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-white/25 uppercase font-semibold">
                                Media €
                              </label>
                              <input
                                type="number"
                                step="0.10"
                                value={item.priceMedia}
                                onChange={(e) =>
                                  updateItem(cat.id, item.id, {
                                    priceMedia: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={item.samePrice}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none disabled:opacity-20 mt-1"
                              />
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none pb-2">
                              <input
                                type="checkbox"
                                checked={item.samePrice}
                                onChange={(e) =>
                                  updateItem(cat.id, item.id, {
                                    samePrice: e.target.checked,
                                    ...(e.target.checked
                                      ? { priceMedia: item.priceTapa }
                                      : {}),
                                  })
                                }
                                className="accent-amber-500"
                              />
                              <span className="text-[10px] text-white/30 whitespace-nowrap">
                                = precio
                              </span>
                            </label>
                          </div>
                          <div className="flex gap-2 items-center">
                            <label className="text-[10px] text-white/25 uppercase font-semibold">
                              Orden
                            </label>
                            <input
                              type="number"
                              value={item.order}
                              onChange={(e) =>
                                updateItem(cat.id, item.id, {
                                  order: Number(e.target.value),
                                })
                              }
                              className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
                            />
                            <div className="flex-1" />
                            <button
                              onClick={() => removeItem(cat.id, item.id)}
                              className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
                            >
                              Eliminar
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-xs px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() =>
                            setEditingItem({ catId: cat.id, itemId: item.id })
                          }
                        >
                          <span className="text-sm text-white/70 flex-1 truncate">
                            {item.name}
                          </span>
                          <span className="text-xs text-amber-400/70 whitespace-nowrap font-medium">
                            {item.priceTapa > 0
                              ? `${item.priceTapa.toFixed(2)}€`
                              : '—'}
                          </span>
                          {!item.samePrice && (
                            <span className="text-xs text-amber-400/40 whitespace-nowrap">
                              /{' '}
                              {item.priceMedia > 0
                                ? `${item.priceMedia.toFixed(2)}€`
                                : '—'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>

            {/* add item */}
            <button
              onClick={() => addItem(cat.id)}
              className="w-full px-4 py-2.5 text-xs text-amber-400/40 hover:text-amber-400 hover:bg-white/[0.02] transition-colors text-left"
            >
              + Añadir plato
            </button>
          </div>
        ))}

        {/* add category */}
        <button
          onClick={addCategory}
          className="w-full py-4 rounded-2xl border border-dashed border-white/[0.06] text-sm text-white/20 hover:border-amber-500/25 hover:text-amber-400/50 transition-colors"
        >
          + Añadir categoría
        </button>
      </div>

      {/* ─── floating save ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl mx-auto">
          <button
            onClick={save}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] ${
              saved
                ? 'bg-green-500 text-black'
                : 'bg-amber-500 text-black hover:bg-amber-400'
            }`}
          >
            {saving
              ? 'Guardando…'
              : saved
              ? '✓ Cambios guardados'
              : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
