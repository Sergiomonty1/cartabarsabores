'use client'

import React, { useEffect, useMemo, useState } from 'react'

/**
 * Contador para menús de grupo: personas, platos y salsas del solomillo (en el plato o aparte).
 * Se usa yendo mesa por mesa y sumando. Se guarda en este móvil para no perder la cuenta.
 */

const DISHES = [
  { id: 'solomillo', name: 'Solomillo' },
  { id: 'merluza', name: 'Merluza' },
] as const

const SAUCES = [
  { id: 'sin', name: 'Sin salsa', side: false },
  { id: 'carbonara', name: 'Carbonara', side: true },
  { id: 'whisky', name: 'Whisky', side: true },
  { id: 'brava', name: 'Brava', side: true },
  { id: 'mojo', name: 'Mojo picón', side: true },
] as const

type Counts = Record<string, number>
type State = { people: number; counts: Counts }

const STORAGE_KEY = 'sabores-menu-grupo-v1'
const EMPTY: State = { people: 0, counts: {} }

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const s = JSON.parse(raw)
    return { people: Number(s.people) || 0, counts: s.counts && typeof s.counts === 'object' ? s.counts : {} }
  } catch {
    return EMPTY
  }
}

function Stepper({
  value,
  onChange,
  size = 'lg',
  label,
}: {
  value: number
  onChange: (v: number) => void
  size?: 'lg' | 'sm'
  label: string
}) {
  const btn =
    size === 'lg'
      ? 'w-12 h-12 text-2xl rounded-2xl'
      : 'w-9 h-9 text-lg rounded-xl'
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        aria-label={`Quitar uno: ${label}`}
        className={`${btn} flex items-center justify-center border border-white/10 bg-white/[0.04] text-white/80 active:scale-95 transition disabled:opacity-25`}
      >
        −
      </button>
      <span
        className={`${size === 'lg' ? 'w-12 text-3xl' : 'w-9 text-xl'} text-center font-display font-semibold tabular-nums text-white`}
        aria-live="polite"
      >
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

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gold/80">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'muted'; children: React.ReactNode }) {
  const cls = {
    ok: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/25',
    warn: 'text-amber-200 bg-amber-300/10 border-amber-200/25',
    bad: 'text-red-300 bg-red-400/10 border-red-300/25',
    muted: 'text-white/50 bg-white/[0.04] border-white/10',
  }[tone]
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>{children}</span>
}

