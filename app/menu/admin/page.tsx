'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { MenuData, MenuCategory, MenuItem, MenuVariant, WineCategory, WineItem, Translations } from '@/types/menu'
import { menuService } from '@/lib/menuService'
import { ALLERGENS, ALLERGEN_SRC, dishAllergens } from '@/lib/allergens'
import { I18N_LANGS, tAllergen } from '@/lib/translations'
import { GradientOrbs, LogoMark } from '@/components/Brand'

const ADMIN_PASSCODE = '2010'
/** Contraseña para restablecer la copia guardada (botón oculto en Opciones avanzadas). */
const RESET_PASSWORD = '7954'
const LANG_CODES = I18N_LANGS.map((l) => l.code)

/* ──────────────────────────── helpers ──────────────────────────── */

const eur = (n: number) => (n > 0 ? n.toFixed(2).replace('.', ',') + ' €' : '')
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order

/** Move an element one position up/down and renumber the order of the whole list. */
function moveInList<T extends { id: string; order: number }>(list: T[], id: string, dir: -1 | 1): T[] {
  const sorted = [...list].sort(byOrder)
  const i = sorted.findIndex((x) => x.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= sorted.length) return list
  const tmp = sorted[i]
  sorted[i] = sorted[j]
  sorted[j] = tmp
  return sorted.map((x, k) => ({ ...x, order: k }))
}

const translatedCount = (tr?: Translations) => LANG_CODES.filter((l) => tr?.[l]?.trim()).length

function cleanTranslations(tr?: Translations): Translations | undefined {
  if (!tr) return undefined
  const out: Translations = {}
  LANG_CODES.forEach((l) => {
    const v = tr[l]?.trim()
    if (v) out[l] = v
  })
  return Object.keys(out).length ? out : undefined
}

