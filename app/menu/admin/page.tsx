'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import type {
  MenuData,
  MenuCategory,
  MenuItem,
  WineCategory,
  WineItem,
  Translations,
} from '@/types/menu'
import { menuService } from '@/lib/menuService'
import { I18N_LANGS, tAllergen } from '@/lib/translations'
import { ALLERGEN_KEYS, ALLERGEN_SRC } from '@/lib/allergens'

const PASSCODE = '2010'

type Tab = 'comida' | 'vinos' | 'inicial'

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
  const [raw, setRaw] = useState(() => (value === 0 ? '' : value.toString()))
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
        if (v === '' || v === '.') {
          setRaw(v)
          onChange(0)
          return
        }
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

/* ──────── translation inputs (EN/DE/PT/FR) ──────── */
function TranslationFields({
  value,
  onChange,
  placeholder,
}: {
  value?: Translations
  onChange: (v: Translations) => void
  placeholder?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-1.5">
      {I18N_LANGS.map((l) => (
        <div key={l.code}>
          <label className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
            <span>{l.flag}</span>
            {l.label}
          </label>
          <input
            type="text"
            value={value?.[l.code] ?? ''}
            onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
            placeholder={placeholder}
            className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-200/40"
          />
        </div>
      ))}
    </div>
  )
}

