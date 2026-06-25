import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MenuData, Translations } from '@/types/menu'

const MENU_COLLECTION = 'menu'
const MENU_DOC = 'data'
const INITIAL_DOC = 'initial'

/* ─── Traducciones semilla de las categorías (por id) ─── */
const CATEGORY_I18N: Record<string, Translations> = {
  entrantes:     { en: 'Starters',    de: 'Vorspeisen',     pt: 'Entradas',       fr: 'Entrées' },
  tostas:        { en: 'Toasts',      de: 'Toasts',         pt: 'Tostas',         fr: 'Tartines' },
  caliente:      { en: 'Hot dishes',  de: 'Warme Gerichte', pt: 'Pratos quentes', fr: 'Plats chauds' },
  arroces:       { en: 'Rice dishes', de: 'Reisgerichte',   pt: 'Arrozes',        fr: 'Riz' },
  postres:       { en: 'Desserts',    de: 'Nachspeisen',    pt: 'Sobremesas',     fr: 'Desserts' },
  'fuera-carta': { en: 'Specials',    de: 'Empfehlungen',   pt: 'Fora da Carta',  fr: 'Hors Carte' },
}

/* ─── Traducciones semilla de los platos (por id, errores corregidos) ─── */
const DISH_I18N: Record<string, Translations> = {
  e1: { en: 'Fried chicken & mustard salad', de: 'Salat mit gebratenem Hähnchen & Senf', pt: 'Salada de frango frito e mostarda', fr: 'Salade de poulet frit et moutarde' },
  e2: { en: 'Prawn Russian salad', de: 'Russischer Salat mit Garnelen', pt: 'Salada russa de lagostins', fr: 'Salade russe de langoustines' },
  e3: { en: 'Dressed potatoes with salmorejo', de: 'Kartoffeln mit Salmorejo', pt: 'Batatas temperadas com salmorejo', fr: 'Pommes de terre au salmorejo' },
  e4: { en: 'Homemade patatas bravas', de: 'Hausgemachte Patatas Bravas', pt: 'Batatas bravas caseiras', fr: 'Patatas bravas maison' },
  e5: { en: 'Sabores croquettes', de: 'Kroketten Sabores', pt: 'Croquetes sabores', fr: 'Croquettes sabores' },
  e6: { en: 'Foie gras magnum', de: 'Foie-Gras-Magnum', pt: 'Magnum de foie', fr: 'Magnum de foie gras' },
  e7: { en: 'Prawn taco', de: 'Garnelen-Taco', pt: 'Taco de lagostins', fr: 'Taco de langoustines' },
  e8: { en: 'Fried baby squid taco', de: 'Taco mit gebratenem Baby-Tintenfisch', pt: 'Taco de lula frita', fr: 'Taco de chipirons frits' },
  e9: { en: 'Crispy chicken wing ravioli', de: 'Knusprige Chicken-Wing-Ravioli', pt: 'Ravioli crocante de asinhas', fr: "Ravioli croustillant d'ailes de poulet" },
  t1: { en: 'Salmorejo, quail egg & ham toast', de: 'Toast mit Salmorejo, Wachtelei & Schinken', pt: 'Salmorejo, ovo de codorniz e presunto', fr: 'Salmorejo, œuf de caille et jambon' },
  t2: { en: 'Mackerel, peppers & aioli toast', de: 'Toast mit Makrele, Paprika & Aioli', pt: 'Cavala, pimentos e aioli', fr: 'Maquereau, poivrons et aïoli' },
  t3: { en: 'Anchovies, cream cheese & truffle toast', de: 'Toast mit Sardellen, Frischkäse & Trüffel', pt: 'Anchovas, queijo creme e trufa', fr: 'Anchois, fromage frais et truffe' },
  c1: { en: 'Sirloin in sauce (carbonara, whisky, brava)', de: 'Filet in Sauce (Carbonara, Whisky, Brava)', pt: 'Lombo em molho (carbonara, whisky, brava)', fr: 'Filet en sauce (carbonara, whisky, brava)' },
  c2: { en: 'Salmon with pipirrana', de: 'Lachs mit Pipirrana', pt: 'Salmão com pipirrana', fr: 'Saumon à la pipirrana' },
  c3: { en: 'Toasted noodles with pear aioli', de: 'Geröstete Nudeln mit Birnen-Aioli', pt: 'Fideos torrados com aioli de pera', fr: "Nouilles grillées à l'aïoli de poire" },
  c4: { en: 'Pulled pork brioche', de: 'Pulled-Pork-Brioche', pt: 'Brioche de pulled pork', fr: 'Brioche de porc effiloché' },
  c5: { en: 'Potatoes with egg & truffle', de: 'Kartoffeln mit Ei & Trüffel', pt: 'Batatas com ovo e trufa', fr: 'Pommes de terre, œuf et truffe' },
  c6: { en: 'Burger', de: 'Hamburger', pt: 'Hambúrguer', fr: 'Hamburger' },
  c7: { en: 'Roasted chicken burger', de: 'Brathähnchen-Burger', pt: 'Hambúrguer de frango assado', fr: 'Burger de poulet rôti' },
  c8: { en: 'Marinated tuna', de: 'Marinierter Thunfisch', pt: 'Atum marinado', fr: 'Thon mariné' },
  a1: { en: 'Ask about our rice dishes (weekends)', de: 'Fragen Sie nach unseren Reisgerichten (Wochenende)', pt: 'Pergunte pelos nossos arrozes (fim de semana)', fr: 'Renseignez-vous sur nos riz (week-end)' },
  p1: { en: 'Cheesecake with mascarpone ice cream & coulis', de: 'Käsekuchen mit Mascarpone-Eis & Coulis', pt: 'Tarte de queijo com gelado de mascarpone e coulis', fr: 'Cheesecake, glace mascarpone et coulis' },
  p2: { en: 'Chocolate coulant with pistachio ice cream', de: 'Schokoladen-Coulant mit Pistazien-Eis', pt: 'Coulant de chocolate com gelado de pistacho', fr: 'Coulant au chocolat, glace pistache' },
  p3: { en: 'Brioche French toast', de: 'Brioche-Arme-Ritter', pt: 'Rabanada de brioche', fr: 'Pain perdu brioche' },
  f1: { en: 'Iberian pork presa', de: 'Iberische Presa', pt: 'Presa ibérica', fr: 'Presa ibérique' },
  f2: { en: 'Striploin', de: 'Roastbeef', pt: 'Lombo baixo', fr: 'Faux-filet' },
  f3: { en: 'Beef rib steak', de: 'Rib-Eye vom Rind', pt: 'Costeleta de vaca', fr: 'Côte de bœuf' },
  f4: { en: 'T-Bone', de: 'T-Bone', pt: 'T-Bone', fr: 'T-Bone' },
  f5: { en: 'Slow-cooked pork shank with potato parmentier', de: 'Niedrigtemperatur-Schweinshaxe mit Kartoffelpüree', pt: 'Pernil a baixa temperatura com parmentier de batata', fr: 'Jarret à basse température, parmentier de pommes de terre' },
  f6: { en: 'Pork abanico taco', de: 'Taco vom Schweinefächer (Abanico)', pt: 'Taco de abanico', fr: "Taco d'abanico" },
  f7: { en: 'Iberian presa burger', de: 'Iberischer Presa-Burger', pt: 'Hambúrguer de presa', fr: 'Burger de presa ibérique' },
  f8: { en: 'Garlic prawns', de: 'Knoblauch-Garnelen', pt: 'Gambas ao alho', fr: "Crevettes à l'ail" },
  f9: { en: 'Salt-baked prawns', de: 'Garnelen in Salz', pt: 'Gambas ao sal', fr: 'Crevettes au sel' },
  f10: { en: 'Carril clams', de: 'Carril-Venusmuscheln', pt: 'Amêijoas de carril', fr: 'Palourdes de carril' },
  f11: { en: 'Baby mussels in sauce', de: 'Baby-Miesmuscheln in Sauce', pt: 'Mexilhões baby em molho', fr: 'Petites moules en sauce' },
}

