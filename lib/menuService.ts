import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MenuCategory, MenuItem, MenuData } from '@/types/menu'

const MENU_COLLECTION = 'menu'

const defaultMenuData: MenuData = {
  barName: 'Sabores',
  categories: [
    {
      id: 'entrantes',
      name: 'Entrantes',
      icon: '🥗',
      order: 0,
      items: [
        { id: 'e1', name: 'Ensalada de pollo frito y mostaza', priceTapa: 4.90, priceMedia: 4.90, samePrice: true, order: 0 },
        { id: 'e2', name: 'Ensaladilla de langostinos', priceTapa: 4.70, priceMedia: 9.40, samePrice: false, order: 1 },
        { id: 'e3', name: 'Patatas aliñadas con salmorejo', priceTapa: 3.90, priceMedia: 3.90, samePrice: true, order: 2 },
        { id: 'e4', name: 'Patatas bravas caseras', priceTapa: 4.10, priceMedia: 8.20, samePrice: false, order: 3 },
        { id: 'e5', name: 'Croquetas sabores', priceTapa: 4.20, priceMedia: 8.40, samePrice: false, order: 4 },
        { id: 'e6', name: 'Magnum de foie', priceTapa: 4.90, priceMedia: 4.90, samePrice: true, order: 5 },
        { id: 'e7', name: 'Taco de langostinos', priceTapa: 4.90, priceMedia: 4.90, samePrice: true, order: 6 },
        { id: 'e8', name: 'Taco de chipirón frito', priceTapa: 7.50, priceMedia: 7.50, samePrice: true, order: 7 },
        { id: 'e9', name: 'Ravioli crujiente de alitas', priceTapa: 4.90, priceMedia: 9.80, samePrice: false, order: 8 },
      ],
    },
    {
      id: 'tostas',
      name: 'Tostas',
      icon: '🍞',
      order: 1,
      items: [
        { id: 't1', name: 'Salmorejo, huevo de codorniz y jamón', priceTapa: 7.70, priceMedia: 7.70, samePrice: true, order: 0 },
        { id: 't2', name: 'Caballa, pimientos y alioli', priceTapa: 7.70, priceMedia: 7.70, samePrice: true, order: 1 },
        { id: 't3', name: 'Anchoas, queso crema y trufa', priceTapa: 9.00, priceMedia: 9.00, samePrice: true, order: 2 },
      ],
    },
    {
      id: 'caliente',
      name: 'Caliente',
      icon: '🍳',
      order: 2,
      items: [
        { id: 'c1', name: 'Solomillo en salsa (carbonara, whisky, brava)', priceTapa: 4.90, priceMedia: 9.50, samePrice: false, order: 0 },
        { id: 'c2', name: 'Salmón con pipirrana', priceTapa: 11.00, priceMedia: 11.00, samePrice: true, order: 1 },
        { id: 'c3', name: 'Fideos tostados con alioli de pera', priceTapa: 5.20, priceMedia: 5.20, samePrice: true, order: 2 },
        { id: 'c4', name: 'Brioche de pulled pork', priceTapa: 7.50, priceMedia: 7.50, samePrice: true, order: 3 },
        { id: 'c5', name: 'Patatas con huevo y trufa', priceTapa: 7.90, priceMedia: 7.90, samePrice: true, order: 4 },
        { id: 'c6', name: 'Hamburguesa', priceTapa: 7.50, priceMedia: 7.50, samePrice: true, order: 5 },
        { id: 'c7', name: 'Hamburguesa de pollo asado', priceTapa: 7.70, priceMedia: 7.70, samePrice: true, order: 6 },
        { id: 'c8', name: 'Atún macerado', priceTapa: 5.20, priceMedia: 5.20, samePrice: true, order: 7 },
      ],
    },
    {
      id: 'arroces',
      name: 'Arroces',
      icon: '🥘',
      order: 3,
      items: [
        { id: 'a1', name: 'Preguntar por nuestros arroces (fin de semana)', priceTapa: 0, priceMedia: 0, samePrice: true, order: 0 },
      ],
    },
    {
      id: 'postres',
      name: 'Postres',
      icon: '🍰',
      order: 4,
      items: [
        { id: 'p1', name: 'Tarta de queso con helado de mascarpone y coulis', priceTapa: 4.70, priceMedia: 4.70, samePrice: true, order: 0 },
        { id: 'p2', name: 'Coulant de chocolate con helado de pistacho', priceTapa: 4.70, priceMedia: 4.70, samePrice: true, order: 1 },
        { id: 'p3', name: 'Torrija de brioche', priceTapa: 5.20, priceMedia: 5.20, samePrice: true, order: 2 },
      ],
    },
    {
      id: 'fuera-carta',
      name: 'Fuera de Carta',
      icon: '⭐',
      order: 5,
      items: [
        { id: 'f1', name: 'Presa ibérica', priceTapa: 0, priceMedia: 0, samePrice: true, order: 0 },
        { id: 'f2', name: 'Lomo bajo', priceTapa: 0, priceMedia: 0, samePrice: true, order: 1 },
        { id: 'f3', name: 'Chuletón de vaca', priceTapa: 0, priceMedia: 0, samePrice: true, order: 2 },
        { id: 'f4', name: 'T-Bone', priceTapa: 0, priceMedia: 0, samePrice: true, order: 3 },
        { id: 'f5', name: 'Chonillo a baja temperatura con parmentier de patatas', priceTapa: 0, priceMedia: 0, samePrice: true, order: 4 },
        { id: 'f6', name: 'Taco de abanico', priceTapa: 0, priceMedia: 0, samePrice: true, order: 5 },
        { id: 'f7', name: 'Hamburguesa de presa', priceTapa: 0, priceMedia: 0, samePrice: true, order: 6 },
        { id: 'f8', name: 'Gambas al ajillo', priceTapa: 0, priceMedia: 0, samePrice: true, order: 7 },
        { id: 'f9', name: 'Gambas a la sal', priceTapa: 0, priceMedia: 0, samePrice: true, order: 8 },
        { id: 'f10', name: 'Almejas de carril', priceTapa: 0, priceMedia: 0, samePrice: true, order: 9 },
        { id: 'f11', name: 'Mejillones baby en salsa', priceTapa: 0, priceMedia: 0, samePrice: true, order: 10 },
      ],
    },
  ],
}

export const menuService = {
  /** Return defaults instantly. Call fetchMenu() in background for fresh data. */
  getDefaultMenu(): MenuData {
    return JSON.parse(JSON.stringify(defaultMenuData))
  },

  /** Fetch from Firestore (may be slow on first load). Seeds defaults if empty. */
  async fetchMenu(): Promise<MenuData> {
    try {
      const docRef = doc(db, MENU_COLLECTION, 'data')
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        return snap.data() as MenuData
      }
      // Seed defaults
      const seeded = { ...defaultMenuData, updatedAt: new Date().toISOString() }
      await setDoc(docRef, seeded)
      return defaultMenuData
    } catch {
      return defaultMenuData
    }
  },

  async saveMenu(data: MenuData): Promise<void> {
    const docRef = doc(db, MENU_COLLECTION, 'data')
    // Clean data: remove undefined values that Firestore rejects
    const clean = JSON.parse(JSON.stringify(data))
    clean.updatedAt = new Date().toISOString()
    await setDoc(docRef, clean)
  },

  getDefaults(): MenuData {
    return JSON.parse(JSON.stringify(defaultMenuData))
  },
}
