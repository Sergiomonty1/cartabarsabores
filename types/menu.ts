/** Idiomas soportados. 'es' es el idioma base (el campo `name`). */
export type Lang = 'es' | 'en' | 'de' | 'pt' | 'fr'

/** Traducciones manuales por idioma. El español va en el campo base (`name`). */
export type Translations = {
  en?: string
  de?: string
  pt?: string
  fr?: string
}

export interface MenuItem {
  id: string
  name: string
  /** Traducciones del nombre por idioma (editables desde admin). */
  nameI18n?: Translations
  description?: string
  descriptionI18n?: Translations
  priceTapa: number
  priceMedia: number
  samePrice: boolean
  order: number
  allergens?: string[]
}

export interface MenuCategory {
  id: string
  name: string
  nameI18n?: Translations
  icon?: string
  order: number
  /** Si es true, la sección no se muestra en la carta pública. */
  hidden?: boolean
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
}
