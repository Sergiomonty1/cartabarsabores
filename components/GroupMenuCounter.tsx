'use client'

import React, { useEffect, useMemo, useState } from 'react'

/**
 * Contador para menús de grupo, mesa por mesa.
 * - Los platos del menú se pueden cambiar (✏️ Platos): nombre, opciones (salsas, guarniciones…) y si una opción puede ir aparte.
 * - Un plato con opciones se cuenta solo al sumar sus opciones; uno sin opciones tiene su propio contador.
 * - Cada plato admite «especiales» con una nota («poco hecho», «sin sal»…).
 * - Arriba se ve el total del menú; el resumen para cocina da el total y el desglose por mesa.
 * La cuenta y los platos se guardan en este móvil. Al empezar un menú nuevo se mantienen los platos.
 */

type Option = { id: string; name: string; side: boolean }
type Dish = { id: string; name: string; options: Option[] }
type Special = { id: string; dishId: string; note: string; n: number }
type Table = { id: string; name: string; people: number; counts: Record<string, number>; specials: Special[] }
type State = { tables: Table[]; active: string }

const STORAGE_KEY = 'sabores-menu-grupo-v1'
const DISHES_KEY = 'sabores-menu-platos-v1'

const DEFAULT_DISHES: Dish[] = [
  {
    id: 'solomillo',
    name: 'Solomillo',
    options: [
      { id: 'sin', name: 'Sin salsa', side: false },
      { id: 'carbonara', name: 'Carbonara', side: true },
      { id: 'whisky', name: 'Whisky', side: true },
      { id: 'brava', name: 'Brava', side: true },
      { id: 'mojo', name: 'Mojo picón', side: true },
    ],
  },
  { id: 'merluza', name: 'Merluza', options: [] },
]

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const newTable = (n: number): Table => ({ id: `${Date.now()}-${n}`, name: `Mesa ${n}`, people: 0, counts: {}, specials: [] })
const fresh = (): State => {
  const t = newTable(1)
  return { tables: [t], active: t.id }
}

/* ─── Carga (con paso de las versiones anteriores, que solo tenían solomillo y merluza) ─── */
function migrateCounts(counts: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(counts ?? {})) {
    if (k === 'solomillo') continue // la versión primera sumaba el solomillo a mano
    out[/^[sa]:/.test(k) ? `solomillo:${k}` : k] = Number(v) || 0
  }
  return out
}
function readSpecials(x: any): Special[] {
  return Array.isArray(x)
    ? x.map((s: any, i: number) => ({ id: String(s.id ?? i), dishId: String(s.dishId ?? 'solomillo'), note: String(s.note ?? ''), n: Number(s.n) || 0 }))
    : []
}
function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh()
    const s = JSON.parse(raw)
    if (Array.isArray(s.tables) && s.tables.length) {
      const tables: Table[] = s.tables.map((t: any, i: number) => ({
        id: String(t.id ?? i),
        name: String(t.name ?? `Mesa ${i + 1}`),
        people: Number(t.people) || 0,
        counts: migrateCounts(t.counts),
        specials: readSpecials(t.specials),
      }))
      return { tables, active: tables.some((t) => t.id === s.active) ? s.active : tables[0].id }
    }
    const t: Table = { ...newTable(1), people: Number(s.people) || 0, counts: migrateCounts(s.counts), specials: readSpecials(s.specials) }
    return { tables: [t], active: t.id }
  } catch {
    return fresh()
  }
}
function loadDishes(): Dish[] {
  try {
    const raw = localStorage.getItem(DISHES_KEY)
    if (!raw) return DEFAULT_DISHES
    const d = JSON.parse(raw)
    if (!Array.isArray(d)) return DEFAULT_DISHES
    return d.map((x: any, i: number) => ({
      id: String(x.id ?? `plato-${i}`),
      name: String(x.name ?? ''),
      options: Array.isArray(x.options) ? x.options.map((o: any, j: number) => ({ id: String(o.id ?? `op-${j}`), name: String(o.name ?? ''), side: !!o.side })) : [],
    }))
  } catch {
    return DEFAULT_DISHES
  }
}

