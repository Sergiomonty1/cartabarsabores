'use client'

import React, { useEffect, useMemo, useState } from 'react'

/**
 * Contador para menús de grupo, mesa por mesa.
 * - Cada mesa lleva sus personas, sus solomillos (por salsa, en el plato o aparte, y especiales con nota) y sus merluzas.
 * - El solomillo se cuenta solo al sumar su salsa o «sin salsa».
 * - Arriba se ve el total del menú; el resumen para cocina da el total y el desglose por mesa.
 * Se guarda en este móvil para no perder la cuenta.
 */

const SAUCES = [
  { id: 'sin', name: 'Sin salsa', side: false },
  { id: 'carbonara', name: 'Carbonara', side: true },
  { id: 'whisky', name: 'Whisky', side: true },
  { id: 'brava', name: 'Brava', side: true },
  { id: 'mojo', name: 'Mojo picón', side: true },
] as const
type Sauce = (typeof SAUCES)[number]

type Special = { id: string; note: string; n: number }
type Table = { id: string; name: string; people: number; counts: Record<string, number>; specials: Special[] }
type State = { tables: Table[]; active: string }

const STORAGE_KEY = 'sabores-menu-grupo-v1'
const newTable = (n: number): Table => ({ id: `${Date.now()}-${n}`, name: `Mesa ${n}`, people: 0, counts: {}, specials: [] })
const fresh = (): State => {
  const t = newTable(1)
  return { tables: [t], active: t.id }
}

function readSpecials(x: any): Special[] {
  return Array.isArray(x) ? x.map((s: any, i: number) => ({ id: String(s.id ?? i), note: String(s.note ?? ''), n: Number(s.n) || 0 })) : []
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh()
    const s = JSON.parse(raw)
    if (Array.isArray(s.tables) && s.tables.length) {
      const tables: Table[] = s.tables.map((t: any, i: number) => ({
        id: String(t.id ?? i),
        name: String(t.name ?? `Mesa ${i + 1}`),
        people: Number(t.people) || 0,
        counts: t.counts && typeof t.counts === 'object' ? t.counts : {},
        specials: readSpecials(t.specials),
      }))
      return { tables, active: tables.some((t) => t.id === s.active) ? s.active : tables[0].id }
    }
    // Versión anterior (sin mesas): todo pasa a la «Mesa 1»
    const counts = s.counts && typeof s.counts === 'object' ? { ...s.counts } : {}
    delete counts.solomillo
    const t: Table = { ...newTable(1), people: Number(s.people) || 0, counts, specials: readSpecials(s.specials) }
    return { tables: [t], active: t.id }
  } catch {
    return fresh()
  }
}

/* ─── Cuentas ─── */
const cnt = (t: Table, key: string) => t.counts[key] ?? 0
const sauceTotal = (t: Table, s: Sauce) => cnt(t, `s:${s.id}`) + (s.side ? cnt(t, `a:${s.id}`) : 0)
const specialsTotal = (t: Table) => t.specials.reduce((n, s) => n + s.n, 0)
const solomillosOf = (t: Table) => SAUCES.reduce((n, s) => n + sauceTotal(t, s), 0) + specialsTotal(t)
const merluzasOf = (t: Table) => cnt(t, 'merluza')

/** Suma de todas las mesas, como si fuera una sola. */
function combine(tables: Table[]): Table {
  const counts: Record<string, number> = {}
  const specials = new Map<string, number>()
  let people = 0
  for (const t of tables) {
    people += t.people
    for (const [k, v] of Object.entries(t.counts)) counts[k] = (counts[k] ?? 0) + (Number(v) || 0)
    for (const sp of t.specials) {
      if (!sp.n) continue
      const key = sp.note.trim() || 'Especial'
      specials.set(key, (specials.get(key) ?? 0) + sp.n)
    }
  }
  return { id: 'total', name: 'Total', people, counts, specials: Array.from(specials).map(([note, n], i) => ({ id: String(i), note, n })) }
}

