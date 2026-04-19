export interface MenuItem {
  id: string
  name: string
  description?: string
  priceTapa: number
  priceMedia: number
  samePrice: boolean
  order: number
  allergens?: string[]
}

export interface MenuCategory {
  id: string
  name: string
  icon?: string
  order: number
  items: MenuItem[]
}

export interface WineItem {
  id: string
  name: string
  priceCopa: number
  priceBottle: number
  year?: string
  order: number
}

export interface WineCategory {
  id: string
  name: string
  order: number
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