function normalize(m: MenuData): MenuData {
  return {
    ...m,
    importantDay: m.importantDay ?? false,
    showWines: m.showWines ?? true,
    categories: m.categories.filter((c) => c.id !== 'bebidas'),
    wineCategories: m.wineCategories ?? [],
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}

/* ──────────────────────────── UI primitives ──────────────────────────── */

const inputCls =
  'w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 transition disabled:opacity-30'
const labelCls = 'block text-[10px] uppercase tracking-[0.16em] font-semibold text-white/40 mb-1.5'
const goldBtn =
  'rounded-xl bg-gradient-to-br from-gold-soft to-gold text-navy-900 font-bold shadow-lg shadow-gold/15 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-40 disabled:shadow-none disabled:active:scale-100'

function Chevron({ open, className = '' }: { open?: boolean; className?: string }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full flex-shrink-0 transition-colors ${
        checked ? 'bg-gradient-to-r from-gold-soft to-gold' : 'bg-white/15'
      }`}
    >
      <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function SmallBtn({
  children,
  onClick,
  danger,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-25 ${
        danger
          ? 'text-red-300/80 hover:text-red-200 hover:bg-red-500/10'
          : 'text-white/55 hover:text-white hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  )
}

function EyeButton({ hidden, onToggle }: { hidden?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={hidden ? 'Mostrar en la carta' : 'Ocultar de la carta'}
      title={hidden ? 'Oculto — pulsa para mostrarlo' : 'Visible — pulsa para ocultarlo'}
      className={`p-2 rounded-lg transition ${hidden ? 'text-white/30 hover:text-white/70' : 'text-gold/70 hover:text-gold'}`}
    >
      {hidden ? (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 4.86c4.48 0 8.27 2.94 9.54 7a10.05 10.05 0 01-2.64 4.26M6.23 6.23A10.02 10.02 0 002.46 11.86c1.27 4.06 5.06 7 9.54 7 1.6 0 3.12-.38 4.46-1.04" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z" />
          <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
        </svg>
      )}
    </button>
  )
}

function VisibleRow({ hidden, onChange }: { hidden?: boolean; onChange: (hidden: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
      <div>
        <p className="text-sm text-white/80">Visible en la carta</p>
        <p className="text-[11px] text-white/35">{hidden ? 'Oculto: se guarda aquí pero los clientes no lo ven.' : 'Los clientes lo ven en la carta.'}</p>
      </div>
      <Switch checked={!hidden} label="Visible en la carta" onChange={(v) => onChange(!v)} />
    </div>
  )
}

function MoveButtons({ onUp, onDown, first, last }: { onUp: () => void; onDown: () => void; first: boolean; last: boolean }) {
  return (
    <div className="flex flex-col -my-1">
      <button type="button" onClick={onUp} disabled={first} aria-label="Subir" className="p-1 text-white/35 hover:text-gold disabled:opacity-15 transition">
        <Chevron open className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onDown} disabled={last} aria-label="Bajar" className="p-1 text-white/35 hover:text-gold disabled:opacity-15 transition">
        <Chevron className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* Price input with its own text state so "4," or "4.5" can be typed comfortably */
function PriceInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [raw, setRaw] = useState(() => (value === 0 ? '' : value.toFixed(2).replace('.', ',')))
  const prev = useRef(value)

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value
      setRaw(value === 0 ? '' : value.toFixed(2).replace('.', ','))
    }
  }, [value])

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        disabled={disabled}
        placeholder="Consultar"
        onChange={(e) => {
          const v = e.target.value.replace(',', '.')
          if (v === '' || v === '.') {
            setRaw(e.target.value)
            prev.current = 0
            onChange(0)
            return
          }
          if (/^\d*\.?\d{0,2}$/.test(v)) {
            setRaw(e.target.value)
            const num = parseFloat(v)
            if (!isNaN(num)) {
              prev.current = num
              onChange(num)
            }
          }
        }}
        onBlur={() => {
          const num = parseFloat(raw.replace(',', '.')) || 0
          prev.current = num
          setRaw(num === 0 ? '' : num.toFixed(2).replace('.', ','))
        }}
        className={`${inputCls} pr-8 text-right tabular-nums`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30 pointer-events-none">€</span>
    </div>
  )
}

/* ──────────────────────────── translations & allergens ──────────────────────────── */

function TranslationFields({ value, onChange }: { value?: Translations; onChange: (v: Translations) => void }) {
  return (
    <div className="space-y-2">
      {I18N_LANGS.map((info) => {
        const l = info.code
        return (
          <label key={l} className="flex items-center gap-2">
            <span className="w-8 flex-shrink-0 text-center text-lg" title={info.label}>{info.flag}</span>
            <input
              value={value?.[l] ?? ''}
              onChange={(e) => onChange({ ...(value ?? {}), [l]: e.target.value })}
              placeholder={info.label}
              className={inputCls}
            />
          </label>
        )
      })}
      <p className="text-[11px] text-white/35 pl-10">Si dejas un idioma vacío, se mostrará el nombre en español.</p>
    </div>
  )
}

function TranslationsToggle({
  value,
  onChange,
  forceOpen,
  warning,
  label = 'Traducciones',
}: {
  value?: Translations
  onChange: (v: Translations) => void
  forceOpen?: boolean
  warning?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const n = translatedCount(value)
  const isOpen = open || !!forceOpen
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
        <span className="text-sm">🌍</span>
        <span className="text-sm text-white/75 flex-1">{label}</span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            n === 4 ? 'bg-emerald-400/15 text-emerald-300' : n === 0 ? 'bg-amber-400/15 text-amber-200' : 'bg-white/10 text-white/60'
          }`}
        >
          {n}/4
        </span>
        <Chevron open={isOpen} className="text-white/40" />
      </button>
      {warning && <p className="px-3 pb-2 text-[11px] text-amber-200/85">{warning}</p>}
      {isOpen && (
        <div className="px-3 pb-3 animate-fade-in">
          <TranslationFields value={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

function AllergenPicker({ value, onChange }: { value?: string[]; onChange: (v: string[]) => void }) {
  const selected = value ?? []
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      {ALLERGENS.map((a) => {
        const on = selected.includes(a.id)
        return (
          <button
            type="button"
            key={a.id}
            aria-pressed={on}
            onClick={() => {
              const next = on ? selected.filter((x) => x !== a.id) : [...selected, a.id]
              onChange(ALLERGENS.map((x) => x.id).filter((id) => next.includes(id)))
            }}
            className={`flex items-center gap-2 rounded-xl px-2.5 py-2 border text-left text-xs transition ${
              on ? 'bg-gold/[0.14] border-gold/50 text-white' : 'bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white/75'
            }`}
          >
            <Image src={a.src} alt="" width={20} height={20} className={`rounded-full flex-shrink-0 transition ${on ? '' : 'opacity-35 grayscale'}`} />
            <span className="truncate">{tAllergen('es', a.id)}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ──────────────────────────── editors ──────────────────────────── */

/* Sabores / variedades de un plato (mismo precio), p. ej. los tipos de croqueta */
function VariantsEditor({ value, onChange }: { value?: MenuVariant[]; onChange: (v: MenuVariant[]) => void }) {
  const list = value ?? []
  const [openId, setOpenId] = useState<string | null>(null)
  const update = (id: string, patch: Partial<MenuVariant>) => onChange(list.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  const remove = (v: MenuVariant) => {
    if (v.name.trim() && !confirm(`¿Quitar el sabor «${v.name}»? (si solo no hay hoy, mejor ocúltalo con el ojo)`)) return
    onChange(list.filter((x) => x.id !== v.id))
  }
  const add = () => {
    const id = uid('sabor')
    onChange([...list, { id, name: '' }])
  }

  return (
    <div>
      <label className={labelCls}>Sabores / variedades (opcional)</label>
      <p className="text-[11px] text-white/35 -mt-0.5 mb-2">
        Salen debajo del nombre, separados por «·», con el mismo precio. Con el ojo los quitas o pones según haya.
      </p>
      <div className="space-y-1.5">
        {list.map((v) => {
          const open = openId === v.id
          const n = translatedCount(v.nameI18n)
          return (
            <div key={v.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex items-center gap-1 pl-1 pr-1 py-1">
                <EyeButton hidden={v.hidden} onToggle={() => update(v.id, { hidden: !v.hidden })} />
                <input
                  value={v.name}
                  autoFocus={!v.name}
                  onChange={(e) => update(v.id, { name: e.target.value })}
                  placeholder="Ej. Jamón"
                  className={`${inputCls} py-2 ${v.hidden ? 'opacity-45' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : v.id)}
                  className={`flex items-center gap-1 px-2 py-2 text-[11px] font-semibold rounded-lg transition whitespace-nowrap ${
                    n === 4 ? 'text-emerald-300/80' : 'text-amber-200/80'
                  } hover:bg-white/[0.06]`}
                  aria-expanded={open}
                  title="Traducciones y alérgenos del sabor"
                >
                  🌍 {n}/4
                  <Chevron open={open} className="w-3 h-3 text-white/40" />
                </button>
                <button type="button" onClick={() => remove(v)} aria-label="Quitar sabor" className="p-2 text-red-300/50 hover:text-red-200 transition">
                  ✕
                </button>
              </div>
              {open && (
                <div className="px-3 pb-3 pt-1 space-y-3 animate-fade-in">
                  <TranslationFields value={v.nameI18n} onChange={(nameI18n) => update(v.id, { nameI18n })} />
                  <div>
                    <p className={labelCls}>Alérgenos que añade este sabor</p>
                    <AllergenPicker value={v.allergens} onChange={(allergens) => update(v.id, { allergens })} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button type="button" onClick={add} className="mt-2 text-sm text-gold/70 hover:text-gold transition">
        + Añadir sabor
      </button>
    </div>
  )
}

function DishEditor({
  item,
  onChange,
  onDelete,
  onDone,
}: {
  item: MenuItem
  onChange: (patch: Partial<MenuItem>) => void
  onDelete: () => void
  onDone: () => void
}) {
  const originalName = useRef(item.name)
  const nameChanged = originalName.current.trim() !== '' && item.name.trim() !== originalName.current.trim()
  const staleTranslations = nameChanged && translatedCount(item.nameI18n) > 0
  const originalDesc = useRef(item.description ?? '')
  const descChanged = originalDesc.current.trim() !== '' && (item.description ?? '').trim() !== originalDesc.current.trim()
  const staleDesc = descChanged && translatedCount(item.descriptionI18n) > 0

  return (
    <div className="space-y-4 py-1 animate-fade-in">
      <div>
        <label className={labelCls}>Nombre del plato (español)</label>
        <input
          value={item.name}
          autoFocus={!item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ej. Croquetas caseras"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Descripción (opcional)</label>
        <textarea
          value={item.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Sale en pequeño debajo del nombre. Ej.: Salsa de mayonesa, huevo duro, bacon y queso"
          rows={2}
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </div>

      <VisibleRow hidden={item.hidden} onChange={(hidden) => onChange({ hidden })} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{item.samePrice ? 'Precio' : 'Precio tapa'}</label>
          <PriceInput
            value={item.priceTapa}
            onChange={(v) => onChange({ priceTapa: v, ...(item.samePrice ? { priceMedia: v } : {}) })}
          />
        </div>
        <div>
          <label className={labelCls}>Precio media</label>
          <PriceInput value={item.priceMedia} disabled={item.samePrice} onChange={(v) => onChange({ priceMedia: v })} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
        <div>
          <p className="text-sm text-white/80">Mismo precio en tapa y media</p>
          <p className="text-[11px] text-white/35">Sin precio, en la carta sale «Consultar».</p>
        </div>
        <Switch
          checked={item.samePrice}
          label="Mismo precio"
          onChange={(v) => onChange({ samePrice: v, ...(v ? { priceMedia: item.priceTapa } : {}) })}
        />
      </div>

      <div>
        <label className={labelCls}>{item.variants?.length ? 'Alérgenos comunes a todos los sabores' : 'Alérgenos'}</label>
        <AllergenPicker value={item.allergens} onChange={(allergens) => onChange({ allergens })} />
      </div>

      <div>
        <VariantsEditor value={item.variants} onChange={(variants) => onChange({ variants })} />
      </div>

      <TranslationsToggle
        value={item.nameI18n}
        onChange={(nameI18n) => onChange({ nameI18n })}
        forceOpen={staleTranslations}
        warning={staleTranslations ? 'Has cambiado el nombre en español: revisa que las traducciones sigan valiendo.' : undefined}
      />

      {!!item.description?.trim() && (
        <TranslationsToggle
          label="Traducciones de la descripción"
          value={item.descriptionI18n}
          onChange={(descriptionI18n) => onChange({ descriptionI18n })}
          forceOpen={staleDesc}
          warning={staleDesc ? 'Has cambiado la descripción en español: revisa sus traducciones.' : undefined}
        />
      )}

      <div className="flex items-center gap-2 pt-1">
        <SmallBtn danger onClick={onDelete}>Eliminar plato</SmallBtn>
        <div className="flex-1" />
        <button type="button" onClick={onDone} className={`${goldBtn} px-6 py-2.5 text-sm`}>Listo</button>
      </div>
    </div>
  )
}

function WineEditor({
  wine,
  onChange,
  onDelete,
  onDone,
}: {
  wine: WineItem
  onChange: (patch: Partial<WineItem>) => void
  onDelete: () => void
  onDone: () => void
}) {
  return (
    <div className="space-y-4 py-1 animate-fade-in">
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div>
          <label className={labelCls}>Vino / bodega</label>
          <input value={wine.name} autoFocus={!wine.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Ej. Protos" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Añada</label>
          <input
            value={wine.year ?? ''}
            inputMode="numeric"
            maxLength={4}
            onChange={(e) => onChange({ year: e.target.value.replace(/\D/g, '') || undefined })}
            placeholder="2024"
            className={`${inputCls} text-center`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Copa</label>
          <PriceInput value={wine.priceCopa} onChange={(v) => onChange({ priceCopa: v })} />
        </div>
        <div>
          <label className={labelCls}>Botella</label>
          <PriceInput value={wine.priceBottle} onChange={(v) => onChange({ priceBottle: v })} />
        </div>
      </div>
      <p className="text-[11px] text-white/35 -mt-2">Deja la copa vacía si ese vino no se sirve por copas.</p>
      <TranslationsToggle value={wine.nameI18n} onChange={(nameI18n) => onChange({ nameI18n })} />
      <VisibleRow hidden={wine.hidden} onChange={(hidden) => onChange({ hidden })} />
      <div className="flex items-center gap-2 pt-1">
        <SmallBtn danger onClick={onDelete}>Eliminar vino</SmallBtn>
        <div className="flex-1" />
        <button type="button" onClick={onDone} className={`${goldBtn} px-6 py-2.5 text-sm`}>Listo</button>
      </div>
    </div>
  )
}

/* ──────────────────────────── modals & gate ──────────────────────────── */

function PasscodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(0)

  const check = () => {
    if (code === ADMIN_PASSCODE) {
      localStorage.setItem('menu-admin', '1')
      onUnlock()
    } else {
      setError((e) => e + 1)
      setCode('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#021530] px-6 relative overflow-hidden">
      <GradientOrbs />
      <div className="relative z-10 w-full max-w-xs text-center animate-fade-in-up">
        <LogoMark className="w-16 h-16 mx-auto mb-6" />
        <p className="text-[10px] tracking-[0.45em] uppercase text-gold/70 font-semibold">Sabores</p>
        <h1 className="font-display text-4xl font-semibold text-white mt-1">Panel de gestión</h1>
        <p className="text-sm text-white/40 mt-2 mb-8">Introduce el código de acceso</p>
        <div key={error} className={error ? 'animate-shake' : ''}>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            className={`${inputCls} py-3.5 text-center text-2xl tracking-[0.5em] ${error ? 'border-red-400/70' : ''}`}
            autoFocus
          />
        </div>
        <button onClick={check} disabled={!code} className={`${goldBtn} w-full mt-3 py-3.5 tracking-wide`}>
          Entrar
        </button>
        <p className={`text-xs text-red-300 mt-3 h-4 ${error ? '' : 'invisible'}`}>Código incorrecto</p>
      </div>
    </div>
  )
}

function PasswordModal({
  title,
  children,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string
  children: React.ReactNode
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = () => {
    if (pw === RESET_PASSWORD) onConfirm()
    else {
      setError((e) => e + 1)
      setPw('')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        key={error}
        className={`relative w-full max-w-sm rounded-3xl bg-[#04244f] border p-6 shadow-2xl ${danger ? 'border-red-400/25' : 'border-gold/25'} ${
          error ? 'animate-shake' : 'animate-modal-pop'
        }`}
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 border ${
            danger ? 'bg-red-500/15 border-red-400/30 text-red-300' : 'bg-gold/15 border-gold/30 text-gold'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M8 11V8a4 4 0 118 0v3" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
        <div className="text-sm text-white/55 mt-2 leading-relaxed">{children}</div>
        <label className={`${labelCls} mt-5`}>Contraseña</label>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && pw && submit()}
          placeholder="••••"
          className={`${inputCls} py-3 text-center text-xl tracking-[0.5em] ${error ? 'border-red-400/70' : ''}`}
        />
        <p className={`text-xs text-red-300 mt-2 h-4 ${error ? '' : 'invisible'}`}>Contraseña incorrecta</p>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/[0.07] text-white/80 text-sm font-semibold hover:bg-white/[0.12] transition">
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!pw}
            className={
              danger
                ? 'flex-1 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold transition disabled:opacity-40'
                : `flex-1 py-3 text-sm ${goldBtn}`
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────── main page ──────────────────────────── */

type Editing = { kind: 'dish' | 'wine'; catId: string; itemId: string } | null
type LoadState = 'loading' | 'ready' | 'error'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [snapshot, setSnapshot] = useState('')
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [view, setView] = useState<'carta' | 'vinos'>('carta')
  const [openCats, setOpenCats] = useState<string[]>([])
  const [trCats, setTrCats] = useState<string[]>([])
  const [editing, setEditing] = useState<Editing>(null)
  const [advanced, setAdvanced] = useState(false)
  const [pwAction, setPwAction] = useState<'reset' | 'factory' | null>(null)
  const [notice, setNotice] = useState('')
  const [visits, setVisits] = useState<{ total: number; today: number }>({ total: 0, today: 0 })
  const [factorySavedAt, setFactorySavedAt] = useState<string | null>(null)
  const [factoryMsg, setFactoryMsg] = useState('')

  const dirty = !!menu && loadState === 'ready' && JSON.stringify(menu) !== snapshot

  useEffect(() => {
    if (localStorage.getItem('menu-admin') === '1') setAuthed(true)
  }, [])

  /* Load the LIVE menu. Never fall back to the defaults here: saving them by accident is what wipes the carta. */
  const load = useCallback(async () => {
    setLoadState('loading')
    setLoadError('')
    try {
      const fresh = normalize(await withTimeout(menuService.fetchMenu({ strict: true }), 15000))
      setMenu(fresh)
      setSnapshot(JSON.stringify(fresh))
      setLoadState('ready')
    } catch (err: any) {
      console.error('Load error:', err)
      setLoadError(
        err?.message === 'timeout'
          ? 'La conexión está tardando demasiado.'
          : err?.code === 'permission-denied'
          ? 'Sin permisos de lectura en Firestore.'
          : 'No se ha podido cargar la carta.'
      )
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    load()
    menuService.fetchInitialMenu().then((init) => setFactorySavedAt(init?.updatedAt ?? null))
    const unsub = menuService.subscribeVisits(setVisits)
    return () => unsub()
  }, [authed, load])

  const save = useCallback(async () => {
    if (!menu || loadState !== 'ready' || saving) return
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const clean: MenuData = {
        ...menu,
        categories: menu.categories
          .filter((c) => c.id !== 'bebidas')
          .map((c) => ({
            ...c,
            nameI18n: cleanTranslations(c.nameI18n),
            note: c.note?.trim() ?? '',
            noteI18n: c.note?.trim() ? cleanTranslations(c.noteI18n) : undefined,
            description: c.description?.trim() ?? '',
            descriptionI18n: c.description?.trim() ? cleanTranslations(c.descriptionI18n) : undefined,
            items: c.items
              .filter((it) => it.name.trim())
              .map((it) => ({
                ...it,
                name: it.name.trim(),
                nameI18n: cleanTranslations(it.nameI18n),
                description: it.description?.trim() || undefined,
                descriptionI18n: it.description?.trim() ? cleanTranslations(it.descriptionI18n) : undefined,
                variants: it.variants?.length
                  ? it.variants
                      .filter((v) => v.name.trim())
                      .map((v) => ({ ...v, name: v.name.trim(), nameI18n: cleanTranslations(v.nameI18n) }))
                  : undefined,
              })),
          })),
        wineCategories: (menu.wineCategories ?? []).map((wc) => ({
          ...wc,
          nameI18n: cleanTranslations(wc.nameI18n),
          items: wc.items.filter((w) => w.name.trim()).map((w) => ({ ...w, name: w.name.trim(), nameI18n: cleanTranslations(w.nameI18n) })),
        })),
      }
      const updatedAt = await menuService.saveMenu(clean)
      const next: MenuData = JSON.parse(JSON.stringify({ ...clean, updatedAt }))
      setMenu(next)
      setSnapshot(JSON.stringify(next))
      setSaved(true)
      setNotice('')
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      console.error('Save error:', err?.code, err?.message, err)
      setSaveError(err?.code === 'permission-denied' ? 'Sin permisos: revisa las reglas de Firestore' : err?.message || 'Error desconocido')
      setTimeout(() => setSaveError(''), 6000)
    } finally {
      setSaving(false)
    }
  }, [menu, loadState, saving])

  /* Warn before leaving with unsaved changes + Ctrl/Cmd+S to save */
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('keydown', onKey)
    }
  }, [dirty, save])

  /* ── state updaters ── */
  const patchMenu = (fn: (m: MenuData) => MenuData) => setMenu((m) => (m ? fn(m) : m))

  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  // dishes
  const updateCat = (catId: string, patch: Partial<MenuCategory>) =>
    patchMenu((m) => ({ ...m, categories: m.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) }))

  const updateItem = (catId: string, itemId: string, patch: Partial<MenuItem>) =>
    patchMenu((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) } : c
      ),
    }))

  const removeItem = (catId: string, itemId: string) =>
    patchMenu((m) => ({
      ...m,
      categories: m.categories.map((c) => (c.id === catId ? { ...c, items: c.items.filter((it) => it.id !== itemId) } : c)),
    }))

  const addItem = (catId: string) => {
    const id = uid(catId)
    patchMenu((m) => ({
      ...m,
      categories: m.categories.map((c) => {
        if (c.id !== catId) return c
        const order = c.items.length ? Math.max(...c.items.map((it) => it.order)) + 1 : 0
        return { ...c, items: [...c.items, { id, name: '', priceTapa: 0, priceMedia: 0, samePrice: true, order, allergens: [] }] }
      }),
    }))
    setEditing({ kind: 'dish', catId, itemId: id })
  }

  const moveItem = (catId: string, itemId: string, dir: -1 | 1) =>
    patchMenu((m) => ({
      ...m,
      categories: m.categories.map((c) => (c.id === catId ? { ...c, items: moveInList(c.items, itemId, dir) } : c)),
    }))

  const addCategory = () => {
    const id = uid('cat')
    patchMenu((m) => ({
      ...m,
      categories: [...m.categories, { id, name: 'Nueva sección', icon: '🍽️', order: m.categories.length, items: [] }],
    }))
    setOpenCats((o) => [...o, id])
  }

  const removeCategory = (cat: MenuCategory) => {
    if (!confirm(`¿Eliminar la sección «${cat.name}» y sus ${cat.items.length} platos?`)) return
    patchMenu((m) => ({ ...m, categories: m.categories.filter((c) => c.id !== cat.id) }))
  }

  const moveCategory = (catId: string, dir: -1 | 1) => patchMenu((m) => ({ ...m, categories: moveInList(m.categories, catId, dir) }))

  // wines
  const updateWineCat = (catId: string, patch: Partial<WineCategory>) =>
    patchMenu((m) => ({ ...m, wineCategories: (m.wineCategories ?? []).map((c) => (c.id === catId ? { ...c, ...patch } : c)) }))

  const updateWine = (catId: string, wineId: string, patch: Partial<WineItem>) =>
    patchMenu((m) => ({
      ...m,
      wineCategories: (m.wineCategories ?? []).map((c) =>
        c.id === catId ? { ...c, items: c.items.map((w) => (w.id === wineId ? { ...w, ...patch } : w)) } : c
      ),
    }))

  const removeWine = (catId: string, wineId: string) =>
    patchMenu((m) => ({
      ...m,
      wineCategories: (m.wineCategories ?? []).map((c) => (c.id === catId ? { ...c, items: c.items.filter((w) => w.id !== wineId) } : c)),
    }))

  const addWine = (catId: string) => {
    const id = uid('w')
    patchMenu((m) => ({
      ...m,
      wineCategories: (m.wineCategories ?? []).map((c) => {
        if (c.id !== catId) return c
        const order = c.items.length ? Math.max(...c.items.map((w) => w.order)) + 1 : 0
        return { ...c, items: [...c.items, { id, name: '', priceCopa: 0, priceBottle: 0, order }] }
      }),
    }))
    setEditing({ kind: 'wine', catId, itemId: id })
  }

  const moveWine = (catId: string, wineId: string, dir: -1 | 1) =>
    patchMenu((m) => ({
      ...m,
      wineCategories: (m.wineCategories ?? []).map((c) => (c.id === catId ? { ...c, items: moveInList(c.items, wineId, dir) } : c)),
    }))

  const addWineCategory = () => {
    const id = uid('wc')
    patchMenu((m) => ({
      ...m,
      wineCategories: [...(m.wineCategories ?? []), { id, name: 'Nueva denominación', order: (m.wineCategories ?? []).length, items: [] }],
    }))
    setOpenCats((o) => [...o, id])
  }

  const removeWineCategory = (cat: WineCategory) => {
    if (!confirm(`¿Eliminar «${cat.name}» y sus ${cat.items.length} vinos?`)) return
    patchMenu((m) => ({ ...m, wineCategories: (m.wineCategories ?? []).filter((c) => c.id !== cat.id) }))
  }

  const moveWineCategory = (catId: string, dir: -1 | 1) =>
    patchMenu((m) => ({ ...m, wineCategories: moveInList(m.wineCategories ?? [], catId, dir) }))

  /** Close the editor; an item left without a name is discarded. */
  const closeEditor = () => {
    if (editing && menu) {
      if (editing.kind === 'dish') {
        const it = menu.categories.find((c) => c.id === editing.catId)?.items.find((i) => i.id === editing.itemId)
        if (it && !it.name.trim()) removeItem(editing.catId, editing.itemId)
      } else {
        const w = menu.wineCategories?.find((c) => c.id === editing.catId)?.items.find((i) => i.id === editing.itemId)
        if (w && !w.name.trim()) removeWine(editing.catId, editing.itemId)
      }
    }
    setEditing(null)
  }

  /** Restablecer: vuelve a poner la carta de fábrica y la publica al momento. */
  const confirmReset = async () => {
    setPwAction(null)
    setSaving(true)
    try {
      const target = normalize(await menuService.fetchResetTarget())
      const updatedAt = await menuService.saveMenu(target)
      const next: MenuData = JSON.parse(JSON.stringify({ ...target, updatedAt }))
      setMenu(next)
      setSnapshot(JSON.stringify(next))
      setEditing(null)
      setAdvanced(false)
      setNotice('Carta de fábrica restablecida y publicada.')
      setTimeout(() => setNotice(''), 8000)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setSaveError(err?.code === 'permission-denied' ? 'Sin permisos: revisa las reglas de Firestore' : 'No se ha podido restablecer la carta de fábrica')
      setTimeout(() => setSaveError(''), 6000)
    } finally {
      setSaving(false)
    }
  }

  /** Guardar carta de fábrica: la carta guardada ahora pasa a ser la que pone «Restablecer». */
  const confirmSaveFactory = async () => {
    setPwAction(null)
    if (!menu) return
    setFactoryMsg('Guardando carta de fábrica…')
    try {
      await menuService.saveInitialMenu(menu)
      setFactorySavedAt(new Date().toISOString())
      setFactoryMsg('✓ Guardada como carta de fábrica')
    } catch (err: any) {
      setFactoryMsg(err?.code === 'permission-denied' ? 'Sin permisos de Firestore' : 'Error al guardar la carta de fábrica')
    }
    setTimeout(() => setFactoryMsg(''), 5000)
  }

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null

  /* ── render ── */

  if (!authed) return <PasscodeGate onUnlock={() => setAuthed(true)} />

  const cats = menu ? [...menu.categories].sort(byOrder) : []
  const wineCats = menu ? [...(menu.wineCategories ?? [])].sort(byOrder) : []
  const dishCount = cats.reduce((n, c) => n + c.items.length, 0)
  const wineCount = wineCats.reduce((n, c) => n + c.items.length, 0)
  const untranslated = cats.reduce((n, c) => n + c.items.filter((it) => it.name.trim() && translatedCount(it.nameI18n) < 4).length, 0)

  const status = saving
    ? { dot: 'bg-sky-300 animate-pulse', text: 'Guardando…' }
    : saveError
    ? { dot: 'bg-red-400', text: 'Error al guardar' }
    : saved
    ? { dot: 'bg-emerald-400', text: 'Guardado y publicado' }
    : dirty
    ? { dot: 'bg-amber-300', text: 'Cambios sin guardar' }
    : loadState === 'ready'
    ? {
        dot: 'bg-emerald-400/70',
        text: menu?.updatedAt
          ? `Publicado ${new Date(menu.updatedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
          : 'Al día',
      }
    : { dot: 'bg-white/30', text: loadState === 'loading' ? 'Cargando…' : 'Sin conexión' }

  return (
    <div className="min-h-screen bg-[#021530] text-white pb-40 relative">
      <GradientOrbs />
      {pwAction === 'factory' && (
        <PasswordModal title="Guardar carta de fábrica" confirmLabel="Guardar" onClose={() => setPwAction(null)} onConfirm={confirmSaveFactory}>
          La carta que tienes guardada ahora pasará a ser la <span className="text-white">carta de fábrica</span>: la que se pone
          al pulsar «Restablecer».
          {factorySavedAt && <> Sustituye a la guardada el <span className="text-white">{fmtDate(factorySavedAt)}</span>.</>}
        </PasswordModal>
      )}
      {pwAction === 'reset' && (
        <PasswordModal title="Restablecer carta de fábrica" confirmLabel="Restablecer" danger onClose={() => setPwAction(null)} onConfirm={confirmReset}>
          Se cambiará toda la carta (platos, precios, alérgenos y vinos) por la carta de fábrica
          {factorySavedAt ? <> guardada el <span className="text-white">{fmtDate(factorySavedAt)}</span></> : ' que viene con la web'} y
          se <span className="text-white font-semibold">publicará al momento</span>.
          {dirty && <> Los cambios que no hayas guardado se perderán.</>}
        </PasswordModal>
      )}

      {/* ─── header ─── */}
      <header className="sticky top-0 z-50 bg-[#021530]/[0.97] border-b border-white/[0.07]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <LogoMark className="w-9 h-9 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl leading-none font-semibold truncate">
              {menu?.barName || 'Sabores'} <span className="font-sans text-xs font-semibold text-gold/80 tracking-wider uppercase ml-1">Admin</span>
            </p>
            <p className="flex items-center gap-1.5 mt-1 text-[11px] text-white/45">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.text}
            </p>
          </div>
          <a
            href="/menu/medias"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-xs font-semibold text-gold-soft/90 hover:text-gold px-3 py-2 rounded-xl border border-gold/25 hover:bg-gold/10 transition"
          >
            Ver carta ↗
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {notice && (
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/[0.08] px-4 py-3 flex items-start gap-3 animate-fade-in">
            <span className="text-lg leading-none mt-0.5">↺</span>
            <p className="text-sm text-emerald-100/90 flex-1">{notice}</p>
          </div>
        )}

        {saveError && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200 animate-fade-in">✕ {saveError}</div>
        )}

        {loadState === 'loading' && (
          <div className="space-y-3" aria-label="Cargando">
            <div className="h-36 rounded-2xl skeleton" />
            <div className="h-12 rounded-2xl skeleton" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl skeleton" />
            ))}
          </div>
        )}

        {loadState === 'error' && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="font-display text-2xl text-white">No se ha podido cargar la carta</p>
            <p className="text-sm text-white/50 mt-2">{loadError} Para no sobrescribir nada, no se puede editar hasta que cargue.</p>
            <button onClick={load} className={`${goldBtn} mt-5 px-6 py-2.5 text-sm`}>Reintentar</button>
          </div>
        )}

        {menu && loadState === 'ready' && (
          <>
            {/* ─── status card ─── */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] divide-y divide-white/[0.06]">
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Día importante</p>
                  <p className="text-xs text-white/45 mt-0.5">
                    {menu.importantDay ? 'Activo: la carta de tapas está oculta, solo se ven medias.' : 'Se ven tapas y medias raciones.'}
                  </p>
                </div>
                <Switch checked={!!menu.importantDay} label="Día importante" onChange={(v) => patchMenu((m) => ({ ...m, importantDay: v }))} />
              </div>
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Carta de vinos visible</p>
                  <p className="text-xs text-white/45 mt-0.5">{menu.showWines ? 'La pestaña Vinos aparece en la carta.' : 'La pestaña Vinos está oculta.'}</p>
                </div>
                <Switch checked={!!menu.showWines} label="Vinos visibles" onChange={(v) => patchMenu((m) => ({ ...m, showWines: v }))} />
              </div>
              <div className="flex items-center gap-6 px-4 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Visitas a la carta</p>
                  <p className="text-xs text-white/45 mt-0.5">Una por sesión (≈ cada escaneo del QR).</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-semibold text-gold-soft leading-none tabular-nums">{visits.today}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">hoy</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-semibold text-white/85 leading-none tabular-nums">{visits.total}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">total</p>
                </div>
              </div>
              <div className="px-4 py-3.5">
                <label className={labelCls}>Nombre del local</label>
                <input value={menu.barName} onChange={(e) => patchMenu((m) => ({ ...m, barName: e.target.value }))} className={inputCls} />
              </div>
            </section>

            {/* ─── view switch ─── */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
              {(
                [
                  ['carta', 'Carta', dishCount],
                  ['vinos', 'Vinos', wineCount],
                ] as const
              ).map(([key, label, n]) => (
                <button
                  key={key}
                  onClick={() => {
                    closeEditor()
                    setView(key)
                  }}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition ${
                    view === key ? 'bg-gradient-to-br from-gold-soft to-gold text-navy-900 shadow-md shadow-gold/20' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {label} <span className={`ml-1 text-xs ${view === key ? 'text-navy-900/60' : 'text-white/35'}`}>{n}</span>
                </button>
              ))}
            </div>

            {view === 'carta' && untranslated > 0 && (
              <p className="text-xs text-amber-200/75 px-1">
                🌍 {untranslated} {untranslated === 1 ? 'plato no tiene' : 'platos no tienen'} las 4 traducciones. En esos idiomas saldrán en español.
              </p>
            )}

            {/* ─── dish categories ─── */}
            {view === 'carta' && (
              <div className="space-y-3">
                {cats.map((cat, ci) => {
                  const open = openCats.includes(cat.id)
                  const items = [...cat.items].sort(byOrder)
                  return (
                    <section key={cat.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <input
                          value={cat.icon || ''}
                          onChange={(e) => updateCat(cat.id, { icon: e.target.value })}
                          className="w-10 h-10 rounded-xl bg-white/[0.04] text-center text-xl focus:outline-none focus:ring-2 focus:ring-gold/25"
                          title="Emoji de la sección"
                          aria-label="Emoji"
                        />
                        <input
                          value={cat.name}
                          onChange={(e) => updateCat(cat.id, { name: e.target.value })}
                          className="flex-1 min-w-0 bg-transparent font-display text-[1.35rem] font-semibold text-white focus:outline-none border-b border-transparent focus:border-gold/50 transition"
                          aria-label="Nombre de la sección"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCats((o) => toggleIn(o, cat.id))
                            if (open && editing?.catId === cat.id) closeEditor()
                          }}
                          className="flex items-center gap-1.5 pl-2 pr-1 py-2 text-white/45 hover:text-white transition"
                          aria-expanded={open}
                        >
                          {cat.hidden && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 bg-white/10 rounded px-1.5 py-0.5">Oculta</span>
                          )}
                          <span className="text-xs tabular-nums">{cat.items.length}</span>
                          <Chevron open={open} />
                        </button>
                      </div>

                      {open && (
                        <div className="animate-fade-in">
                          <div className="flex flex-wrap items-center gap-1 px-2 pb-2 border-b border-white/[0.06]">
                            <SmallBtn onClick={() => moveCategory(cat.id, -1)} disabled={ci === 0}>↑ Subir</SmallBtn>
                            <SmallBtn onClick={() => moveCategory(cat.id, 1)} disabled={ci === cats.length - 1}>↓ Bajar</SmallBtn>
                            <SmallBtn onClick={() => setTrCats((o) => toggleIn(o, cat.id))}>
                              🌍 Traducir <span className="text-white/35">{translatedCount(cat.nameI18n)}/4</span>
                            </SmallBtn>
                            <SmallBtn onClick={() => updateCat(cat.id, { hidden: !cat.hidden })}>
                              {cat.hidden ? '👁 Mostrar' : 'Ocultar'}
                            </SmallBtn>
                            <div className="flex-1" />
                            <SmallBtn danger onClick={() => removeCategory(cat)}>Eliminar</SmallBtn>
                          </div>

                          <div className="px-4 py-2.5 border-b border-white/[0.06]">
                            <input
                              value={cat.note ?? ''}
                              onChange={(e) => updateCat(cat.id, { note: e.target.value })}
                              placeholder="Etiqueta bajo el título (opcional). Ej.: Solo los fines de semana"
                              className={`${inputCls} py-2 text-xs italic`}
                              aria-label="Nota bajo el título"
                            />
                            <textarea
                              value={cat.description ?? ''}
                              onChange={(e) => updateCat(cat.id, { description: e.target.value })}
                              placeholder="Explicación bajo el título (opcional)"
                              rows={3}
                              className={`${inputCls} mt-2 py-2 text-xs leading-relaxed resize-none`}
                              aria-label="Explicación de la sección"
                            />
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <label className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                                <span className="text-xs text-white/70">Mínimo personas</span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={20}
                                  value={cat.minPeople ?? ''}
                                  onChange={(e) => {
                                    const n = parseInt(e.target.value, 10)
                                    updateCat(cat.id, { minPeople: Number.isFinite(n) && n > 1 ? n : 0 })
                                  }}
                                  placeholder="—"
                                  className="w-12 rounded-lg bg-white/[0.06] border border-white/10 px-1 py-1 text-center text-sm text-white focus:outline-none focus:border-gold/60"
                                />
                              </label>
                              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                                <span className="text-xs text-white/70">Precio por persona</span>
                                <Switch checked={!!cat.pricePerPerson} label="Precio por persona" onChange={(v) => updateCat(cat.id, { pricePerPerson: v })} />
                              </div>
                            </div>
                          </div>

                          {trCats.includes(cat.id) && (
                            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015] space-y-4 animate-fade-in">
                              <div>
                                <p className={labelCls}>Nombre de la sección</p>
                                <TranslationFields value={cat.nameI18n} onChange={(nameI18n) => updateCat(cat.id, { nameI18n })} />
                              </div>
                              {!!cat.note?.trim() && (
                                <div>
                                  <p className={labelCls}>Etiqueta «{cat.note}»</p>
                                  <TranslationFields value={cat.noteI18n} onChange={(noteI18n) => updateCat(cat.id, { noteI18n })} />
                                </div>
                              )}
                              {!!cat.description?.trim() && (
                                <div>
                                  <p className={labelCls}>Explicación</p>
                                  <TranslationFields value={cat.descriptionI18n} onChange={(descriptionI18n) => updateCat(cat.id, { descriptionI18n })} />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="divide-y divide-white/[0.05]">
                            {items.map((item, ii) => {
                              const isEditing = editing?.kind === 'dish' && editing.catId === cat.id && editing.itemId === item.id
                              const nTr = translatedCount(item.nameI18n)
                              return (
                                <div key={item.id} className={`px-4 transition-colors ${isEditing ? 'bg-gold/[0.05] py-3' : 'hover:bg-white/[0.02]'}`}>
                                  {isEditing ? (
                                    <DishEditor
                                      item={item}
                                      onChange={(patch) => updateItem(cat.id, item.id, patch)}
                                      onDelete={() => {
                                        if (!item.name.trim() || confirm(`¿Eliminar «${item.name}»?`)) {
                                          removeItem(cat.id, item.id)
                                          setEditing(null)
                                        }
                                      }}
                                      onDone={closeEditor}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          closeEditor()
                                          setEditing({ kind: 'dish', catId: cat.id, itemId: item.id })
                                        }}
                                        className={`flex-1 min-w-0 flex items-center gap-3 py-3 text-left transition-opacity ${item.hidden ? 'opacity-45' : ''}`}
                                      >
                                        <span className="flex-1 min-w-0">
                                          <span className="block text-sm text-white/90 leading-snug">{item.name || <em className="text-white/30">Sin nombre</em>}</span>
                                          {!!item.description?.trim() && (
                                            <span className="block text-xs text-white/45 mt-0.5 leading-snug">{item.description}</span>
                                          )}
                                          {!!item.variants?.length && (
                                            <span className="block text-xs text-white/45 mt-0.5 leading-snug">
                                              {item.variants.filter((v) => !v.hidden).map((v) => v.name).join(' · ') || 'Sin sabores visibles'}
                                              {item.variants.some((v) => v.hidden) && (
                                                <span className="text-white/30"> · {item.variants.filter((v) => v.hidden).length} oculto{item.variants.filter((v) => v.hidden).length > 1 ? 's' : ''}</span>
                                              )}
                                            </span>
                                          )}
                                          <span className="flex flex-wrap items-center gap-1 mt-1.5">
                                            {item.hidden && (
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 bg-white/10 rounded px-1.5 py-0.5 mr-0.5">Oculto</span>
                                            )}
                                            {dishAllergens(item).map((a) =>
                                              ALLERGEN_SRC[a] ? (
                                                <Image key={a} src={ALLERGEN_SRC[a]} alt={tAllergen('es', a)} title={tAllergen('es', a)} width={15} height={15} className="rounded-full" />
                                              ) : null
                                            )}
                                            {nTr < 4 && (
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/80 bg-amber-300/10 rounded px-1.5 py-0.5 ml-0.5">
                                                {nTr === 0 ? 'Sin traducir' : `${nTr}/4 idiomas`}
                                              </span>
                                            )}
                                          </span>
                                        </span>
                                        <span className="text-right tabular-nums flex-shrink-0">
                                          {item.samePrice || item.priceTapa === item.priceMedia ? (
                                            <span className={`block text-sm font-semibold ${item.priceTapa ? 'text-gold-soft' : 'text-white/35 italic font-normal'}`}>
                                              {eur(item.priceTapa) || 'Consultar'}
                                            </span>
                                          ) : (
                                            <>
                                              <span className="block text-sm font-semibold text-gold-soft">
                                                <span className="text-[10px] text-white/35 font-normal mr-1">T</span>
                                                {eur(item.priceTapa) || '—'}
                                              </span>
                                              <span className="block text-sm font-semibold text-gold-soft/80">
                                                <span className="text-[10px] text-white/35 font-normal mr-1">M</span>
                                                {eur(item.priceMedia) || '—'}
                                              </span>
                                            </>
                                          )}
                                        </span>
                                      </button>
                                      <EyeButton hidden={item.hidden} onToggle={() => updateItem(cat.id, item.id, { hidden: !item.hidden })} />
                                      <MoveButtons
                                        first={ii === 0}
                                        last={ii === items.length - 1}
                                        onUp={() => moveItem(cat.id, item.id, -1)}
                                        onDown={() => moveItem(cat.id, item.id, 1)}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              closeEditor()
                              addItem(cat.id)
                            }}
                            className="w-full px-4 py-3 text-sm text-gold/70 hover:text-gold hover:bg-white/[0.02] transition text-left border-t border-white/[0.05]"
                          >
                            + Añadir plato
                          </button>
                        </div>
                      )}
                    </section>
                  )
                })}

                <button
                  type="button"
                  onClick={addCategory}
                  className="w-full py-4 rounded-2xl border border-dashed border-white/15 text-sm text-white/45 hover:border-gold/40 hover:text-gold transition"
                >
                  + Añadir sección
                </button>
              </div>
            )}

            {/* ─── wine categories ─── */}
            {view === 'vinos' && (
              <div className="space-y-3">
                {wineCats.map((cat, ci) => {
                  const open = openCats.includes(cat.id)
                  const items = [...cat.items].sort(byOrder)
                  return (
                    <section key={cat.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <span className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-xl">🍷</span>
                        <input
                          value={cat.name}
                          onChange={(e) => updateWineCat(cat.id, { name: e.target.value })}
                          className="flex-1 min-w-0 bg-transparent font-display text-[1.35rem] font-semibold text-white focus:outline-none border-b border-transparent focus:border-gold/50 transition"
                          aria-label="Denominación"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCats((o) => toggleIn(o, cat.id))
                            if (open && editing?.catId === cat.id) closeEditor()
                          }}
                          className="flex items-center gap-1.5 pl-2 pr-1 py-2 text-white/45 hover:text-white transition"
                          aria-expanded={open}
                        >
                          {cat.hidden && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 bg-white/10 rounded px-1.5 py-0.5">Oculta</span>
                          )}
                          <span className="text-xs tabular-nums">{cat.items.length}</span>
                          <Chevron open={open} />
                        </button>
                      </div>

                      {open && (
                        <div className="animate-fade-in">
                          <div className="flex flex-wrap items-center gap-1 px-2 pb-2 border-b border-white/[0.06]">
                            <SmallBtn onClick={() => moveWineCategory(cat.id, -1)} disabled={ci === 0}>↑ Subir</SmallBtn>
                            <SmallBtn onClick={() => moveWineCategory(cat.id, 1)} disabled={ci === wineCats.length - 1}>↓ Bajar</SmallBtn>
                            <SmallBtn onClick={() => setTrCats((o) => toggleIn(o, cat.id))}>
                              🌍 Traducir <span className="text-white/35">{translatedCount(cat.nameI18n)}/4</span>
                            </SmallBtn>
                            <SmallBtn onClick={() => updateWineCat(cat.id, { hidden: !cat.hidden })}>
                              {cat.hidden ? '👁 Mostrar' : 'Ocultar'}
                            </SmallBtn>
                            <div className="flex-1" />
                            <SmallBtn danger onClick={() => removeWineCategory(cat)}>Eliminar</SmallBtn>
                          </div>

                          {trCats.includes(cat.id) && (
                            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.015] animate-fade-in">
                              <TranslationFields value={cat.nameI18n} onChange={(nameI18n) => updateWineCat(cat.id, { nameI18n })} />
                            </div>
                          )}

                          <div className="divide-y divide-white/[0.05]">
                            {items.map((wine, wi) => {
                              const isEditing = editing?.kind === 'wine' && editing.catId === cat.id && editing.itemId === wine.id
                              return (
                                <div key={wine.id} className={`px-4 transition-colors ${isEditing ? 'bg-gold/[0.05] py-3' : 'hover:bg-white/[0.02]'}`}>
                                  {isEditing ? (
                                    <WineEditor
                                      wine={wine}
                                      onChange={(patch) => updateWine(cat.id, wine.id, patch)}
                                      onDelete={() => {
                                        if (!wine.name.trim() || confirm(`¿Eliminar «${wine.name}»?`)) {
                                          removeWine(cat.id, wine.id)
                                          setEditing(null)
                                        }
                                      }}
                                      onDone={closeEditor}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          closeEditor()
                                          setEditing({ kind: 'wine', catId: cat.id, itemId: wine.id })
                                        }}
                                        className={`flex-1 min-w-0 flex items-center gap-3 py-3 text-left transition-opacity ${wine.hidden ? 'opacity-45' : ''}`}
                                      >
                                        <span className="flex-1 min-w-0 text-sm text-white/90">
                                          {wine.hidden && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 bg-white/10 rounded px-1.5 py-0.5 mr-1.5 align-middle">Oculto</span>
                                          )}
                                          {wine.name || <em className="text-white/30">Sin nombre</em>}
                                          {wine.year && <span className="text-white/35 text-xs ml-1.5">{wine.year}</span>}
                                        </span>
                                        <span className="text-right tabular-nums flex-shrink-0 text-sm">
                                          <span className="block font-semibold text-gold-soft">
                                            <span className="text-[10px] text-white/35 font-normal mr-1">copa</span>
                                            {eur(wine.priceCopa) || '—'}
                                          </span>
                                          <span className="block font-semibold text-gold-soft/80">
                                            <span className="text-[10px] text-white/35 font-normal mr-1">bot.</span>
                                            {eur(wine.priceBottle) || '—'}
                                          </span>
                                        </span>
                                      </button>
                                      <EyeButton hidden={wine.hidden} onToggle={() => updateWine(cat.id, wine.id, { hidden: !wine.hidden })} />
                                      <MoveButtons
                                        first={wi === 0}
                                        last={wi === items.length - 1}
                                        onUp={() => moveWine(cat.id, wine.id, -1)}
                                        onDown={() => moveWine(cat.id, wine.id, 1)}
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              closeEditor()
                              addWine(cat.id)
                            }}
                            className="w-full px-4 py-3 text-sm text-gold/70 hover:text-gold hover:bg-white/[0.02] transition text-left border-t border-white/[0.05]"
                          >
                            + Añadir vino
                          </button>
                        </div>
                      )}
                    </section>
                  )
                })}

                <button
                  type="button"
                  onClick={addWineCategory}
                  className="w-full py-4 rounded-2xl border border-dashed border-white/15 text-sm text-white/45 hover:border-gold/40 hover:text-gold transition"
                >
                  + Añadir denominación
                </button>
              </div>
            )}

            {/* ─── advanced (hidden reset) ─── */}
            <section className="pt-6">
              <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                className="mx-auto flex items-center gap-2 text-xs text-white/35 hover:text-white/65 transition px-3 py-2"
                aria-expanded={advanced}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Opciones avanzadas
                <Chevron open={advanced} className="w-3 h-3" />
              </button>

              {advanced && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-white">Carta de fábrica</p>
                    <p className="text-xs text-white/45 mt-1 leading-relaxed">
                      Es la carta que se pone al pulsar «Restablecer». Guarda aquí la carta actual cuando esté como quieres
                      tenerla de base. Las dos opciones piden contraseña.
                    </p>
                    <p className="text-[11px] text-white/35 mt-2">
                      {factorySavedAt ? `Carta de fábrica guardada el ${fmtDate(factorySavedAt)}` : 'Aún no has guardado ninguna: se usa la que viene con la web.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPwAction('factory')}
                        disabled={dirty}
                        className="px-4 py-2 rounded-xl border border-gold/40 text-gold-soft text-sm font-semibold hover:bg-gold/10 transition disabled:opacity-35"
                      >
                        Guardar carta de fábrica
                      </button>
                      <button
                        type="button"
                        onClick={() => setPwAction('reset')}
                        className="px-4 py-2 rounded-xl border border-red-400/40 text-red-200 text-sm font-semibold hover:bg-red-500/10 transition"
                      >
                        Restablecer
                      </button>
                    </div>
                    {dirty && <p className="text-[11px] text-amber-200/80 mt-2">Para guardar la carta de fábrica, pulsa antes «Guardar carta».</p>}
                    {factoryMsg && <p className="text-xs text-gold-soft/80 mt-2">{factoryMsg}</p>}
                  </div>
                  <div className="flex justify-center">
                    <SmallBtn
                      onClick={() => {
                        localStorage.removeItem('menu-admin')
                        setAuthed(false)
                      }}
                    >
                      Cerrar sesión
                    </SmallBtn>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ─── big save button, always visible ─── */}
      {menu && loadState === 'ready' && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-[#021530] via-[#021530]/90 to-transparent pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              onClick={save}
              disabled={saving}
              className={`w-full py-4 text-base tracking-wide rounded-2xl ${
                saved ? 'bg-emerald-500 text-white font-bold shadow-lg' : goldBtn
              }`}
            >
              {saving ? 'Guardando…' : saved ? '✓ Carta guardada' : dirty ? '● Guardar cambios' : 'Guardar carta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
