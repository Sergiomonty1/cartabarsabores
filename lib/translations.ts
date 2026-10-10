import type { Lang, Translations } from '@/types/menu'

export type { Lang }

export const LANGUAGES: { code: Lang; flag: string; label: string; short: string }[] = [
  { code: 'es', flag: '🇪🇸', label: 'Español', short: 'ES' },
  { code: 'en', flag: '🇬🇧', label: 'English', short: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch', short: 'DE' },
  { code: 'pt', flag: '🇵🇹', label: 'Português', short: 'PT' },
  { code: 'fr', flag: '🇫🇷', label: 'Français', short: 'FR' },
]

/** Formato regional de fechas y precios para cada idioma. */
export const LOCALES: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-GB',
  de: 'de-DE',
  pt: 'pt-PT',
  fr: 'fr-FR',
}

export const isLang = (v: unknown): v is Lang =>
  typeof v === 'string' && LANGUAGES.some((l) => l.code === v)

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
    media: 'Media ración',
    allergens: 'Alérgenos',
    wines: 'Vinos',
    ask: 'Consultar',
    onlyMedia: 'Hoy solo servimos la carta de medias raciones.',
    goMedia: 'Ver medias raciones',
    wine: 'Vino',
    glass: 'Copa',
    bottle: 'Botella',
    allergenInfo: 'Leyenda de alérgenos',
    allergenLegend: 'Estos son los iconos que verás junto a cada plato.',
    updated: 'Carta actualizada',
    selectLang: 'Idioma',
    tapasSub: 'Para picar y compartir',
    mediaSub: 'Raciones para compartir',
    winesSub: 'Nuestra selección de vinos',
    allergensSub: 'Alérgenos de cada plato',
    askAllergens: 'Consulta los alérgenos con nuestro personal',
    allergyNotice: '¿Tienes alguna alergia o intolerancia? Avísanos y te ayudamos.',
    vatIncluded: 'Precios con IVA incluido',
    backToTop: 'Volver arriba',
    close: 'Cerrar',
    minPeople: 'Mínimo {n} personas',
    perPerson: '/ pers.',
  },
  en: {
    welcomeTo: 'Welcome to',
    tapas: 'Tapas',
    media: 'Half portion',
    allergens: 'Allergens',
    wines: 'Wines',
    ask: 'Ask us',
    onlyMedia: 'Today we are only serving the half-portion menu.',
    goMedia: 'See half portions',
    wine: 'Wine',
    glass: 'Glass',
    bottle: 'Bottle',
    allergenInfo: 'Allergen key',
    allergenLegend: 'These are the icons you will see next to each dish.',
    updated: 'Menu updated',
    selectLang: 'Language',
    tapasSub: 'Small plates to share',
    mediaSub: 'Portions to share',
    winesSub: 'Our wine selection',
    allergensSub: 'Allergens in each dish',
    askAllergens: 'Please ask our staff about allergens',
    allergyNotice: 'Any allergies or intolerances? Let us know and we will help.',
    vatIncluded: 'Prices include VAT',
    backToTop: 'Back to top',
    close: 'Close',
    minPeople: 'Minimum {n} people',
    perPerson: '/ person',
  },
  de: {
    welcomeTo: 'Willkommen bei',
    tapas: 'Tapas',
    media: 'Halbe Portion',
    allergens: 'Allergene',
    wines: 'Weine',
    ask: 'Auf Anfrage',
    onlyMedia: 'Heute servieren wir nur halbe Portionen.',
    goMedia: 'Halbe Portionen ansehen',
    wine: 'Wein',
    glass: 'Glas',
    bottle: 'Flasche',
    allergenInfo: 'Allergen-Legende',
    allergenLegend: 'Diese Symbole finden Sie neben jedem Gericht.',
    updated: 'Karte aktualisiert',
    selectLang: 'Sprache',
    tapasSub: 'Kleine Gerichte zum Teilen',
    mediaSub: 'Portionen zum Teilen',
    winesSub: 'Unsere Weinauswahl',
    allergensSub: 'Allergene in jedem Gericht',
    askAllergens: 'Fragen Sie unser Personal nach Allergenen',
    allergyNotice: 'Allergien oder Unverträglichkeiten? Sagen Sie uns Bescheid, wir helfen gern.',
    vatIncluded: 'Preise inkl. MwSt.',
    backToTop: 'Nach oben',
    close: 'Schließen',
    minPeople: 'Mindestens {n} Personen',
    perPerson: '/ Person',
  },
  pt: {
    welcomeTo: 'Bem-vindo ao',
    tapas: 'Tapas',
    media: 'Meia dose',
    allergens: 'Alergénios',
    wines: 'Vinhos',
    ask: 'Consultar',
    onlyMedia: 'Hoje só servimos o menu de meias doses.',
    goMedia: 'Ver meias doses',
    wine: 'Vinho',
    glass: 'Copo',
    bottle: 'Garrafa',
    allergenInfo: 'Legenda de alergénios',
    allergenLegend: 'Estes são os ícones que verá junto a cada prato.',
    updated: 'Carta atualizada',
    selectLang: 'Idioma',
    tapasSub: 'Petiscos para partilhar',
    mediaSub: 'Doses para partilhar',
    winesSub: 'A nossa seleção de vinhos',
    allergensSub: 'Alergénios de cada prato',
    askAllergens: 'Pergunte ao nosso pessoal pelos alergénios',
    allergyNotice: 'Tem alguma alergia ou intolerância? Avise-nos e ajudamos.',
    vatIncluded: 'Preços com IVA incluído',
    backToTop: 'Voltar ao topo',
    close: 'Fechar',
    minPeople: 'Mínimo {n} pessoas',
    perPerson: '/ pessoa',
  },
  fr: {
    welcomeTo: 'Bienvenue chez',
    tapas: 'Tapas',
    media: 'Demi-portion',
    allergens: 'Allergènes',
    wines: 'Vins',
    ask: 'Sur demande',
    onlyMedia: "Aujourd'hui, nous servons uniquement les demi-portions.",
    goMedia: 'Voir les demi-portions',
    wine: 'Vin',
    glass: 'Verre',
    bottle: 'Bouteille',
    allergenInfo: 'Légende des allergènes',
    allergenLegend: 'Voici les icônes affichées à côté de chaque plat.',
    updated: 'Carte mise à jour',
    selectLang: 'Langue',
    tapasSub: 'Petites assiettes à partager',
    mediaSub: 'Portions à partager',
    winesSub: 'Notre sélection de vins',
    allergensSub: 'Allergènes de chaque plat',
    askAllergens: 'Renseignez-vous auprès de notre personnel sur les allergènes',
    allergyNotice: 'Une allergie ou une intolérance ? Prévenez-nous, nous vous aiderons.',
    vatIncluded: 'Prix TTC',
    backToTop: 'Haut de page',
    close: 'Fermer',
    minPeople: 'Minimum {n} personnes',
    perPerson: '/ pers.',
  },
}

