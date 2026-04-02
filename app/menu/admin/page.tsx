'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { MenuData, MenuCategory, MenuItem } from '@/types/menu'
import { menuService } from '@/lib/menuService'

const PASSCODE = '1111'

/* ──────── price input with local string state ──────── */
function PriceInput({
  value,
  onChange,
  disabled,
  placeholder = '0.00',
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [raw, setRaw] = useState(() =>
    value === 0 ? '' : value.toString()
  )
  const prevValue = useRef(value)

  // Sync from parent when value changes externally (e.g. samePrice toggle)
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      setRaw(value === 0 ? '' : value.toString())
    }
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={(e) => {
        let v = e.target.value.replace(',', '.')
        // Allow empty, just dots, or valid decimal patterns while typing
        if (v === '' || v === '.') {
          setRaw(v)
          onChange(0)
          return
        }
        // Allow partial input like "4." or "4.5" while typing
        if (/^\d*\.?\d{0,2}$/.test(v)) {
          setRaw(v)
          const num = parseFloat(v)
          if (!isNaN(num)) {
            prevValue.current = num
            onChange(num)
          }
        }
      }}
      onBlur={() => {
        // Clean up display on blur
        const num = parseFloat(raw) || 0
        prevValue.current = num
        setRaw(num === 0 ? '' : num.toString())
      }}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none disabled:opacity-20 mt-1"
    />
  )
}

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
    <div className="min-h-screen flex items-center justify-center bg-[#071a35] px-6">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold text-sky-100 text-center mb-1">
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
            className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border text-gray-900 placeholder:text-gray-400 text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-sky-200/40 transition-all ${
              error
                ? 'border-red-500 animate-[shake_0.3s_ease-in-out]'
                : 'border-white/10'
            }`}
            autoFocus
          />
          <button
            onClick={check}
            className="w-full py-3.5 rounded-xl bg-sky-300 text-black font-bold tracking-wide hover:bg-sky-200 transition-colors"
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
  const [importantDay, setImportantDay] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
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
    const filterBebidas = (m: MenuData): MenuData => ({
      ...m,
      importantDay: m.importantDay ?? false,
      categories: m.categories.filter((c) => c.id !== 'bebidas'),
    })
    // Show defaults instantly so admin panel is usable right away
    const defaultMenu = filterBebidas(menuService.getDefaultMenu())
    setMenu(defaultMenu)
    setImportantDay(defaultMenu.importantDay ?? false)
    // Then fetch fresh data from Firestore in background
    menuService.fetchMenu().then((fresh) => {
      const filtered = filterBebidas(fresh)
      setMenu(filtered)
      setImportantDay(filtered.importantDay ?? false)
    })
  }, [authed])

  const save = useCallback(async () => {
    if (!menu) return
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      // Clean before saving: remove bebidas, empty-name items, y mantener importantDay
      const cleanMenu = {
        ...menu,
        importantDay: menu.importantDay ?? false,
        categories: menu.categories
          .filter((c) => c.id !== 'bebidas')
          .map((c) => ({
            ...c,
            items: c.items.filter((it) => it.name && it.name.trim() !== ''),
          })),
      }
      await menuService.saveMenu(cleanMenu)
      // Update local state with cleaned data
      setMenu(cleanMenu)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      const msg = err?.code === 'permission-denied'
        ? 'Sin permisos — actualiza las reglas de Firestore'
        : err?.message || 'Error desconocido'
      console.error('Save error:', err?.code, err?.message, err)
      setSaveError(msg)
      setTimeout(() => setSaveError(''), 6000)
    } finally {
      setSaving(false)
    }
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
    const maxOrder = cat.items.length > 0
      ? Math.max(...cat.items.map((it) => it.order))
      : -1
    const newItem: MenuItem = {
      id: `${catId}-${Date.now()}`,
      name: '',
      priceTapa: 0,
      priceMedia: 0,
      samePrice: true,
      order: maxOrder + 1,
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
      <div className="min-h-screen flex items-center justify-center bg-[#071a35]">
        <div className="w-8 h-8 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sorted = [...menu.categories]
    .filter((c) => c.id !== 'bebidas')
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pb-32">
      {/* ─── IMPORTANTE DAY SECTION ─── */}
      <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-b border-amber-400/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-200/80 uppercase tracking-wider font-semibold">Estado Global</p>
              <h2 className="text-xl font-bold text-amber-100 mt-1">DÍA IMPORTANTE</h2>
            </div>
            <button
              onClick={() => {
                const next = !importantDay
                setImportantDay(next)
                setMenu((prev) => prev ? { ...prev, importantDay: next } : prev)
              }}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all transform ${
                importantDay
                  ? 'bg-amber-400 text-[#031f4a] hover:bg-amber-300 hover:scale-105'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105'
              }`}
            >
              {importantDay ? '🔴 ACTIVADO' : '⚪ Desactivado'}
            </button>
          </div>
          {importantDay && (
            <p className="text-xs text-amber-200 mt-3 italic">
              📌 Cuando está activado: La carta de Tapas está bloqueada y solo se muestra la carta de Media Ración.
            </p>
          )}
        </div>
      </div>

      {/* ─── top bar ─── */}
      <div className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-sky-100">Admin — Carta</h1>
            <p className="text-xs text-white/30 mt-0.5">
              Edita los platos y precios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 rounded-lg text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                saveError
                  ? 'bg-red-500 text-white'
                  : saved
                  ? 'bg-green-500 text-black'
                  : 'bg-sky-300 text-black hover:bg-sky-200'
              }`}
            >
              {saving ? 'Guardando…' : saveError ? '✕ Error' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── categories list ─── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-3 space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            Nombre del bar
          </label>
          <input
            type="text"
            value={menu.barName}
            onChange={(e) => setMenu({ ...menu, barName: e.target.value })}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200/40 text-sm"
          />
        </div>
      </div>

      {/* ─── preview links ─── */}
      <div className="max-w-2xl mx-auto px-4 pb-5 flex gap-4">
        <a
          href="/menu/tapas"
          target="_blank"
          className="text-xs text-sky-200/70 hover:text-sky-100 hover:underline transition-colors"
        >
          ↗ Ver carta Tapas
        </a>
        <a
          href="/menu/medias"
          target="_blank"
          className="text-xs text-sky-200/70 hover:text-sky-100 hover:underline transition-colors"
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
                className="flex-1 bg-transparent text-sky-100 font-semibold focus:outline-none border-b border-transparent focus:border-sky-500/40 transition-colors"
              />
              <input
                type="number"
                value={cat.order}
                onChange={(e) =>
                  updateCategory(cat.id, { order: Number(e.target.value) })
                }
                className="w-12 text-center bg-gray-50 rounded-lg text-xs text-gray-600 py-1.5 focus:outline-none"
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
                        isEditing ? 'bg-sky-300/[0.05]' : 'hover:bg-white/[0.015]'
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
                            className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-200/40"
                            placeholder="Nombre del plato"
                            autoFocus
                            onFocus={(e) => {
                              if (e.target.value === '') e.target.select()
                            }}
                          />
                          <div className="flex gap-2.5 items-end">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">
                                Tapa €
                              </label>
                              <PriceInput
                                value={item.priceTapa}
                                onChange={(v) =>
                                  updateItem(cat.id, item.id, {
                                    priceTapa: v,
                                    ...(item.samePrice ? { priceMedia: v } : {}),
                                  })
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">
                                Media €
                              </label>
                              <PriceInput
                                value={item.priceMedia}
                                onChange={(v) =>
                                  updateItem(cat.id, item.id, { priceMedia: v })
                                }
                                disabled={item.samePrice}
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
                                className="accent-sky-500"
                              />
                              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                = precio
                              </span>
                            </label>
                          </div>
                          <div className="flex gap-2 items-center">
                            <label className="text-[10px] text-gray-500 uppercase font-semibold">
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
                              className="w-16 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-sm text-gray-900 focus:outline-none"
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
                              className="text-xs px-4 py-1.5 rounded-lg bg-sky-300 text-black font-bold"
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
                          <span className="text-sm text-gray-700 flex-1 truncate">
                            {item.name}
                          </span>
                          <span className="text-xs text-sky-200/70 whitespace-nowrap font-medium">
                            {item.priceTapa > 0
                              ? `${item.priceTapa.toFixed(2)}€`
                              : '—'}
                          </span>
                          {!item.samePrice && (
                            <span className="text-xs text-sky-200/40 whitespace-nowrap">
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
              className="w-full px-4 py-2.5 text-xs text-sky-200/40 hover:text-sky-100 hover:bg-white/[0.02] transition-colors text-left"
            >
              + Añadir plato
            </button>
          </div>
        ))}

        {/* add category */}
        <button
          onClick={addCategory}
          className="w-full py-4 rounded-2xl border border-dashed border-gray-300/[0.06] text-sm text-gray-600 hover:border-sky-300/25 hover:text-sky-700/50 transition-colors"
        >
          + Añadir categoría
        </button>
      </div>

      {/* ─── floating save ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#071a35] via-[#071a35]/95 to-transparent p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl mx-auto">
          <button
            onClick={save}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] ${
              saveError
                ? 'bg-red-500 text-white'
                : saved
                ? 'bg-green-500 text-black'
                : 'bg-sky-300 text-black hover:bg-sky-200'
            }`}
          >
            {saving
              ? 'Guardando…'
              : saveError
              ? `✕ ${saveError}`
              : saved
              ? '✓ Cambios guardados'
              : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
