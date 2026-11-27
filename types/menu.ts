/** Idiomas soportados. 'es' es el idioma base (el campo `name`). */
export type Lang = 'es' | 'en' | 'de' | 'pt' | 'fr'

/** Traducciones manuales por idioma. El español va en el campo base (`name`). */
export type Translations = {
  en?: string
  de?: string
  pt?: string
  fr?: string
}

/** Sabor / variedad de un plato (p. ej. los tipos de croqueta). Comparte el precio del plato. */
export interface MenuVariant {
  id: string
  name: string
  nameI18n?: Translations
  /** Si es true, el sabor no se muestra (p. ej. cuando no hay). */
  hidden?: boolean
  /** Alérgenos que añade este sabor, además de los del plato. */
  allergens?: string[]
}

export interface MenuItem {
  id: string
  name: string
  /** Traducciones del nombre por idioma (editables desde admin). */
  nameI18n?: Translations
  description?: string
  descriptionI18n?: Translations
  /** Etiqueta corta junto al nombre (p. ej. «Chacina»). */
  tag?: string
  /** Grupo dentro de la sección (id de MenuCategory.groups). Solo se usa en el admin. */
  group?: string
  /** Plato que se monta eligiendo ingredientes (p. ej. el arroz del día). Su nombre se genera solo. */
  builder?: DishBuilder
  tagI18n?: Translations
  priceTapa: number
  priceMedia: number
  samePrice: boolean
  order: number
  allergens?: string[]
  /** Si es true, el plato no se muestra en la carta pública. */
  hidden?: boolean
  /** Sabores / variedades que se listan bajo el nombre (mismo precio). */
  variants?: MenuVariant[]
}

/** Ingrediente para montar un plato (arroz del día). */
export interface BuilderIngredient {
  id: string
  /** Nombre en español, como se lee en la carta: «Carrillada», «Cola de toro»… */
  name: string
  /** Cómo se dice dentro del nombre del plato en cada idioma («braised pork cheek»…). */
  nameI18n?: Translations
  allergens?: string[]
  /** «Negro» (tinta): no es un ingrediente más, cambia el plato a «Arroz negro con…». */
  style?: boolean
}

export interface DishBuilder {
  options: BuilderIngredient[]
  selected: string[]
}

/** Grupo de platos dentro de una sección, solo para el admin. */
export interface MenuGroup {
  id: string
  name: string
}

export interface MenuCategory {
  id: string
  name: string
  nameI18n?: Translations
  icon?: string
  order: number
  /** Si es true, la sección no se muestra en la carta pública. */
  hidden?: boolean
  /** Línea corta bajo el título de la sección (p. ej. "Solo los fines de semana"). */
  note?: string
  noteI18n?: Translations
  /** Texto corto bajo el título (p. ej. cómo funcionan los arroces). */
  description?: string
  descriptionI18n?: Translations
  /** Mínimo de personas para pedir (se muestra como etiqueta). */
  minPeople?: number
  /** Hora límite para pedir, «HH:MM» (se muestra como etiqueta: «Pedidos hasta las 15:15»). */
  lastOrder?: string
  /** Grupos para ordenar los platos en el admin (p. ej. arroces «De carne» / «De marisco»). No salen en la carta. */
  groups?: MenuGroup[]
  /** Si es true, los precios de la sección se muestran «por persona». */
  pricePerPerson?: boolean
  items: MenuItem[]
}

export interface WineItem {
  id: string
  name: string
  nameI18n?: Translations
  priceCopa: number
  priceBottle: number
  year?: string
  order: number
  /** Si es true, el vino no se muestra en la carta pública. */
  hidden?: boolean
}

export interface WineCategory {
  id: string
  name: string
  nameI18n?: Translations
  order: number
  hidden?: boolean
  items: WineItem[]
}

export interface MenuData {
  categories: MenuCategory[]
  wineCategories?: WineCategory[]
  barName: string
  importantDay?: boolean
  showWines?: boolean
  updatedAt?: string
  /** Versión de las actualizaciones de contenido ya aplicadas (ver lib/menuUpdates.ts). */
  contentVersion?: number
}
