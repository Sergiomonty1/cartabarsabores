/* Shared visual pieces used by the public menu and the admin panel. */

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-[0_0_22px_rgba(216,185,117,0.3)] ${className}`}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" stroke="url(#sabLogoGrad)" strokeWidth="1" opacity="0.7" />
      <circle cx="32" cy="32" r="22" stroke="#d8b975" strokeWidth="0.5" opacity="0.28" strokeDasharray="4 3" />
      <g stroke="#e9d6a8" strokeWidth="1.3" strokeLinecap="round" opacity="0.95">
        <line x1="24" y1="18" x2="24" y2="46" />
        <line x1="21" y1="18" x2="21" y2="26" />
        <line x1="27" y1="18" x2="27" y2="26" />
        <path d="M21 26 Q21 30 24 30 Q27 30 27 26" />
        <line x1="40" y1="30" x2="40" y2="46" />
        <path d="M40 18 Q46 24 43 30 L40 30 Z" fill="#d8b975" fillOpacity="0.18" />
      </g>
      <defs>
        <linearGradient id="sabLogoGrad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#f4e6c4" />
          <stop offset="100%" stopColor="#b68f48" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * Brillos de fondo. Son degradados ESTÁTICOS: antes eran «orbs» con blur animados y en
 * móvil obligaban a repintar cada fotograma (la carta iba a tirones).
 */
export function GradientOrbs() {
  return <div className="bg-glow fixed inset-0 pointer-events-none z-0" aria-hidden="true" />
}

export function GoldenDivider({ className = 'my-7' }: { className?: string }) {
  return (
    <div className={`relative h-px overflow-hidden animate-scale-in ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
      <div className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-gold-soft/70 to-transparent animate-shimmer" />
    </div>
  )
}