const rawDefaultMenu: MenuData = {
  barName: 'Sabores',
  importantDay: false,
  showWines: true,
  wineCategories: [
    {
      id: 'ribera',
      name: 'Ribera del Duero',
      order: 0,
      items: [
        { id: 'w1', name: 'Protos', priceCopa: 3.50, priceBottle: 20, order: 0 },
        { id: 'w2', name: 'Villarnaiz', priceCopa: 3.10, priceBottle: 18, order: 1 },
        { id: 'w3', name: 'Finca Resalso', priceCopa: 0, priceBottle: 28, year: '2024', order: 2 },
        { id: 'w4', name: 'Pago de los Capellanes', priceCopa: 0, priceBottle: 30, year: '2024', order: 3 },
      ],
    },
    {
      id: 'rioja',
      name: 'Rioja',
      order: 1,
      items: [
        { id: 'w5', name: 'Beronia', priceCopa: 3.30, priceBottle: 20, order: 0 },
        { id: 'w6', name: 'Villarnaiz', priceCopa: 3, priceBottle: 18, order: 1 },
        { id: 'w7', name: 'Herederos del Marqués de Riscal (Gran Reserva)', priceCopa: 0, priceBottle: 90, order: 2 },
        { id: 'w8', name: 'Muga', priceCopa: 0, priceBottle: 38, year: '2022', order: 3 },
      ],
    },
    {
      id: 'rias-baixas',
      name: 'Rías Baixas',
      order: 2,
      items: [
        { id: 'w9', name: 'Martín Códax', priceCopa: 4.20, priceBottle: 21, order: 0 },
        { id: 'w10', name: 'Pazo de San Mauro', priceCopa: 0, priceBottle: 30, order: 1 },
      ],
    },
    {
      id: 'bierzo',
      name: 'Bierzo',
      order: 3,
      items: [
        { id: 'w11', name: 'Petit Pittacum', priceCopa: 0, priceBottle: 20, order: 0 },
      ],
    },
    {
      id: 'andalucia',
      name: 'Andalucía — Sevilla / Cádiz',
      order: 4,
      items: [
        { id: 'w12', name: 'Cocolubis (Constantina)', priceCopa: 0, priceBottle: 42, year: '2023', order: 0 },
        { id: 'w13', name: 'Garum (Bodegas Luis Pérez)', priceCopa: 0, priceBottle: 28, order: 1 },
      ],
    },
    {
      id: 'verdejo',
      name: 'Verdejo',
      order: 5,
      items: [
        { id: 'w14', name: 'Villarnaiz (Rueda)', priceCopa: 3.50, priceBottle: 18, order: 0 },
        { id: 'w15', name: 'Cuatro Rayas (Rueda)', priceCopa: 3.50, priceBottle: 18, order: 1 },
      ],
    },
    {
      id: 'frizzante',
      name: 'Frizzante',
      order: 6,
      items: [
        { id: 'w16', name: 'Viñagamo Etiqueta Negra', priceCopa: 3, priceBottle: 14, order: 0 },
        { id: 'w17', name: 'Barbadillo', priceCopa: 3.50, priceBottle: 16, order: 1 },
      ],
    },
  ],
  categories: [
    {
      id: 'entrantes',
      name: 'Entrantes',
      icon: '🥗',
      order: 0,
      items: [
        { id: 'e1', name: 'Ensalada de pollo frito y mostaza', priceTapa: 4.90, priceMedia: 4.90, samePrice: true, order: 0, allergens: ['gluten', 'mostaza', 'huevo', 'lacteo'] },
        { id: 'e2', name: 'Ensaladilla de langostinos', priceTapa: 4.70, priceMedia: 9.40, samePrice: false, order: 1, allergens: ['crustaceo', 'huevo', 'pescado'] },
        { id: 'e3', name: 'Patatas aliñadas con salmorejo', priceTapa: 3.90, priceMedia: 3.90, samePrice: true, order: 2, allergens: ['gluten', 'sulfitos'] },
        { id: 'e4', name: 'Patatas bravas caseras', priceTapa: 4.10, priceMedia: 8.20, samePrice: false, order: 3, allergens: ['sulfitos', 'huevo'] },
        { id: 'e5', name: 'Croquetas sabores', priceTapa: 4.20, priceMedia: 8.40, samePrice: false, order: 4, allergens: ['gluten', 'huevo', 'sulfitos'] },
        { id: 'e6', name: 'Magnum de foie', priceTapa: 4.90, priceMedia: 4.90, samePrice: true, order: 5, allergens: ['lacteo', 'sulfitos', 'gluten'] },
        { id: 'e7', name: 'Taco de langostinos', priceTapa: 4.90, priceMedia: 4.90, samePrice: true, order: 6, allergens: ['gluten', 'huevo', 'crustaceo', 'sulfitos'] },
        { id: 'e8', name: 'Taco de chipirón frito', priceTapa: 7.50, priceMedia: 7.50, samePrice: true, order: 7, allergens: ['gluten', 'huevo', 'crustaceo', 'sulfitos'] },
        { id: 'e9', name: 'Ravioli crujiente de alitas', priceTapa: 4.90, priceMedia: 9.80, samePrice: false, order: 8, allergens: ['fruto-cascara', 'gluten', 'lacteo', 'huevo'] },
      ],
    },
    {
      id: 'tostas',
      name: 'Tostas',
      icon: '🍞',
      order: 1,
      items: [
        { id: 't1', name: 'Salmorejo, huevo de codorniz y jamón', priceTapa: 7.70, priceMedia: 7.70, samePrice: true, order: 0, allergens: ['gluten', 'huevo'] },
        { id: 't2', name: 'Caballa, pimientos y alioli', priceTapa: 7.70, priceMedia: 7.70, samePrice: true, order: 1, allergens: ['gluten', 'huevo', 'pescado', 'sulfitos'] },
        { id: 't3', name: 'Anchoas, queso crema y trufa', priceTapa: 9.00, priceMedia: 9.00, samePrice: true, order: 2, allergens: ['gluten', 'lacteo', 'pescado'] },
      ],
    },
    {
      id: 'caliente',
      name: 'Caliente',
      icon: '🍳',
      order: 2,
      items: [
        { id: 'c1', name: 'Solomillo en salsa (carbonara, whisky, brava)', priceTapa: 4.90, priceMedia: 9.50, samePrice: false, order: 0, allergens: ['lacteo', 'sulfitos'] },
        { id: 'c2', name: 'Salmón con pipirrana', priceTapa: 11.00, priceMedia: 11.00, samePrice: true, order: 1, allergens: ['pescado', 'sulfitos'] },
        { id: 'c3', name: 'Fideos tostados con alioli de pera', priceTapa: 5.20, priceMedia: 5.20, samePrice: true, order: 2, allergens: ['huevo', 'soja', 'crustaceo', 'apio'] },
        { id: 'c4', name: 'Brioche de pulled pork', priceTapa: 7.50, priceMedia: 7.50, samePrice: true, order: 3, allergens: ['lacteo', 'gluten', 'sulfitos', 'huevo'] },
        { id: 'c5', name: 'Patatas con huevo y trufa', priceTapa: 7.90, priceMedia: 7.90, samePrice: true, order: 4, allergens: ['huevo'] },
        { id: 'c6', name: 'Hamburguesa', priceTapa: 7.50, priceMedia: 7.50, samePrice: true, order: 5, allergens: ['gluten', 'soja', 'mostaza', 'lacteo', 'sesamo'] },
        { id: 'c7', name: 'Hamburguesa de pollo asado', priceTapa: 7.70, priceMedia: 7.70, samePrice: true, order: 6, allergens: ['gluten', 'soja', 'molusco', 'mostaza', 'sesamo'] },
        { id: 'c8', name: 'Atún macerado', priceTapa: 5.20, priceMedia: 5.20, samePrice: true, order: 7, allergens: ['gluten', 'soja', 'pescado', 'huevo', 'fruto-cascara'] },
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
        { id: 'p1', name: 'Tarta de queso con helado de mascarpone y coulis', priceTapa: 4.70, priceMedia: 4.70, samePrice: true, order: 0, allergens: ['lacteo', 'sulfitos', 'fruto-cascara'] },
        { id: 'p2', name: 'Coulant de chocolate con helado de pistacho', priceTapa: 4.70, priceMedia: 4.70, samePrice: true, order: 1, allergens: ['fruto-cascara', 'gluten', 'lacteo'] },
        { id: 'p3', name: 'Torrija de brioche', priceTapa: 5.20, priceMedia: 5.20, samePrice: true, order: 2, allergens: ['fruto-cascara', 'gluten', 'lacteo', 'sulfitos'] },
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

/** Adjunta las traducciones semilla (por id) a categorías y platos que no las tengan. */
function attachSeedTranslations(data: MenuData): MenuData {
  return {
    ...data,
    categories: data.categories.map((cat) => ({
      ...cat,
      nameI18n: cat.nameI18n ?? CATEGORY_I18N[cat.id],
      items: cat.items.map((it) => ({
        ...it,
        nameI18n: it.nameI18n ?? DISH_I18N[it.id],
      })),
    })),
  }
}

const defaultMenuData: MenuData = attachSeedTranslations(rawDefaultMenu)

/**
 * Rellena los campos que falten en datos venidos de Firestore usando los valores
 * de fábrica (alérgenos y traducciones de los platos semilla) y normaliza opcionales.
 */
function hydrate(data: MenuData): MenuData {
  const categories = (data.categories || []).map((cat) => {
    const defCat = defaultMenuData.categories.find((c) => c.id === cat.id)
    return {
      ...cat,
      nameI18n: cat.nameI18n ?? defCat?.nameI18n ?? CATEGORY_I18N[cat.id],
      items: (cat.items || []).map((item) => {
        const defItem = defCat?.items.find((i) => i.id === item.id)
        return {
          ...item,
          allergens: item.allergens ?? defItem?.allergens,
          nameI18n: item.nameI18n ?? defItem?.nameI18n ?? DISH_I18N[item.id],
        }
      }),
    }
  })
  return {
    ...data,
    categories,
    wineCategories: data.wineCategories ?? defaultMenuData.wineCategories,
    showWines: data.showWines ?? defaultMenuData.showWines ?? true,
    importantDay: data.importantDay ?? false,
  }
}

const clone = (data: MenuData): MenuData => JSON.parse(JSON.stringify(data))

export const menuService = {
  /** Devuelve la carta de fábrica al instante. Llama a fetchMenu() en segundo plano. */
  getDefaultMenu(): MenuData {
    return clone(defaultMenuData)
  },

  getDefaults(): MenuData {
    return clone(defaultMenuData)
  },

  /** Carga la carta publicada desde Firestore. Siembra la de fábrica si está vacía. */
  async fetchMenu(): Promise<MenuData> {
    try {
      const docRef = doc(db, MENU_COLLECTION, MENU_DOC)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        return hydrate(snap.data() as MenuData)
      }
      const seeded = { ...defaultMenuData, updatedAt: new Date().toISOString() }
      await setDoc(docRef, clone(seeded))
      return clone(defaultMenuData)
    } catch {
      return clone(defaultMenuData)
    }
  },

  /**
   * Suscripción en tiempo real a la carta publicada: el callback se dispara con cada
   * cambio (así los clientes ven las actualizaciones al instante, sin recargar).
   * Devuelve la función para cancelar la suscripción.
   */
  subscribeMenu(onData: (menu: MenuData) => void, onError?: (err: unknown) => void): () => void {
    const docRef = doc(db, MENU_COLLECTION, MENU_DOC)
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) onData(hydrate(snap.data() as MenuData))
      },
      (err) => onError?.(err)
    )
  },

  /** Publica la carta (la que ven los clientes). */
  async saveMenu(data: MenuData): Promise<void> {
    const docRef = doc(db, MENU_COLLECTION, MENU_DOC)
    const clean = clone(data)
    clean.updatedAt = new Date().toISOString()
    await setDoc(docRef, clean)
  },

  /** Carga la "carta inicial / de fábrica" guardada por el admin (o null si no hay). */
  async fetchInitialMenu(): Promise<MenuData | null> {
    try {
      const snap = await getDoc(doc(db, MENU_COLLECTION, INITIAL_DOC))
      if (snap.exists()) return hydrate(snap.data() as MenuData)
      return null
    } catch {
      return null
    }
  },

  /** Guarda la carta actual como "carta inicial / de fábrica" (para el botón Resetear). */
  async saveInitialMenu(data: MenuData): Promise<void> {
    const clean = clone(data)
    clean.updatedAt = new Date().toISOString()
    await setDoc(doc(db, MENU_COLLECTION, INITIAL_DOC), clean)
  },

  /**
   * Devuelve la carta a la que debe restaurar el botón Resetear:
   * la inicial guardada por el admin, o la de fábrica del código si no hay ninguna.
   */
  async fetchResetTarget(): Promise<MenuData> {
    const initial = await this.fetchInitialMenu()
    return initial ?? clone(defaultMenuData)
  },
}