/* ─── Cuentas ─── */
const cnt = (t: Table, key: string) => t.counts[key] ?? 0
const optTotal = (t: Table, d: Dish, o: Option) => cnt(t, `${d.id}:s:${o.id}`) + (o.side ? cnt(t, `${d.id}:a:${o.id}`) : 0)
const specialsOf = (t: Table, d: Dish) => t.specials.filter((s) => s.dishId === d.id)
const dishTotal = (t: Table, d: Dish) =>
  (d.options.length ? d.options.reduce((n, o) => n + optTotal(t, d, o), 0) : cnt(t, d.id)) + specialsOf(t, d).reduce((n, s) => n + s.n, 0)
const orderedOf = (t: Table, dishes: Dish[]) => dishes.reduce((n, d) => n + dishTotal(t, d), 0)

/** Suma de todas las mesas, como si fuera una sola. */
function combine(tables: Table[]): Table {
  const counts: Record<string, number> = {}
  const specials = new Map<string, Special>()
  let people = 0
  for (const t of tables) {
    people += t.people
    for (const [k, v] of Object.entries(t.counts)) counts[k] = (counts[k] ?? 0) + (Number(v) || 0)
    for (const sp of t.specials) {
      if (!sp.n) continue
      const key = `${sp.dishId}|${sp.note.trim() || 'Especial'}`
      const prev = specials.get(key)
      specials.set(key, { id: key, dishId: sp.dishId, note: sp.note.trim() || 'Especial', n: (prev?.n ?? 0) + sp.n })
    }
  }
  return { id: 'total', name: 'Total', people, counts, specials: Array.from(specials.values()) }
}

function dishLines(t: Table, dishes: Dish[]): string[] {
  const lines: string[] = []
  for (const d of dishes) {
    const total = dishTotal(t, d)
    if (!total) continue
    lines.push(`${d.name.trim() || 'Plato'}: ${total}`)
    for (const o of d.options) {
      const n = optTotal(t, d, o)
      if (!n) continue
      const side = o.side ? cnt(t, `${d.id}:a:${o.id}`) : 0
      lines.push(`  · ${o.name.trim() || 'Opción'}: ${n}${side ? ` (${side === n ? 'aparte' : `${side} aparte`})` : ''}`)
    }
    for (const sp of specialsOf(t, d)) if (sp.n) lines.push(`  · ${sp.note.trim() || 'Especial'}: ${sp.n}`)
  }
  return lines
}

