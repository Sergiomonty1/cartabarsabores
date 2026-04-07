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

export interface MenuData {
  categories: MenuCategory[]
  barName: string
  importantDay?: boolean
  updatedAt?: string
}