/* ─── Etiquetas de alérgenos traducidas ─── */
const allergenLabels: Record<string, Record<Lang, string>> = {
  gluten:          { es: 'Gluten',            en: 'Gluten',       de: 'Gluten',         pt: 'Glúten',          fr: 'Gluten' },
  huevo:           { es: 'Huevo',             en: 'Egg',          de: 'Ei',             pt: 'Ovo',             fr: 'Œuf' },
  lacteo:          { es: 'Lácteos',           en: 'Dairy',        de: 'Milch',          pt: 'Lácteos',         fr: 'Lait' },
  mostaza:         { es: 'Mostaza',           en: 'Mustard',      de: 'Senf',           pt: 'Mostarda',        fr: 'Moutarde' },
  soja:            { es: 'Soja',              en: 'Soy',          de: 'Soja',           pt: 'Soja',            fr: 'Soja' },
  sulfitos:        { es: 'Sulfitos',          en: 'Sulphites',    de: 'Sulfite',        pt: 'Sulfitos',        fr: 'Sulfites' },
  apio:            { es: 'Apio',              en: 'Celery',       de: 'Sellerie',       pt: 'Aipo',            fr: 'Céleri' },
  cacahuetes:      { es: 'Cacahuetes',        en: 'Peanuts',      de: 'Erdnüsse',       pt: 'Amendoins',       fr: 'Arachides' },
  crustaceo:       { es: 'Crustáceos',        en: 'Crustaceans',  de: 'Krebstiere',     pt: 'Crustáceos',      fr: 'Crustacés' },
  pescado:         { es: 'Pescado',           en: 'Fish',         de: 'Fisch',          pt: 'Peixe',           fr: 'Poisson' },
  sesamo:          { es: 'Sésamo',            en: 'Sesame',       de: 'Sesam',          pt: 'Sésamo',          fr: 'Sésame' },
  'fruto-cascara': { es: 'Frutos de cáscara', en: 'Tree nuts',    de: 'Schalenfrüchte', pt: 'Frutos de casca', fr: 'Fruits à coque' },
  molusco:         { es: 'Moluscos',          en: 'Molluscs',     de: 'Weichtiere',     pt: 'Moluscos',        fr: 'Mollusques' },
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

/** Precio con el formato del idioma (4,90 € · €4.90). */
export function fmtEUR(n: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR' }).format(n)
}

/** Idioma del navegador si lo tenemos; si no, español. */
export function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'es'
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const raw of list) {
    const code = raw?.slice(0, 2).toLowerCase()
    if (isLang(code)) return code
  }
  return 'es'
}
