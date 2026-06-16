import type { Lang, Translations } from '@/types/menu'

export type { Lang }

export const LANGUAGES: { code: Lang; flag: string; label: string }[] = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
]

/** Idiomas traducibles (todos menos el base español). Para los formularios del admin. */
export const I18N_LANGS = LANGUAGES.filter((l) => l.code !== 'es') as {
  code: Exclude<Lang, 'es'>
  flag: string
  label: string
}[]

/* ─── UI strings ─── */
const ui: Record<Lang, Record<string, string>> = {
  es: {
    welcomeTo: 'Bienvenido a',
    tapas: 'Tapas',
    media: 'Media',
    allergens: 'Alérgenos',
    wines: 'Vinos',
    ask: 'Consultar',
    onlyMedia: 'Solo disponible carta de Media Ración.',
    goMedia: 'Ir a Media',
    wine: 'Vino',
    glass: 'Copa',
    bottle: 'Botella',
  },
  en: {
    welcomeTo: 'Welcome to',
    tapas: 'Tapas',
    media: 'Half portion',
    allergens: 'Allergens',
    wines: 'Wines',
    ask: 'Ask us',
    onlyMedia: 'Only half-portion menu available.',
    goMedia: 'Go to Half portion',
    wine: 'Wine',
    glass: 'Glass',
    bottle: 'Bottle',
  },
  de: {
    welcomeTo: 'Willkommen bei',
    tapas: 'Tapas',
    media: 'Halbe Portion',
    allergens: 'Allergene',
    wines: 'Weine',
    ask: 'Auf Anfrage',
    onlyMedia: 'Nur die Karte mit halben Portionen verfügbar.',
    goMedia: 'Zur halben Portion',
    wine: 'Wein',
    glass: 'Glas',
    bottle: 'Flasche',
  },
  pt: {
    welcomeTo: 'Bem-vindo a',
    tapas: 'Tapas',
    media: 'Meia porção',
    allergens: 'Alergénios',
    wines: 'Vinhos',
    ask: 'Consultar',
    onlyMedia: 'Apenas disponível o menu de meia porção.',
    goMedia: 'Ir para Meia porção',
    wine: 'Vinho',
    glass: 'Copo',
    bottle: 'Garrafa',
  },
  fr: {
    welcomeTo: 'Bienvenue à',
    tapas: 'Tapas',
    media: 'Demi-portion',
    allergens: 'Allergènes',
    wines: 'Vins',
    ask: 'À consulter',
    onlyMedia: 'Seul le menu demi-portion est disponible.',
    goMedia: 'Aller à Demi-portion',
    wine: 'Vin',
    glass: 'Verre',
    bottle: 'Bouteille',
  },
}

/* ─── Etiquetas de alérgenos traducidas ─── */
const allergenLabels: Record<string, Record<Lang, string>> = {
  gluten:          { es: 'Gluten',            en: 'Gluten',       de: 'Gluten',         pt: 'Glúten',          fr: 'Gluten' },
  huevo:           { es: 'Huevo',             en: 'Egg',          de: 'Ei',             pt: 'Ovo',             fr: 'Œuf' },
  lacteo:          { es: 'Lácteo',            en: 'Dairy',        de: 'Milch',          pt: 'Lácteos',         fr: 'Lait' },
  mostaza:         { es: 'Mostaza',           en: 'Mustard',      de: 'Senf',           pt: 'Mostarda',        fr: 'Moutarde' },
  soja:            { es: 'Soja',              en: 'Soy',          de: 'Soja',           pt: 'Soja',            fr: 'Soja' },
  sulfitos:        { es: 'Sulfitos',          en: 'Sulphites',    de: 'Sulfite',        pt: 'Sulfitos',        fr: 'Sulfites' },
  apio:            { es: 'Apio',              en: 'Celery',       de: 'Sellerie',       pt: 'Aipo',            fr: 'Céleri' },
  cacahuetes:      { es: 'Cacahuetes',        en: 'Peanuts',      de: 'Erdnüsse',       pt: 'Amendoins',       fr: 'Arachides' },
  crustaceo:       { es: 'Crustáceo',         en: 'Crustaceans',  de: 'Krebstiere',     pt: 'Crustáceos',      fr: 'Crustacés' },
  pescado:         { es: 'Pescado',           en: 'Fish',         de: 'Fisch',          pt: 'Peixe',           fr: 'Poisson' },
  sesamo:          { es: 'Sésamo',            en: 'Sesame',       de: 'Sesam',          pt: 'Sésamo',          fr: 'Sésame' },
  'fruto-cascara': { es: 'Frutos de cáscara', en: 'Tree nuts',    de: 'Schalenfrüchte', pt: 'Frutos de casca', fr: 'Fruits à coque' },
  molusco:         { es: 'Molusco',           en: 'Molluscs',     de: 'Weichtiere',     pt: 'Moluscos',        fr: 'Mollusques' },
}

/** Devuelve un texto de interfaz en el idioma dado (con fallback a español). */
export function t(lang: Lang, key: string): string {
  return ui[lang]?.[key] ?? ui.es[key] ?? key
}

/**
 * Traduce un nombre a partir de su texto base (español) y sus traducciones.
 * Si no hay traducción para el idioma, cae al texto base.
 */
export function tName(lang: Lang, base: string, i18n?: Translations): string {
  if (lang === 'es') return base
  const translated = i18n?.[lang]
  return translated && translated.trim() ? translated : base
}

/** Etiqueta traducida de un alérgeno. */
export function tAllergen(lang: Lang, key: string): string {
  return allergenLabels[key]?.[lang] ?? allergenLabels[key]?.es ?? key
}
