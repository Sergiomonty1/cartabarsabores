'use client'

import React, { useEffect, useMemo, useState } from 'react'

/**
 * Contador para menús de grupo. Se usa yendo mesa por mesa y sumando.
 * - Los solomillos se cuentan solos al sumar su salsa (en el plato o aparte) o «sin salsa».
 * - «Solomillo especial» para apuntar los que van con algo diferente (con una nota).
 * - La merluza se suma aparte.
 * Se guarda en este móvil para no perder la cuenta.
 */

const SAUCES = [
  { id: 'sin', name: 'Sin salsa', side: false },
  { id: 'carbonara', name: 'Carbonara', side: true },
  { id: 'whisky', name: 'Whisky', side: true },
  { id: 'brava', name: 'Brava', side: true },
  { id: 'mojo', name: 'Mojo picón', side: true },
] as const

type Special = { id: string; note: string; n: number }
type State = { people: number; counts: Record<string, number>; specials: Special[] }

const STORAGE_KEY = 'sabores-menu-grupo-v1'
const EMPTY: State = { people: 0, counts: {}, specials: [] }

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const s = JSON.parse(raw)
    const counts = s.counts && typeof s.counts === 'object' ? { ...s.counts } : {}
    delete counts.solomillo // versión anterior: el solomillo se sumaba a mano
    return {
      people: Number(s.people) || 0,
      counts,
      specials: Array.isArray(s.specials)
        ? s.specials.map((x: any, i: number) => ({ id: String(x.id ?? i), note: String(x.note ?? ''), n: Number(x.n) || 0 }))
        : [],
    }
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

export default function GroupMenuCounter({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>(EMPTY)
  const [ready, setReady] = useState(false)
  const [history, setHistory] = useState<State[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
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

  const update = (next: State) => {
    setHistory((h) => [...h.slice(-49), state])
    setState(next)
    setConfirmReset(false)
  }
  const c = (key: string) => state.counts[key] ?? 0
  const setCount = (key: string, v: number) => update({ ...state, counts: { ...state.counts, [key]: v } })
  const setSpecial = (id: string, patch: Partial<Special>) =>
    update({ ...state, specials: state.specials.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const addSpecial = () => update({ ...state, specials: [...state.specials, { id: String(Date.now()), note: '', n: 1 }] })
  const removeSpecial = (id: string) => update({ ...state, specials: state.specials.filter((s) => s.id !== id) })

  const sauceTotal = (s: (typeof SAUCES)[number]) => c(`s:${s.id}`) + (s.side ? c(`a:${s.id}`) : 0)
  const specialsTotal = state.specials.reduce((n, s) => n + s.n, 0)
  const solomillos = SAUCES.reduce((n, s) => n + sauceTotal(s), 0) + specialsTotal
  const merluzas = c('merluza')
  const ordered = solomillos + merluzas
  const missingPeople = state.people - ordered

  const summary = useMemo(() => {
    const lines: string[] = [`MENÚ · ${state.people} personas`]
    if (solomillos) {
      lines.push(`Solomillo: ${solomillos}`)
      for (const s of SAUCES) {
        const total = sauceTotal(s)
        if (!total) continue
        const side = s.side ? c(`a:${s.id}`) : 0
        lines.push(`  · ${s.name}: ${total}${side ? ` (${side === total ? 'aparte' : `${side} aparte`})` : ''}`)
      }
      for (const sp of state.specials) if (sp.n) lines.push(`  · ${sp.note.trim() || 'Especial'}: ${sp.n}`)
    }
    if (merluzas) lines.push(`Merluza: ${merluzas}`)
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
                Pedidos {ordered} de {state.people} · {solomillos} solomillo{solomillos === 1 ? '' : 's'} · {merluzas} merluza
                {merluzas === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </Card>

        {/* Solomillo: se cuenta solo con las salsas */}
        <Card title="Solomillo" aside={<Badge tone="gold">Total {solomillos}</Badge>}>
          <div className="divide-y divide-white/[0.06]">
            {SAUCES.map((s) => (
              <div key={s.id} className="py-3 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base text-white/90 min-w-0">
                    {s.name}
                    {s.side && c(`a:${s.id}`) > 0 && (
                      <span className="ml-2 text-xs text-white/45 tabular-nums">total {sauceTotal(s)}</span>
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

            {/* Especiales: con algo diferente */}
            <div className="pt-3">
              <p className="text-base text-white/90">Especial / con algo diferente</p>
              <p className="text-[11px] text-white/40 mt-0.5">Apunta qué lleva: «poco hecho», «sin sal», «salsa de setas aparte»…</p>
              <div className="mt-2 space-y-2">
                {state.specials.map((sp) => (
                  <div key={sp.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={sp.note}
                        onChange={(e) => setState((st) => ({ ...st, specials: st.specials.map((x) => (x.id === sp.id ? { ...x, note: e.target.value } : x)) }))}
                        placeholder="¿Qué lleva diferente?"
                        aria-label="Nota del solomillo especial"
                        className="flex-1 min-w-0 rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecial(sp.id)}
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
                onClick={addSpecial}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-gold/35 text-sm font-semibold text-gold-soft active:scale-[0.99] transition"
              >
                + Añadir solomillo especial
              </button>
            </div>
          </div>
        </Card>

        {/* Merluza */}
        <Card title="Merluza">
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg text-white/90">Merluza</span>
            <Stepper label="Merluza" value={merluzas} onChange={(v) => setCount('merluza', v)} />
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