/* ─── Piezas de interfaz ─── */
function Stepper({ value, onChange, size = 'lg', label }: { value: number; onChange: (v: number) => void; size?: 'lg' | 'sm'; label: string }) {
  const btn = size === 'lg' ? 'w-12 h-12 text-2xl rounded-2xl' : 'w-9 h-9 text-lg rounded-xl'
  return (
    <div className="flex items-center gap-2 flex-shrink-0" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        aria-label={`Quitar uno: ${label}`}
        className={`${btn} flex items-center justify-center border border-white/10 bg-white/[0.04] text-white/80 active:scale-95 transition disabled:opacity-25`}
      >
        −
      </button>
      <span className={`${size === 'lg' ? 'w-12 text-3xl' : 'w-9 text-xl'} text-center font-display font-semibold tabular-nums text-white`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Añadir uno: ${label}`}
        className={`${btn} flex items-center justify-center border border-gold/40 bg-gold/[0.14] text-gold-soft font-semibold active:scale-95 transition`}
      >
        +
      </button>
    </div>
  )
}

function Card({ title, aside, children }: { title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold/80 min-w-0 truncate">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted' | 'gold'; children: React.ReactNode }) {
  const cls = {
    ok: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/25',
    warn: 'text-amber-200 bg-amber-300/10 border-amber-200/25',
    bad: 'text-red-300 bg-red-400/10 border-red-300/25',
    muted: 'text-white/50 bg-white/[0.04] border-white/10',
    gold: 'text-gold-soft bg-gold/10 border-gold/30',
  }[tone]
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap tabular-nums ${cls}`}>{children}</span>
}

function PeopleBadge({ people, ordered }: { people: number; ordered: number }) {
  if (!people) return <Badge tone="muted">Pon cuántos son</Badge>
  const missing = people - ordered
  if (missing > 0) return <Badge tone="warn">Faltan {missing}</Badge>
  if (missing < 0) return <Badge tone="bad">Sobran {-missing}</Badge>
  return <Badge tone="ok">Completo ✓</Badge>
}

const fieldCls =
  'flex-1 min-w-0 rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60'
const iconBtn = 'w-9 h-9 flex-shrink-0 rounded-lg border border-white/10 text-white/55 active:scale-95 transition disabled:opacity-25'

/* ─── Editor de los platos del menú ─── */
function DishesEditor({ dishes, onChange, onDone }: { dishes: Dish[]; onChange: (d: Dish[]) => void; onDone: () => void }) {
  const [confirm, setConfirm] = useState('')
  const set = (id: string, patch: Partial<Dish>) => onChange(dishes.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= dishes.length) return
    const next = [...dishes]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const del = (id: string) => {
    if (confirm !== id) return setConfirm(id)
    setConfirm('')
    onChange(dishes.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/55 leading-relaxed">
        Pon los platos de este menú. Si un plato tiene <strong className="text-white/80">opciones</strong> (salsas, guarnición…), se cuenta solo al sumar sus opciones;
        si no tiene, lleva su propio contador. Marca <strong className="text-white/80">Aparte</strong> en las opciones que se pueden servir aparte.
      </p>
      {dishes.map((d, i) => (
        <div key={d.id} className="rounded-2xl border border-white/[0.1] bg-white/[0.035] p-3">
          <div className="flex items-center gap-1.5">
            <input value={d.name} onChange={(e) => set(d.id, { name: e.target.value })} placeholder="Nombre del plato" aria-label="Nombre del plato" className={`${fieldCls} font-semibold text-base`} />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir plato" className={iconBtn}>
              ↑
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === dishes.length - 1} aria-label="Bajar plato" className={iconBtn}>
              ↓
            </button>
            <button
              type="button"
              onClick={() => del(d.id)}
              className={`flex-shrink-0 h-9 px-2.5 rounded-lg border text-xs font-semibold transition active:scale-95 ${
                confirm === d.id ? 'border-red-300/50 bg-red-500/15 text-red-200' : 'border-white/10 text-white/50'
              }`}
            >
              {confirm === d.id ? '¿Borrar?' : '✕'}
            </button>
          </div>

          <div className="mt-2.5 pl-2 border-l border-gold/20 space-y-1.5">
            {d.options.map((o) => (
              <div key={o.id} className="flex items-center gap-1.5">
                <input
                  value={o.name}
                  onChange={(e) => set(d.id, { options: d.options.map((x) => (x.id === o.id ? { ...x, name: e.target.value } : x)) })}
                  placeholder="Opción (ej.: Carbonara)"
                  aria-label="Nombre de la opción"
                  className={fieldCls}
                />
                <button
                  type="button"
                  onClick={() => set(d.id, { options: d.options.map((x) => (x.id === o.id ? { ...x, side: !x.side } : x)) })}
                  aria-pressed={o.side}
                  title="Se puede servir aparte"
                  className={`flex-shrink-0 h-9 px-2.5 rounded-lg border text-[11px] font-semibold transition active:scale-95 ${
                    o.side ? 'border-gold/45 bg-gold/[0.14] text-gold-soft' : 'border-white/10 text-white/40'
                  }`}
                >
                  {o.side ? '✓ Aparte' : 'Aparte'}
                </button>
                <button
                  type="button"
                  onClick={() => set(d.id, { options: d.options.filter((x) => x.id !== o.id) })}
                  aria-label="Quitar opción"
                  className={iconBtn}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set(d.id, { options: [...d.options, { id: uid('op'), name: '', side: false }] })}
              className="text-xs font-semibold text-gold-soft/90 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition"
            >
              + Añadir opción
            </button>
            {!d.options.length && <p className="text-[11px] text-white/35 pl-2">Sin opciones: tendrá su propio contador.</p>}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...dishes, { id: uid('plato'), name: '', options: [] }])}
        className="w-full py-3 rounded-2xl border border-dashed border-gold/40 text-sm font-semibold text-gold-soft active:scale-[0.99] transition"
      >
        + Añadir plato
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_DISHES)}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/50 active:scale-[0.99] transition"
        >
          Volver a solomillo y merluza
        </button>
        <button type="button" onClick={onDone} className="flex-1 py-2.5 rounded-xl bg-gold text-[#021530] text-sm font-bold active:scale-[0.99] transition">
          Listo
        </button>
      </div>
    </div>
  )
}

/* ─── Pantalla ─── */
export default function GroupMenuCounter({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>(fresh)
  const [dishes, setDishes] = useState<Dish[]>(DEFAULT_DISHES)
  const [ready, setReady] = useState(false)
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState<State[]>([])
  const [confirm, setConfirm] = useState<'' | 'reset' | 'table'>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setState(loadState())
    setDishes(loadDishes())
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      localStorage.setItem(DISHES_KEY, JSON.stringify(dishes))
    } catch {
      /* sin almacenamiento: sigue funcionando en memoria */
    }
  }, [state, dishes, ready])
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const table = state.tables.find((t) => t.id === state.active) ?? state.tables[0]
  const total = useMemo(() => combine(state.tables), [state.tables])
  const multi = state.tables.length > 1

  const update = (next: State) => {
    setHistory((h) => [...h.slice(-49), state])
    setState(next)
    setConfirm('')
  }
  const patchTable = (patch: Partial<Table>, record = true) => {
    const next = { ...state, tables: state.tables.map((t) => (t.id === table.id ? { ...t, ...patch } : t)) }
    if (record) update(next)
    else setState(next)
  }
  const setCount = (key: string, v: number) => patchTable({ counts: { ...table.counts, [key]: v } })
  const setSpecial = (id: string, patch: Partial<Special>, record = true) =>
    patchTable({ specials: table.specials.map((s) => (s.id === id ? { ...s, ...patch } : s)) }, record)

  const addTable = () => {
    const used = new Set(state.tables.map((t) => t.name))
    let n = state.tables.length + 1
    while (used.has(`Mesa ${n}`)) n++
    const t = newTable(n)
    update({ tables: [...state.tables, t], active: t.id })
  }
  const removeTable = () => {
    if (confirm !== 'table') return setConfirm('table')
    const rest = state.tables.filter((t) => t.id !== table.id)
    if (!rest.length) return update(fresh())
    update({ tables: rest, active: rest[Math.max(0, state.tables.indexOf(table) - 1)].id })
  }

  const summary = useMemo(() => {
    const lines: string[] = [`MENÚ · ${total.people} personas${multi ? ` · ${state.tables.length} mesas` : ''}`]
    if (multi) lines.push('', 'TOTAL')
    lines.push(...dishLines(total, dishes))
    if (multi) {
      for (const t of state.tables) {
        const body = dishLines(t, dishes)
        if (!body.length && !t.people) continue
        lines.push('', `${t.name.toUpperCase()}${t.people ? ` · ${t.people} personas` : ''}`, ...(body.length ? body : ['(sin pedir)']))
      }
    }
    return lines.join('\n')
  }, [state.tables, total, multi, dishes])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  }

  const tOrdered = orderedOf(table, dishes)
  const allOrdered = orderedOf(total, dishes)
  const tableLabel = table.name || 'Mesa'

  return (
    <div className="fixed inset-0 z-[100] bg-[#021530] overflow-y-auto overscroll-contain animate-fade-in" role="dialog" aria-modal="true" aria-label="Menú de grupo">
      <header className="sticky top-0 z-10 bg-[#021530] border-b border-white/[0.07]">
        <div className="max-w-lg mx-auto px-4 pt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-semibold leading-none">Menú de grupo</p>
            <p className="text-[11px] text-white/45 mt-1 tabular-nums leading-snug">
              Total: {allOrdered}
              {total.people ? ` de ${total.people}` : ''}
              {dishes.map((d) => ` · ${dishTotal(total, d)} ${d.name.trim().toLowerCase() || 'plato'}`).join('')}
            </p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-gold/30 text-gold-soft active:scale-95 transition"
            >
              ✏️ Platos
            </button>
          )}
          {!editing && (
            <button
              type="button"
              onClick={() => {
                if (!history.length) return
                setState(history[history.length - 1])
                setHistory((h) => h.slice(0, -1))
                setConfirm('')
              }}
              disabled={!history.length}
              aria-label="Deshacer"
              className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-white/10 text-white/75 disabled:opacity-30 active:scale-95 transition"
            >
              ↶
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-10 h-10 rounded-xl border border-white/10 text-white/70 text-lg active:scale-95 transition">
            ✕
          </button>
        </div>

        {/* Mesas */}
        {!editing && (
          <div className="max-w-lg mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Mesas">
            {state.tables.map((t) => {
              const on = t.id === table.id
              const done = orderedOf(t, dishes)
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setState((s) => ({ ...s, active: t.id }))}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition active:scale-95 ${
                    on ? 'bg-gold text-[#021530] border-gold' : 'border-white/15 bg-white/[0.04] text-white/75'
                  }`}
                >
                  {t.name || 'Mesa'}
                  <span className={`ml-1.5 text-[11px] font-medium tabular-nums ${on ? 'text-[#021530]/70' : 'text-white/45'}`}>
                    {done}
                    {t.people ? `/${t.people}` : ''}
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={addTable}
              className="flex-shrink-0 px-3.5 py-2 rounded-xl border border-dashed border-gold/40 text-sm font-semibold text-gold-soft whitespace-nowrap active:scale-95 transition"
            >
              + Mesa
            </button>
          </div>
        )}
        {editing && <p className="max-w-lg mx-auto px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">Platos del menú</p>}
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-16">
        {editing ? (
          <DishesEditor dishes={dishes} onChange={setDishes} onDone={() => setEditing(false)} />
        ) : (
          <>
            {/* Mesa activa: nombre y personas */}
            <Card title={multi ? 'Esta mesa' : 'Personas'} aside={<PeopleBadge people={table.people} ordered={tOrdered} />}>
              {multi && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={table.name}
                    onChange={(e) => patchTable({ name: e.target.value }, false)}
                    aria-label="Nombre de la mesa"
                    placeholder="Mesa"
                    className="flex-1 min-w-0 rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2 text-base font-semibold text-white focus:outline-none focus:border-gold/60"
                  />
                  <button
                    type="button"
                    onClick={removeTable}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                      confirm === 'table' ? 'border-red-300/50 bg-red-500/15 text-red-200' : 'border-white/10 text-white/50'
                    }`}
                  >
                    {confirm === 'table' ? '¿Borrar? Pulsa otra vez' : 'Borrar mesa'}
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={table.people || ''}
                  placeholder="0"
                  onChange={(e) => patchTable({ people: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  className="w-28 rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2 text-center font-display text-4xl font-semibold text-white tabular-nums focus:outline-none focus:border-gold/60"
                  aria-label="Personas de esta mesa"
                />
                <Stepper label="Personas" value={table.people} onChange={(v) => patchTable({ people: v })} />
              </div>
              {table.people > 0 && (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${tOrdered > table.people ? 'bg-red-400' : tOrdered === table.people ? 'bg-emerald-400' : 'bg-gold'}`}
                      style={{ width: `${Math.min(100, (tOrdered / table.people) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-white/55 tabular-nums">
                    Pedidos {tOrdered} de {table.people}
                  </p>
                </div>
              )}
              {multi && (
                <p className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-white/55 tabular-nums flex items-center justify-between gap-2">
                  <span>
                    Todo el menú: {allOrdered}
                    {total.people ? ` de ${total.people} personas` : ' pedidos'}
                  </span>
                  {total.people > 0 && <PeopleBadge people={total.people} ordered={allOrdered} />}
                </p>
              )}
            </Card>

            {!dishes.length && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full py-4 rounded-2xl border border-dashed border-gold/40 text-sm font-semibold text-gold-soft"
              >
                Este menú no tiene platos. Pulsa para añadirlos.
              </button>
            )}

            {/* Un bloque por plato */}
            {dishes.map((d) => {
              const name = d.name.trim() || 'Plato'
              const specials = specialsOf(table, d)
              return (
                <Card key={d.id} title={multi ? `${name} · ${tableLabel}` : name} aside={<Badge tone="gold">{dishTotal(table, d)}</Badge>}>
                  <div className="divide-y divide-white/[0.06]">
                    {d.options.length === 0 && (
                      <div className="flex items-center justify-between gap-3 pb-3">
                        <span className="text-lg text-white/90">{name}</span>
                        <Stepper label={name} value={cnt(table, d.id)} onChange={(v) => setCount(d.id, v)} />
                      </div>
                    )}
                    {d.options.map((o) => {
                      const on = `${d.id}:s:${o.id}`
                      const side = `${d.id}:a:${o.id}`
                      const oname = o.name.trim() || 'Opción'
                      return (
                        <div key={o.id} className="py-3 first:pt-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-base text-white/90 min-w-0">
                              {oname}
                              {o.side && cnt(table, side) > 0 && <span className="ml-2 text-xs text-white/45 tabular-nums">total {optTotal(table, d, o)}</span>}
                            </span>
                            <Stepper label={o.side ? `${name} ${oname} en el plato` : `${name} ${oname}`} value={cnt(table, on)} onChange={(v) => setCount(on, v)} />
                          </div>
                          {o.side && (
                            <div className="mt-2 flex items-center justify-between gap-3 pl-3 border-l border-gold/20">
                              <span className="text-xs text-white/50">Aparte</span>
                              <Stepper size="sm" label={`${name} ${oname} aparte`} value={cnt(table, side)} onChange={(v) => setCount(side, v)} />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Especiales: con algo diferente */}
                    <div className="pt-3">
                      {specials.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {specials.map((sp) => (
                            <div key={sp.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
                              <div className="flex items-center gap-2">
                                <input
                                  value={sp.note}
                                  onChange={(e) => setSpecial(sp.id, { note: e.target.value }, false)}
                                  placeholder="¿Qué lleva diferente?"
                                  aria-label={`Nota del ${name} especial`}
                                  className={fieldCls}
                                />
                                <button
                                  type="button"
                                  onClick={() => patchTable({ specials: table.specials.filter((x) => x.id !== sp.id) })}
                                  aria-label="Quitar este especial"
                                  className={iconBtn}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <Stepper size="sm" label={`${name} especial ${sp.note || ''}`.trim()} value={sp.n} onChange={(v) => setSpecial(sp.id, { n: v })} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => patchTable({ specials: [...table.specials, { id: uid('esp'), dishId: d.id, note: '', n: 1 }] })}
                        className="w-full py-2 rounded-xl border border-dashed border-gold/30 text-[13px] font-semibold text-gold-soft/90 active:scale-[0.99] transition"
                      >
                        + {name} con algo diferente
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Resumen */}
            <Card
              title="Resumen para cocina"
              aside={
                <button type="button" onClick={copy} className="text-xs font-semibold text-gold-soft px-3 py-1.5 rounded-lg border border-gold/30 active:scale-95 transition">
                  {copied ? 'Copiado ✓' : 'Copiar'}
                </button>
              }
            >
              <pre className="whitespace-pre-wrap font-sans text-sm text-white/80 leading-relaxed">{summary}</pre>
            </Card>

            <button
              type="button"
              onClick={() => {
                if (confirm !== 'reset') return setConfirm('reset')
                update(fresh())
              }}
              className={`w-full py-3 rounded-2xl text-sm font-semibold border transition active:scale-[0.99] ${
                confirm === 'reset' ? 'border-red-300/50 bg-red-500/15 text-red-200' : 'border-white/10 text-white/55'
              }`}
            >
              {confirm === 'reset' ? '¿Seguro? Pulsa otra vez para empezar de cero' : 'Empezar un menú nuevo (se quedan los platos)'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