export default function GroupMenuCounter({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>(EMPTY)
  const [history, setHistory] = useState<State[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
  const [copied, setCopied] = useState(false)

  const [ready, setReady] = useState(false)

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

  const update = (next: State) => {
    setHistory((h) => [...h.slice(-49), state])
    setState(next)
    setConfirmReset(false)
  }
  const setCount = (key: string, v: number) => update({ ...state, counts: { ...state.counts, [key]: v } })
  const c = (key: string) => state.counts[key] ?? 0

  const ordered = DISHES.reduce((n, d) => n + c(d.id), 0)
  const missingPeople = state.people - ordered
  const solomillos = c('solomillo')
  const sauceTotal = SAUCES.reduce((n, s) => n + c(`s:${s.id}`) + (s.side ? c(`a:${s.id}`) : 0), 0)
  const missingSauces = solomillos - sauceTotal

  const summary = useMemo(() => {
    const lines: string[] = []
    lines.push(`MENÚ · ${state.people} personas`)
    for (const d of DISHES) if (c(d.id)) lines.push(`${d.name}: ${c(d.id)}`)
    const sauceLines = SAUCES.filter((s) => c(`s:${s.id}`) + (s.side ? c(`a:${s.id}`) : 0) > 0).map((s) => {
      const on = c(`s:${s.id}`)
      const side = s.side ? c(`a:${s.id}`) : 0
      const total = on + side
      return `  · ${s.name}: ${total}${side ? ` (${side} aparte)` : ''}`
    })
    if (sauceLines.length) lines.push('Salsas del solomillo:', ...sauceLines)
    return lines.join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#021530] overflow-y-auto overscroll-contain animate-fade-in" role="dialog" aria-modal="true" aria-label="Menú de grupo">
      <header className="sticky top-0 z-10 bg-[#021530] border-b border-white/[0.07]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-xl font-semibold leading-none">Menú de grupo</p>
            <p className="text-[11px] text-white/45 mt-1">Ve sumando mesa por mesa · se guarda en este móvil</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!history.length) return
              setState(history[history.length - 1])
              setHistory((h) => h.slice(0, -1))
              setConfirmReset(false)
            }}
            disabled={!history.length}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 text-white/75 disabled:opacity-30 active:scale-95 transition"
          >
            ↶ Deshacer
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-xl border border-white/10 text-white/70 text-lg active:scale-95 transition"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-16">
        {/* Personas */}
        <Card
          title="Personas"
          aside={
            state.people > 0 ? (
              missingPeople > 0 ? (
                <Badge tone="warn">Faltan {missingPeople}</Badge>
              ) : missingPeople < 0 ? (
                <Badge tone="bad">Sobran {-missingPeople}</Badge>
              ) : (
                <Badge tone="ok">Completo ✓</Badge>
              )
            ) : (
              <Badge tone="muted">Pon cuántos son</Badge>
            )
          }
        >
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={state.people || ''}
              placeholder="0"
              onChange={(e) => update({ ...state, people: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
              className="w-28 rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2 text-center font-display text-4xl font-semibold text-white tabular-nums focus:outline-none focus:border-gold/60"
              aria-label="Número de personas"
            />
            <Stepper label="Personas" value={state.people} onChange={(v) => update({ ...state, people: v })} />
          </div>
          {state.people > 0 && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${missingPeople < 0 ? 'bg-red-400' : missingPeople === 0 ? 'bg-emerald-400' : 'bg-gold'}`}
                  style={{ width: `${Math.min(100, (ordered / state.people) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-white/55 tabular-nums">
                Pedidos {ordered} de {state.people}
              </p>
            </div>
          )}
        </Card>

        {/* Platos */}
        <Card title="Platos">
          <div className="divide-y divide-white/[0.06]">
            {DISHES.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-lg text-white/90">{d.name}</span>
                <Stepper label={d.name} value={c(d.id)} onChange={(v) => setCount(d.id, v)} />
              </div>
            ))}
          </div>
        </Card>

        {/* Salsas */}
        <Card
          title="Salsas del solomillo"
          aside={
            solomillos > 0 || sauceTotal > 0 ? (
              missingSauces > 0 ? (
                <Badge tone="warn">Faltan {missingSauces}</Badge>
              ) : missingSauces < 0 ? (
                <Badge tone="bad">Sobran {-missingSauces}</Badge>
              ) : (
                <Badge tone="ok">Cuadra ✓</Badge>
              )
            ) : undefined
          }
        >
          <div className="divide-y divide-white/[0.06]">
            {SAUCES.map((s) => (
              <div key={s.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base text-white/90">
                    {s.name}
                    {s.side && c(`a:${s.id}`) > 0 && (
                      <span className="ml-2 text-xs text-white/45 tabular-nums">total {c(`s:${s.id}`) + c(`a:${s.id}`)}</span>
                    )}
                  </span>
                  <Stepper label={s.side ? `${s.name} en el plato` : s.name} value={c(`s:${s.id}`)} onChange={(v) => setCount(`s:${s.id}`, v)} />
                </div>
                {s.side && (
                  <div className="mt-2 flex items-center justify-between gap-3 pl-3 border-l border-gold/20">
                    <span className="text-xs text-white/50">Aparte</span>
                    <Stepper size="sm" label={`${s.name} aparte`} value={c(`a:${s.id}`)} onChange={(v) => setCount(`a:${s.id}`, v)} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/40 leading-relaxed">
            Cada solomillo cuenta una vez: con su salsa en el plato, con la salsa aparte o sin salsa.
          </p>
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
            if (!confirmReset) return setConfirmReset(true)
            update(EMPTY)
          }}
          className={`w-full py-3 rounded-2xl text-sm font-semibold border transition active:scale-[0.99] ${
            confirmReset ? 'border-red-300/50 bg-red-500/15 text-red-200' : 'border-white/10 text-white/55'
          }`}
        >
          {confirmReset ? '¿Seguro? Pulsa otra vez para empezar de cero' : 'Empezar un menú nuevo'}
        </button>
      </div>
    </div>
  )
}