function dishLines(t: Table): string[] {
  const lines: string[] = []
  const sol = solomillosOf(t)
  if (sol) {
    lines.push(`Solomillo: ${sol}`)
    for (const s of SAUCES) {
      const total = sauceTotal(t, s)
      if (!total) continue
      const side = s.side ? cnt(t, `a:${s.id}`) : 0
      lines.push(`  · ${s.name}: ${total}${side ? ` (${side === total ? 'aparte' : `${side} aparte`})` : ''}`)
    }
    for (const sp of t.specials) if (sp.n) lines.push(`  · ${sp.note.trim() || 'Especial'}: ${sp.n}`)
  }
  if (merluzasOf(t)) lines.push(`Merluza: ${merluzasOf(t)}`)
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

/* ─── Pantalla ─── */
export default function GroupMenuCounter({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>(fresh)
  const [ready, setReady] = useState(false)
  const [history, setHistory] = useState<State[]>([])
  const [confirm, setConfirm] = useState<'' | 'reset' | 'table'>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setState(load())
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* sin almacenamiento: sigue funcionando en memoria */
    }
  }, [state, ready])
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
    lines.push(...dishLines(total))
    if (multi) {
      for (const t of state.tables) {
        const body = dishLines(t)
        if (!body.length && !t.people) continue
        lines.push('', `${t.name.toUpperCase()}${t.people ? ` · ${t.people} personas` : ''}`, ...(body.length ? body : ['(sin pedir)']))
      }
    }
    return lines.join('\n')
  }, [state.tables, total, multi])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  }

  const tSol = solomillosOf(table)
  const tMer = merluzasOf(table)
  const allSol = solomillosOf(total)
  const allMer = merluzasOf(total)

  return (
    <div className="fixed inset-0 z-[100] bg-[#021530] overflow-y-auto overscroll-contain animate-fade-in" role="dialog" aria-modal="true" aria-label="Menú de grupo">
      <header className="sticky top-0 z-10 bg-[#021530] border-b border-white/[0.07]">
        <div className="max-w-lg mx-auto px-4 pt-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-semibold leading-none">Menú de grupo</p>
            <p className="text-[11px] text-white/45 mt-1 tabular-nums leading-snug">
              Total: {allSol + allMer}
              {total.people ? ` de ${total.people}` : ''} · {allSol} solomillo{allSol === 1 ? '' : 's'} · {allMer} merluza{allMer === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!history.length) return
              setState(history[history.length - 1])
              setHistory((h) => h.slice(0, -1))
              setConfirm('')
            }}
            disabled={!history.length}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 text-white/75 disabled:opacity-30 active:scale-95 transition"
          >
            ↶ Deshacer
          </button>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-10 h-10 rounded-xl border border-white/10 text-white/70 text-lg active:scale-95 transition">
            ✕
          </button>
        </div>

        {/* Mesas */}
        <div className="max-w-lg mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Mesas">
          {state.tables.map((t) => {
            const on = t.id === table.id
            const done = solomillosOf(t) + merluzasOf(t)
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
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-16">
        {/* Mesa activa: nombre y personas */}
        <Card title={multi ? 'Esta mesa' : 'Personas'} aside={<PeopleBadge people={table.people} ordered={tSol + tMer} />}>
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
                  className={`h-full rounded-full transition-all ${tSol + tMer > table.people ? 'bg-red-400' : tSol + tMer === table.people ? 'bg-emerald-400' : 'bg-gold'}`}
                  style={{ width: `${Math.min(100, ((tSol + tMer) / table.people) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-white/55 tabular-nums">
                Pedidos {tSol + tMer} de {table.people}
              </p>
            </div>
          )}
          {multi && (
            <p className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-white/55 tabular-nums flex items-center justify-between gap-2">
              <span>
                Todo el menú: {allSol + allMer}
                {total.people ? ` de ${total.people} personas` : ' pedidos'}
              </span>
              {total.people > 0 && <PeopleBadge people={total.people} ordered={allSol + allMer} />}
            </p>
          )}
        </Card>

        {/* Solomillo: se cuenta solo con las salsas */}
        <Card title={multi ? `Solomillo · ${table.name || 'Mesa'}` : 'Solomillo'} aside={<Badge tone="gold">{tSol}</Badge>}>
          <div className="divide-y divide-white/[0.06]">
            {SAUCES.map((s) => (
              <div key={s.id} className="py-3 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base text-white/90 min-w-0">
                    {s.name}
                    {s.side && cnt(table, `a:${s.id}`) > 0 && <span className="ml-2 text-xs text-white/45 tabular-nums">total {sauceTotal(table, s)}</span>}
                  </span>
                  <Stepper label={s.side ? `${s.name} en el plato` : s.name} value={cnt(table, `s:${s.id}`)} onChange={(v) => setCount(`s:${s.id}`, v)} />
                </div>
                {s.side && (
                  <div className="mt-2 flex items-center justify-between gap-3 pl-3 border-l border-gold/20">
                    <span className="text-xs text-white/50">Aparte</span>
                    <Stepper size="sm" label={`${s.name} aparte`} value={cnt(table, `a:${s.id}`)} onChange={(v) => setCount(`a:${s.id}`, v)} />
                  </div>
                )}
              </div>
            ))}

            {/* Especiales: con algo diferente */}
            <div className="pt-3">
              <p className="text-base text-white/90">Especial / con algo diferente</p>
              <p className="text-[11px] text-white/40 mt-0.5">Apunta qué lleva: «poco hecho», «sin sal», «salsa de setas aparte»…</p>
              <div className="mt-2 space-y-2">
                {table.specials.map((sp) => (
                  <div key={sp.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={sp.note}
                        onChange={(e) => setSpecial(sp.id, { note: e.target.value }, false)}
                        placeholder="¿Qué lleva diferente?"
                        aria-label="Nota del solomillo especial"
                        className="flex-1 min-w-0 rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60"
                      />
                      <button
                        type="button"
                        onClick={() => patchTable({ specials: table.specials.filter((x) => x.id !== sp.id) })}
                        aria-label="Quitar este especial"
                        className="w-9 h-9 rounded-lg border border-white/10 text-white/50 active:scale-95 transition flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Stepper size="sm" label={`Especial ${sp.note || ''}`.trim()} value={sp.n} onChange={(v) => setSpecial(sp.id, { n: v })} />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => patchTable({ specials: [...table.specials, { id: String(Date.now()), note: '', n: 1 }] })}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-gold/35 text-sm font-semibold text-gold-soft active:scale-[0.99] transition"
              >
                + Añadir solomillo especial
              </button>
            </div>
          </div>
        </Card>

        {/* Merluza */}
        <Card title={multi ? `Merluza · ${table.name || 'Mesa'}` : 'Merluza'}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg text-white/90">Merluza</span>
            <Stepper label="Merluza" value={tMer} onChange={(v) => setCount('merluza', v)} />
          </div>
        </Card>

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
          {confirm === 'reset' ? '¿Seguro? Pulsa otra vez para empezar de cero' : 'Empezar un menú nuevo'}
        </button>
      </div>
    </div>
  )
}