/* ──────── allergen toggle picker ──────── */
function AllergenPicker({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {ALLERGEN_KEYS.map((key) => {
        const active = selected.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors ${
              active
                ? 'bg-sky-300/20 border-sky-400/50 text-sky-100'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALLERGEN_SRC[key]} alt="" width={16} height={16} className="rounded-full" />
            {tAllergen('es', key)}
          </button>
        )
      })}
    </div>
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
        <h1 className="text-2xl font-bold text-sky-100 text-center mb-1">Panel Admin</h1>
        <p className="text-center text-white/30 text-sm mb-8">Introduce el código de acceso</p>
        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border text-gray-900 placeholder:text-gray-400 text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-sky-200/40 transition-all ${
              error ? 'border-red-500 animate-[shake_0.3s_ease-in-out]' : 'border-white/10'
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
  const [tab, setTab] = useState<Tab>('comida')
  const [importantDay, setImportantDay] = useState(false)
  const [showWines, setShowWines] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editingItem, setEditingItem] = useState<{ catId: string; itemId: string } | null>(null)
  const [editingWine, setEditingWine] = useState<{ catId: string; itemId: string } | null>(null)
  const [i18nCat, setI18nCat] = useState<string | null>(null)
  const [i18nWineCat, setI18nWineCat] = useState<string | null>(null)
  const [initialSavedAt, setInitialSavedAt] = useState<string | null>(null)
  const [initialMsg, setInitialMsg] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('menu-admin') === '1')
      setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    const filterBebidas = (m: MenuData): MenuData => ({
      ...m,
      importantDay: m.importantDay ?? false,
      showWines: m.showWines ?? true,
      categories: m.categories.filter((c) => c.id !== 'bebidas'),
    })
    // Show defaults instantly so admin panel is usable right away
    const defaultMenu = filterBebidas(menuService.getDefaultMenu())
    setMenu(defaultMenu)
    setImportantDay(defaultMenu.importantDay ?? false)
    setShowWines(defaultMenu.showWines ?? true)
    // Then fetch fresh data from Firestore in background
    menuService.fetchMenu().then((fresh) => {
      const filtered = filterBebidas(fresh)
      setMenu(filtered)
      setImportantDay(filtered.importantDay ?? false)
      setShowWines(filtered.showWines ?? true)
    })
    // Load saved initial-menu metadata
    menuService.fetchInitialMenu().then((init) => {
      setInitialSavedAt(init?.updatedAt ?? null)
    })
  }, [authed])

  const save = useCallback(async () => {
    if (!menu) return
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const cleanMenu: MenuData = {
        ...menu,
        importantDay: menu.importantDay ?? false,
        showWines: menu.showWines ?? true,
        categories: menu.categories
          .filter((c) => c.id !== 'bebidas')
          .map((c) => ({
            ...c,
            items: c.items.filter((it) => it.name && it.name.trim() !== ''),
          })),
        wineCategories: (menu.wineCategories ?? []).map((c) => ({
          ...c,
          items: c.items.filter((it) => it.name && it.name.trim() !== ''),
        })),
      }
      await menuService.saveMenu(cleanMenu)
      setMenu(cleanMenu)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      const msg =
        err?.code === 'permission-denied'
          ? 'Sin permisos — actualiza las reglas de Firestore'
          : err?.message || 'Error desconocido'
      console.error('Save error:', err?.code, err?.message, err)
      setSaveError(msg)
      setTimeout(() => setSaveError(''), 6000)
    } finally {
      setSaving(false)
    }
  }, [menu])

  /* ─── food item handlers ─── */
  const updateItem = (catId: string, itemId: string, patch: Partial<MenuItem>) => {
    setMenu((m) =>
      !m
        ? m
        : {
            ...m,
            categories: m.categories.map((cat) =>
              cat.id === catId
                ? { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
                : cat
            ),
          }
    )
  }

  const toggleAllergen = (catId: string, item: MenuItem, key: string) => {
    const current = item.allergens || []
    const next = current.includes(key) ? current.filter((a) => a !== key) : [...current, key]
    updateItem(catId, item.id, { allergens: next })
  }

  const removeItem = (catId: string, itemId: string) => {
    setMenu((m) =>
      !m
        ? m
        : {
            ...m,
            categories: m.categories.map((cat) =>
              cat.id === catId ? { ...cat, items: cat.items.filter((it) => it.id !== itemId) } : cat
            ),
          }
    )
  }

  const addItem = (catId: string) => {
    if (!menu) return
    const cat = menu.categories.find((c) => c.id === catId)
    if (!cat) return
    const maxOrder = cat.items.length > 0 ? Math.max(...cat.items.map((it) => it.order)) : -1
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
    if (!confirm('¿Eliminar esta categoría y todos sus platos?')) return
    setMenu((m) => (!m ? m : { ...m, categories: m.categories.filter((c) => c.id !== catId) }))
  }

  const updateCategory = (catId: string, patch: Partial<MenuCategory>) => {
    setMenu((m) =>
      !m ? m : { ...m, categories: m.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) }
    )
  }

  /* ─── wine handlers ─── */
  const updateWine = (catId: string, itemId: string, patch: Partial<WineItem>) => {
    setMenu((m) =>
      !m
        ? m
        : {
            ...m,
            wineCategories: (m.wineCategories ?? []).map((cat) =>
              cat.id === catId
                ? { ...cat, items: cat.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
                : cat
            ),
          }
    )
  }

  const removeWine = (catId: string, itemId: string) => {
    setMenu((m) =>
      !m
        ? m
        : {
            ...m,
            wineCategories: (m.wineCategories ?? []).map((cat) =>
              cat.id === catId ? { ...cat, items: cat.items.filter((it) => it.id !== itemId) } : cat
            ),
          }
    )
  }

  const addWine = (catId: string) => {
    if (!menu) return
    const cat = (menu.wineCategories ?? []).find((c) => c.id === catId)
    if (!cat) return
    const maxOrder = cat.items.length > 0 ? Math.max(...cat.items.map((it) => it.order)) : -1
    const newWine: WineItem = {
      id: `wine-${Date.now()}`,
      name: '',
      priceCopa: 0,
      priceBottle: 0,
      order: maxOrder + 1,
    }
    setMenu({
      ...menu,
      wineCategories: (menu.wineCategories ?? []).map((c) =>
        c.id === catId ? { ...c, items: [...c.items, newWine] } : c
      ),
    })
    setEditingWine({ catId, itemId: newWine.id })
  }

  const addWineCategory = () => {
    if (!menu) return
    const cats = menu.wineCategories ?? []
    const newCat: WineCategory = {
      id: `winecat-${Date.now()}`,
      name: 'Nueva sección de vinos',
      order: cats.length,
      items: [],
    }
    setMenu({ ...menu, wineCategories: [...cats, newCat] })
  }

  const removeWineCategory = (catId: string) => {
    if (!confirm('¿Eliminar esta sección de vinos y todos sus vinos?')) return
    setMenu((m) =>
      !m ? m : { ...m, wineCategories: (m.wineCategories ?? []).filter((c) => c.id !== catId) }
    )
  }

  const updateWineCategory = (catId: string, patch: Partial<WineCategory>) => {
    setMenu((m) =>
      !m
        ? m
        : {
            ...m,
            wineCategories: (m.wineCategories ?? []).map((c) => (c.id === catId ? { ...c, ...patch } : c)),
          }
    )
  }

  /* ─── initial menu / reset ─── */
  const saveAsInitial = async () => {
    if (!menu) return
    setInitialMsg('Guardando…')
    try {
      await menuService.saveInitialMenu(menu)
      const now = new Date().toISOString()
      setInitialSavedAt(now)
      setInitialMsg('✓ Carta inicial guardada')
      setTimeout(() => setInitialMsg(''), 3000)
    } catch (err: any) {
      setInitialMsg(err?.code === 'permission-denied' ? 'Sin permisos de Firestore' : 'Error al guardar')
      setTimeout(() => setInitialMsg(''), 5000)
    }
  }

  const resetToInitial = async () => {
    if (!confirm('¿Resetear la carta a la carta inicial guardada? (deberás pulsar Guardar para publicarla)')) return
    setInitialMsg('Cargando carta inicial…')
    const target = await menuService.fetchResetTarget()
    setMenu({ ...target, categories: target.categories.filter((c) => c.id !== 'bebidas') })
    setImportantDay(target.importantDay ?? false)
    setShowWines(target.showWines ?? true)
    setEditingItem(null)
    setEditingWine(null)
    setInitialMsg('Carta inicial cargada — pulsa Guardar para publicarla')
    setTimeout(() => setInitialMsg(''), 5000)
  }

  if (!authed) return <PasscodeGate onUnlock={() => setAuthed(true)} />

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#071a35]">
        <div className="w-8 h-8 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sortedFood = [...menu.categories]
    .filter((c) => c.id !== 'bebidas')
    .sort((a, b) => a.order - b.order)
  const sortedWineCats = [...(menu.wineCategories ?? [])].sort((a, b) => a.order - b.order)

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
                setMenu((prev) => (prev ? { ...prev, importantDay: next } : prev))
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

      {/* ─── SHOW WINES TOGGLE ─── */}
      <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/10 border-b border-purple-400/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-200/80 uppercase tracking-wider font-semibold">Carta de Vinos</p>
              <h2 className="text-xl font-bold text-purple-100 mt-1">🍷 VINOS</h2>
            </div>
            <button
              onClick={() => {
                const next = !showWines
                setShowWines(next)
                setMenu((prev) => (prev ? { ...prev, showWines: next } : prev))
              }}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all transform ${
                showWines
                  ? 'bg-purple-400 text-[#031f4a] hover:bg-purple-300 hover:scale-105'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-105'
              }`}
            >
              {showWines ? '🟢 VISIBLE' : '⚪ Oculta'}
            </button>
          </div>
          {!showWines && (
            <p className="text-xs text-purple-200 mt-3 italic">
              📌 La pestaña de Vinos está oculta en la carta pública.
            </p>
          )}
        </div>
      </div>

      {/* ─── top bar ─── */}
      <div className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-sky-100">Admin — Carta</h1>
            <p className="text-xs text-white/30 mt-0.5">Edita platos, vinos y precios</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToInitial}
              className="px-3 py-1.5 rounded-lg text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              title="Restaura la carta a la carta inicial guardada"
            >
              Resetear
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
        {/* tabs */}
        <div className="max-w-2xl mx-auto mt-3 flex gap-1.5">
          {([
            ['comida', '🍽️ Comida'],
            ['vinos', '🍷 Vinos'],
            ['inicial', '♻️ Carta inicial'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                tab === key ? 'bg-sky-300 text-black' : 'bg-white/5 text-white/50 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── general settings ─── */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-3 space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Nombre del bar</label>
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
        <a href="/menu/tapas" target="_blank" className="text-xs text-sky-200/70 hover:text-sky-100 hover:underline transition-colors">↗ Ver Tapas</a>
        <a href="/menu/medias" target="_blank" className="text-xs text-sky-200/70 hover:text-sky-100 hover:underline transition-colors">↗ Ver Medias</a>
        <a href="/menu/alergenos" target="_blank" className="text-xs text-sky-200/70 hover:text-sky-100 hover:underline transition-colors">↗ Ver Alérgenos</a>
        <a href="/menu/vinos" target="_blank" className="text-xs text-purple-200/70 hover:text-purple-100 hover:underline transition-colors">↗ Ver Vinos</a>
      </div>

      {/* ═══════════════ COMIDA ═══════════════ */}
      {tab === 'comida' && (
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          {sortedFood.map((cat) => (
            <div key={cat.id} className={`rounded-2xl border border-white/[0.04] bg-white/[0.015] overflow-hidden ${cat.hidden ? 'opacity-50' : ''}`}>
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
                  onChange={(e) => updateCategory(cat.id, { order: Number(e.target.value) })}
                  className="w-12 text-center bg-gray-50 rounded-lg text-xs text-gray-600 py-1.5 focus:outline-none"
                  title="Orden"
                />
                <button
                  onClick={() => setI18nCat(i18nCat === cat.id ? null : cat.id)}
                  className={`text-sm px-1.5 transition-colors ${i18nCat === cat.id ? 'text-sky-300' : 'text-white/30 hover:text-white/70'}`}
                  title="Traducciones del nombre"
                >
                  🌐
                </button>
                <button
                  onClick={() => updateCategory(cat.id, { hidden: !cat.hidden })}
                  className={`text-sm px-1.5 transition-colors ${cat.hidden ? 'text-amber-400' : 'text-white/30 hover:text-white/70'}`}
                  title={cat.hidden ? 'Sección oculta — clic para mostrar' : 'Ocultar sección'}
                >
                  {cat.hidden ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={() => removeCategory(cat.id)}
                  className="text-red-400/40 hover:text-red-400 text-sm px-2 transition-colors"
                  title="Eliminar categoría"
                >
                  ✕
                </button>
              </div>

              {/* category translations */}
              {i18nCat === cat.id && (
                <div className="px-4 py-3 bg-sky-300/[0.04] border-b border-white/[0.04]">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Traducciones de la categoría</p>
                  <TranslationFields
                    value={cat.nameI18n}
                    onChange={(v) => updateCategory(cat.id, { nameI18n: v })}
                    placeholder={cat.name}
                  />
                </div>
              )}

              {/* items */}
              <div className="divide-y divide-white/[0.03]">
                {[...cat.items]
                  .sort((a, b) => a.order - b.order)
                  .map((item) => {
                    const isEditing = editingItem?.catId === cat.id && editingItem.itemId === item.id
                    return (
                      <div
                        key={item.id}
                        className={`px-4 py-3 transition-colors ${isEditing ? 'bg-sky-300/[0.05]' : 'hover:bg-white/[0.015]'}`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(cat.id, item.id, { name: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-200/40"
                              placeholder="Nombre del plato (español)"
                              autoFocus
                              onFocus={(e) => {
                                if (e.target.value === '') e.target.select()
                              }}
                            />

                            {/* translations */}
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-semibold">Traducciones</p>
                              <TranslationFields
                                value={item.nameI18n}
                                onChange={(v) => updateItem(cat.id, item.id, { nameI18n: v })}
                                placeholder={item.name}
                              />
                            </div>

                            {/* prices */}
                            <div className="flex gap-2.5 items-end">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase font-semibold">Tapa €</label>
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
                                <label className="text-[10px] text-gray-500 uppercase font-semibold">Media €</label>
                                <PriceInput
                                  value={item.priceMedia}
                                  onChange={(v) => updateItem(cat.id, item.id, { priceMedia: v })}
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
                                      ...(e.target.checked ? { priceMedia: item.priceTapa } : {}),
                                    })
                                  }
                                  className="accent-sky-500"
                                />
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">= precio</span>
                              </label>
                            </div>

                            {/* allergens */}
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-semibold">Alérgenos</p>
                              <AllergenPicker
                                selected={item.allergens || []}
                                onToggle={(key) => toggleAllergen(cat.id, item, key)}
                              />
                            </div>

                            <div className="flex gap-2 items-center">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">Orden</label>
                              <input
                                type="number"
                                value={item.order}
                                onChange={(e) => updateItem(cat.id, item.id, { order: Number(e.target.value) })}
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
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center gap-3 flex-1 min-w-0 cursor-pointer ${item.hidden ? 'opacity-40' : ''}`}
                              onClick={() => setEditingItem({ catId: cat.id, itemId: item.id })}
                            >
                              <span className="text-sm text-gray-700 flex-1 truncate">{item.name}</span>
                              {item.allergens && item.allergens.length > 0 && (
                                <span className="flex items-center gap-0.5 flex-shrink-0">
                                  {item.allergens.slice(0, 4).map((a) =>
                                    ALLERGEN_SRC[a] ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img key={a} src={ALLERGEN_SRC[a]} alt="" width={14} height={14} className="rounded-full opacity-70" />
                                    ) : null
                                  )}
                                </span>
                              )}
                              <span className="text-xs text-sky-200/70 whitespace-nowrap font-medium">
                                {item.priceTapa > 0 ? `${item.priceTapa.toFixed(2)}€` : '—'}
                              </span>
                              {!item.samePrice && (
                                <span className="text-xs text-sky-200/40 whitespace-nowrap">
                                  / {item.priceMedia > 0 ? `${item.priceMedia.toFixed(2)}€` : '—'}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateItem(cat.id, item.id, { hidden: !item.hidden })
                              }}
                              className={`text-sm px-1 flex-shrink-0 transition-colors ${item.hidden ? 'text-amber-400' : 'text-gray-300 hover:text-gray-500'}`}
                              title={item.hidden ? 'Plato oculto — clic para mostrar' : 'Ocultar plato'}
                            >
                              {item.hidden ? '🙈' : '👁️'}
                            </button>
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
      )}

      {/* ═══════════════ VINOS ═══════════════ */}
      {tab === 'vinos' && (
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          {sortedWineCats.map((cat) => (
            <div key={cat.id} className={`rounded-2xl border border-white/[0.04] bg-white/[0.015] overflow-hidden ${cat.hidden ? 'opacity-50' : ''}`}>
              {/* wine category header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.04]">
                <span className="text-lg">🍷</span>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateWineCategory(cat.id, { name: e.target.value })}
                  className="flex-1 bg-transparent text-purple-100 font-semibold focus:outline-none border-b border-transparent focus:border-purple-500/40 transition-colors"
                />
                <input
                  type="number"
                  value={cat.order}
                  onChange={(e) => updateWineCategory(cat.id, { order: Number(e.target.value) })}
                  className="w-12 text-center bg-gray-50 rounded-lg text-xs text-gray-600 py-1.5 focus:outline-none"
                  title="Orden"
                />
                <button
                  onClick={() => setI18nWineCat(i18nWineCat === cat.id ? null : cat.id)}
                  className={`text-sm px-1.5 transition-colors ${i18nWineCat === cat.id ? 'text-purple-300' : 'text-white/30 hover:text-white/70'}`}
                  title="Traducciones del nombre"
                >
                  🌐
                </button>
                <button
                  onClick={() => updateWineCategory(cat.id, { hidden: !cat.hidden })}
                  className={`text-sm px-1.5 transition-colors ${cat.hidden ? 'text-amber-400' : 'text-white/30 hover:text-white/70'}`}
                  title={cat.hidden ? 'Sección oculta — clic para mostrar' : 'Ocultar sección'}
                >
                  {cat.hidden ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={() => removeWineCategory(cat.id)}
                  className="text-red-400/40 hover:text-red-400 text-sm px-2 transition-colors"
                  title="Eliminar sección"
                >
                  ✕
                </button>
              </div>

              {/* wine category translations */}
              {i18nWineCat === cat.id && (
                <div className="px-4 py-3 bg-purple-300/[0.04] border-b border-white/[0.04]">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Traducciones de la sección</p>
                  <TranslationFields
                    value={cat.nameI18n}
                    onChange={(v) => updateWineCategory(cat.id, { nameI18n: v })}
                    placeholder={cat.name}
                  />
                </div>
              )}

              {/* wines */}
              <div className="divide-y divide-white/[0.03]">
                {[...cat.items]
                  .sort((a, b) => a.order - b.order)
                  .map((wine) => {
                    const isEditing = editingWine?.catId === cat.id && editingWine.itemId === wine.id
                    return (
                      <div
                        key={wine.id}
                        className={`px-4 py-3 transition-colors ${isEditing ? 'bg-purple-300/[0.05]' : 'hover:bg-white/[0.015]'}`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={wine.name}
                              onChange={(e) => updateWine(cat.id, wine.id, { name: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-200/40"
                              placeholder="Nombre del vino"
                              autoFocus
                              onFocus={(e) => {
                                if (e.target.value === '') e.target.select()
                              }}
                            />

                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-semibold">Traducciones (opcional)</p>
                              <TranslationFields
                                value={wine.nameI18n}
                                onChange={(v) => updateWine(cat.id, wine.id, { nameI18n: v })}
                                placeholder={wine.name}
                              />
                            </div>

                            <div className="flex gap-2.5 items-end">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase font-semibold">Copa €</label>
                                <PriceInput
                                  value={wine.priceCopa}
                                  onChange={(v) => updateWine(cat.id, wine.id, { priceCopa: v })}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase font-semibold">Botella €</label>
                                <PriceInput
                                  value={wine.priceBottle}
                                  onChange={(v) => updateWine(cat.id, wine.id, { priceBottle: v })}
                                />
                              </div>
                              <div className="w-20">
                                <label className="text-[10px] text-gray-500 uppercase font-semibold">Año</label>
                                <input
                                  type="text"
                                  value={wine.year ?? ''}
                                  onChange={(e) => updateWine(cat.id, wine.id, { year: e.target.value })}
                                  placeholder="—"
                                  className="w-full px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none mt-1"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 items-center">
                              <label className="text-[10px] text-gray-500 uppercase font-semibold">Orden</label>
                              <input
                                type="number"
                                value={wine.order}
                                onChange={(e) => updateWine(cat.id, wine.id, { order: Number(e.target.value) })}
                                className="w-16 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-sm text-gray-900 focus:outline-none"
                              />
                              <div className="flex-1" />
                              <button
                                onClick={() => removeWine(cat.id, wine.id)}
                                className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
                              >
                                Eliminar
                              </button>
                              <button
                                onClick={() => setEditingWine(null)}
                                className="text-xs px-4 py-1.5 rounded-lg bg-purple-300 text-black font-bold"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center gap-3 flex-1 min-w-0 cursor-pointer ${wine.hidden ? 'opacity-40' : ''}`}
                              onClick={() => setEditingWine({ catId: cat.id, itemId: wine.id })}
                            >
                              <span className="text-sm text-gray-700 flex-1 truncate">
                                {wine.name}
                                {wine.year && <span className="text-gray-400 text-xs ml-1.5">({wine.year})</span>}
                              </span>
                              <span className="text-xs text-purple-200/70 whitespace-nowrap font-medium">
                                {wine.priceCopa > 0 ? `${wine.priceCopa.toFixed(2)}€` : '—'}
                              </span>
                              <span className="text-xs text-purple-200/40 whitespace-nowrap">
                                / {wine.priceBottle > 0 ? `${wine.priceBottle.toFixed(2)}€` : '—'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                updateWine(cat.id, wine.id, { hidden: !wine.hidden })
                              }}
                              className={`text-sm px-1 flex-shrink-0 transition-colors ${wine.hidden ? 'text-amber-400' : 'text-gray-300 hover:text-gray-500'}`}
                              title={wine.hidden ? 'Vino oculto — clic para mostrar' : 'Ocultar vino'}
                            >
                              {wine.hidden ? '🙈' : '👁️'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>

              {/* add wine */}
              <button
                onClick={() => addWine(cat.id)}
                className="w-full px-4 py-2.5 text-xs text-purple-200/40 hover:text-purple-100 hover:bg-white/[0.02] transition-colors text-left"
              >
                + Añadir vino
              </button>
            </div>
          ))}

          {/* add wine category */}
          <button
            onClick={addWineCategory}
            className="w-full py-4 rounded-2xl border border-dashed border-purple-300/[0.1] text-sm text-purple-300/60 hover:border-purple-300/30 hover:text-purple-200 transition-colors"
          >
            + Añadir sección de vinos
          </button>
        </div>
      )}

      {/* ═══════════════ CARTA INICIAL ═══════════════ */}
      {tab === 'inicial' && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] p-5">
            <h2 className="text-lg font-bold text-sky-100">♻️ Carta inicial</h2>
            <p className="text-sm text-white/50 mt-2 leading-relaxed">
              <strong className="text-white/70">Guardar</strong> deja la carta de ahora como copia de seguridad. Si te
              equivocas editando, pulsa <strong className="text-white/70">Resetear</strong> para volver a esa copia.
            </p>
            <p className="text-xs text-white/30 mt-2">
              {initialSavedAt
                ? `Última copia guardada: ${new Date(initialSavedAt).toLocaleString('es-ES')}`
                : 'Todavía no has guardado ninguna copia.'}
            </p>

            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={saveAsInitial}
                className="w-full py-3 rounded-xl bg-sky-300 text-black font-bold text-sm hover:bg-sky-200 transition-colors"
              >
                💾 Guardar
              </button>
              <button
                onClick={resetToInitial}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                ♻️ Resetear
              </button>
            </div>

            {initialMsg && <p className="text-xs text-sky-200 mt-3 text-center">{initialMsg}</p>}
          </div>
        </div>
      )}

      {/* ─── floating save ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#071a35] via-[#071a35]/95 to-transparent p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-2xl mx-auto">
          <button
            onClick={save}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] ${
              saveError ? 'bg-red-500 text-white' : saved ? 'bg-green-500 text-black' : 'bg-sky-300 text-black hover:bg-sky-200'
            }`}
          >
            {saving ? 'Guardando…' : saveError ? `✕ ${saveError}` : saved ? '✓ Cambios guardados' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
