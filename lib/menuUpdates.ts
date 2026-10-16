import type { MenuData, MenuItem, MenuVariant, Translations } from '@/types/menu'

/**
 * Actualizaciones de contenido de la carta.
 *
 * Se aplican al LEER la carta (carta pública, admin y copia inicial) cuando los datos
 * guardados tienen una `contentVersion` menor que CONTENT_VERSION. Así los cambios se ven
 * nada más desplegar, sin tocar la base de datos; al pulsar Guardar en el admin quedan
 * grabados con la versión nueva y no se vuelven a aplicar.
 *
 * Cada cambio comprueba el nombre en español antes de tocar nada, para no pisar
 * cambios hechos a mano desde el admin.
 */
export const CONTENT_VERSION = 14

/* ─── Traducciones revisadas (oct. 2026) ─── */

export const CATEGORY_I18N: Record<string, Translations> = {
  entrantes: { en: "Starters", de: "Vorspeisen", pt: "Entradas", fr: "Entrées" },
  tostas: { en: "Toasts", de: "Röstbrote", pt: "Tostas", fr: "Tartines" },
  caliente: { en: "Hot dishes", de: "Warme Gerichte", pt: "Pratos quentes", fr: "Plats chauds" },
  arroces: { en: "Rice dishes", de: "Reisgerichte", pt: "Arrozes", fr: "Riz" },
  postres: { en: "Desserts", de: "Desserts", pt: "Sobremesas", fr: "Desserts" },
  "fuera-carta": { en: "Off-menu specials", de: "Tagesempfehlungen", pt: "Fora da carta", fr: "Hors carte" },
}

/** Nombre en español con el que se escribió cada traducción de sección. */
const CATEGORY_NAMES: Record<string, string> = {
  entrantes: "Entrantes",
  tostas: "Tostas",
  caliente: "Caliente",
  arroces: "Arroces",
  postres: "Postres",
  "fuera-carta": "Fuera de Carta",
}

export const DISH_I18N: Record<string, Translations> = {
  e1: { en: "Fried chicken salad with mustard", de: "Salat mit frittiertem Hähnchen und Senf", pt: "Salada de frango frito com mostarda", fr: "Salade de poulet frit à la moutarde" },
  e2: { en: "Prawn potato salad (ensaladilla)", de: "Kartoffelsalat mit Garnelen (Ensaladilla)", pt: "Salada russa com lagostins", fr: "Salade russe aux gambas" },
  e3: { en: "Dressed potatoes with salmorejo (cold tomato cream)", de: "Angemachte Kartoffeln mit Salmorejo (kalte Tomatencreme)", pt: "Batatas temperadas com salmorejo (creme frio de tomate)", fr: "Pommes de terre assaisonnées au salmorejo (crème froide de tomate)" },
  e4: { en: "Homemade patatas bravas (spicy sauce)", de: "Hausgemachte Patatas bravas (scharfe Soße)", pt: "Batatas bravas caseiras (molho picante)", fr: "Patatas bravas maison (sauce piquante)" },
  e5b: { en: "Cured ham croquettes", de: "Schinkenkroketten", pt: "Croquetes de presunto", fr: "Croquettes de jambon cru" },
  e5c: { en: "Puchero croquettes (Andalusian stew)", de: "Kroketten vom Puchero (andalusischer Eintopf)", pt: "Croquetes de puchero (cozido andaluz)", fr: "Croquettes de puchero (pot-au-feu andalou)" },
  e5d: { en: "Prawn croquettes", de: "Garnelenkroketten", pt: "Croquetes de camarão", fr: "Croquettes de crevettes" },
  e6: { en: "Foie gras Magnum", de: "Foie-gras-Magnum", pt: "Magnum de foie gras", fr: "Magnum de foie gras" },
  e7: { en: "Prawn taco", de: "Garnelen-Taco", pt: "Taco de lagostins", fr: "Taco aux gambas" },
  e10: { en: "Iberian pork taco (abanico cut)", de: "Taco mit iberischem Schwein (Abanico)", pt: "Taco de abanico de porco ibérico", fr: "Taco de porc ibérique (abanico)" },
  e8: { en: "Fried baby squid taco", de: "Taco mit frittierten Baby-Tintenfischen", pt: "Taco de lulinhas fritas", fr: "Taco de chipirons frits" },
  e9: { en: "Crispy chicken wing ravioli", de: "Knusprige Ravioli mit Hähnchenflügeln", pt: "Ravioli crocante de asas de frango", fr: "Ravioli croustillant aux ailes de poulet" },
  t1: { en: "Salmorejo, quail egg & cured ham", de: "Salmorejo, Wachtelei und Rohschinken", pt: "Salmorejo, ovo de codorniz e presunto", fr: "Salmorejo, œuf de caille et jambon cru" },
  t2: { en: "Mackerel, peppers & aioli", de: "Makrele, Paprika und Aioli", pt: "Cavala, pimentos e aioli", fr: "Maquereau, poivrons et aïoli" },
  t3: { en: "Anchovies, cream cheese & truffle", de: "Sardellen, Frischkäse und Trüffel", pt: "Anchovas, queijo creme e trufa", fr: "Anchois, fromage frais et truffe" },
  c1: { en: "Pork sirloin in sauce (carbonara, whisky, brava)", de: "Schweinefilet in Soße (Carbonara, Whisky, Brava)", pt: "Lombinho de porco com molho (carbonara, whisky, brava)", fr: "Filet mignon de porc en sauce (carbonara, whisky, brava)" },
  c2: { en: "Salmon with potatoes or salad", de: "Lachs mit Kartoffeln oder Salat", pt: "Salmão com batatas ou salada", fr: "Saumon, pommes de terre ou salade" },
  a2: { en: "Rice with braised pork cheek & truffle", de: "Reis mit geschmorten Schweinebäckchen und Trüffel", pt: "Arroz de bochecha de porco e trufa", fr: "Riz à la joue de porc braisée et à la truffe" },
  a3: { en: "Octopus rice", de: "Reis mit Oktopus", pt: "Arroz de polvo", fr: "Riz au poulpe" },
  c15: { en: "Baby squid with migas (fried breadcrumbs)", de: "Baby-Tintenfische mit Migas (gebratenen Brotkrumen)", pt: "Lulinhas com migas (pão frito esmigalhado)", fr: "Chipirons aux migas (mie de pain frite)" },
  c3: { en: "Toasted noodles with pear aioli", de: "Geröstete Nudeln mit Birnen-Aioli", pt: "Massa fina tostada com aioli de pera", fr: "Vermicelles grillés à l’aïoli de poire" },
  c9: { en: "Cochinita pibil brioche (Mexican-style slow-roasted pork)", de: "Brioche mit Cochinita Pibil (mexikanisches Schmorschwein)", pt: "Brioche de cochinita pibil (porco assado à mexicana)", fr: "Brioche à la cochinita pibil (porc mariné à la mexicaine)" },
  c5: { en: "Potatoes with egg & truffle", de: "Kartoffeln mit Ei und Trüffel", pt: "Batatas com ovo e trufa", fr: "Pommes de terre, œuf et truffe" },
  c6: { en: "Sirloin burger with bacon & cheese", de: "Filet-Burger mit Bacon und Käse", pt: "Hambúrguer de lombo com bacon e queijo", fr: "Burger de filet, bacon et fromage" },
  c7: { en: "Roast chicken burger with cheddar sauce", de: "Burger mit Brathähnchen und Cheddar-Soße", pt: "Hambúrguer de frango assado com molho cheddar", fr: "Burger de poulet rôti, sauce cheddar" },
  c10: { en: "Iberian pork (presa) burger with homemade sauce", de: "Burger von der iberischen Presa mit hausgemachter Soße", pt: "Hambúrguer de presa ibérica com molho caseiro", fr: "Burger de presa ibérique, sauce maison" },
  c8: { en: "Marinated tuna", de: "Marinierter Thunfisch", pt: "Atum marinado", fr: "Thon mariné" },
  c11: { en: "Beef meatballs in tomato sauce", de: "Rindfleischbällchen in Tomatensoße", pt: "Almôndegas de vaca com molho de tomate", fr: "Boulettes de bœuf à la sauce tomate" },
  c12: { en: "Cuban sandwich", de: "Kubanisches Sandwich", pt: "Sanduíche cubana", fr: "Sandwich cubain" },
  c13: { en: "Roast pork belly", de: "Gebratener Schweinebauch", pt: "Entremeada assada", fr: "Poitrine de porc rôtie" },
  c14: { en: "Weever fish, Rota style (tomato & pepper sauce)", de: "Petermännchen nach Art von Rota (Tomaten-Paprika-Soße)", pt: "Peixe-aranha à moda de Rota (molho de tomate e pimento)", fr: "Vive à la mode de Rota (sauce tomate et poivron)" },
  a1: { en: "Ask about our rice dishes (weekends)", de: "Fragen Sie nach unseren Reisgerichten (Wochenende)", pt: "Pergunte pelos nossos arrozes (fim de semana)", fr: "Demandez nos plats de riz (week-end)" },
  p1: { en: "Cheesecake with mascarpone ice cream & coulis", de: "Käsekuchen mit Mascarpone-Eis und Coulis", pt: "Tarte de queijo com gelado de mascarpone e coulis", fr: "Cheesecake, glace au mascarpone et coulis" },
  p2: { en: "Chocolate lava cake with pistachio ice cream", de: "Schokoladen-Coulant mit Pistazieneis", pt: "Coulant de chocolate com gelado de pistácio", fr: "Coulant au chocolat, glace à la pistache" },
  p3: { en: "Brioche torrija (Spanish-style French toast)", de: "Brioche-Torrija (spanische Arme Ritter)", pt: "Rabanada de brioche", fr: "Pain perdu à la brioche (torrija)" },
  p4: { en: "Scoop of ice cream (ask for flavours)", de: "Kugel Eis (fragen Sie nach den Sorten)", pt: "Bola de gelado (pergunte pelos sabores)", fr: "Boule de glace (demandez les parfums)" },
  f1: { en: "Iberian pork presa (shoulder cut)", de: "Iberische Presa (Schulterstück vom Schwein)", pt: "Presa de porco ibérico", fr: "Presa de porc ibérique (épaule)" },
  f2: { en: "Beef striploin (lomo bajo)", de: "Rumpsteak (Lomo bajo)", pt: "Vazia de vaca (lomo bajo)", fr: "Faux-filet de bœuf" },
  f3: { en: "Beef rib steak (chuletón)", de: "Rinderkotelett (Chuletón)", pt: "Costeleta de vaca", fr: "Côte de bœuf" },
  f4: { en: "T-bone steak", de: "T-Bone-Steak", pt: "T-Bone", fr: "T-Bone" },
  f5: { en: "Slow-cooked suckling pig with potato parmentier", de: "Spanferkel bei Niedrigtemperatur mit Kartoffelpüree", pt: "Leitão a baixa temperatura com puré de batata", fr: "Cochon de lait basse température, parmentier de pommes de terre" },
  f8: { en: "Garlic prawns (al ajillo)", de: "Garnelen in Knoblauchöl", pt: "Gambas ao alho", fr: "Crevettes à l’ail" },
  f9: { en: "Prawns cooked on rock salt", de: "Garnelen auf Salz gegart", pt: "Gambas ao sal", fr: "Crevettes au gros sel" },
  f10: { en: "Carril clams (Galicia)", de: "Venusmuscheln aus Carril (Galicien)", pt: "Amêijoas de Carril (Galiza)", fr: "Palourdes de Carril (Galice)" },
  f11: { en: "Baby mussels in sauce", de: "Kleine Miesmuscheln in Soße", pt: "Mexilhões pequenos com molho", fr: "Petites moules en sauce" },
  e5: { en: "Braised pork cheek croquettes", de: "Kroketten mit geschmorten Schweinebäckchen", pt: "Croquetes de bochecha de porco", fr: "Croquettes de joue de porc braisée" },
}

/** Nombre en español con el que se escribió cada traducción de plato. */
export const DISH_NAMES: Record<string, string> = {
  e1: "Ensalada de pollo frito y mostaza",
  e2: "Ensaladilla de langostinos",
  e3: "Patatas aliñadas con salmorejo",
  e4: "Patatas bravas caseras",
  e5b: "Croquetas de jamón",
  e5c: "Croquetas de puchero",
  e5d: "Croquetas de gambas",
  e6: "Magnum de foie",
  e7: "Taco de langostinos",
  e10: "Taco de abanico ibérico",
  e8: "Taco de chipirón frito",
  e9: "Ravioli crujiente de alitas",
  t1: "Salmorejo, huevo de codorniz y jamón",
  t2: "Caballa, pimientos y alioli",
  t3: "Anchoas, queso crema y trufa",
  c1: "Solomillo en salsa (carbonara, whisky, brava)",
  c2: "Salmón con patatas o ensalada",
  c15: "Chipirones a su amiga",
  a2: "Arroz de carrillada y trufa",
  a3: "Arroz de pulpo",
  c3: "Fideos tostados con alioli de pera",
  c9: "Brioche de cochinita pibil",
  c5: "Patatas con huevo y trufa",
  c6: "Hamburguesa de solomillo con bacon y queso",
  c7: "Hamburguesa de pollo asado con salsa cheddar",
  c10: "Hamburguesa de presa ibérica con salsa casera",
  c8: "Atún macerado",
  c11: "Albóndigas de vaca con salsa de tomate",
  c12: "Sándwich cubano",
  c13: "Panceta asada",
  c14: "Salvariego con roteña",
  a1: "Preguntar por nuestros arroces (fin de semana)",
  p1: "Tarta de queso con helado de mascarpone y coulis",
  p2: "Coulant de chocolate con helado de pistacho",
  p3: "Torrija de brioche",
  p4: "Bola de helado (preguntar por sabores)",
  f1: "Presa ibérica",
  f2: "Lomo bajo",
  f3: "Chuletón de vaca",
  f4: "T-Bone",
  f5: "Cochinillo a baja temperatura con parmentier de patatas",
  f8: "Gambas al ajillo",
  f9: "Gambas a la sal",
  f10: "Almejas de carril",
  f11: "Mejillones baby en salsa",
  e5: "Croquetas de carrillada",
}

export const WINE_CATEGORY_I18N: Record<string, Translations> = {
  andalucia: { en: "Andalusia — Seville / Cádiz", de: "Andalusien — Sevilla / Cádiz", pt: "Andaluzia — Sevilha / Cádis", fr: "Andalousie — Séville / Cadix" },
}
const WINE_CATEGORY_NAMES: Record<string, string> = {
  andalucia: "Andalucía — Sevilla / Cádiz",
}

const ARROCES_NOTE = "Solo los fines de semana"
const ARROCES_NOTE_I18N: Translations = { en: "Weekends only", de: "Nur am Wochenende", pt: "Só ao fim de semana", fr: "Uniquement le week-end" }

/* ─── Platos nuevos ─── */

const dish = (id: string, extra: Partial<MenuItem> = {}): MenuItem => ({
  id,
  name: DISH_NAMES[id],
  nameI18n: { ...DISH_I18N[id] },
  priceTapa: 0,
  priceMedia: 0,
  samePrice: true,
  order: 0,
  ...extra,
})

/* ─── Helpers ─── */

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order

function insertAfter(items: MenuItem[], afterId: string | null, item: MenuItem) {
  if (items.some((i) => i.id === item.id)) return
  const idx = afterId ? items.findIndex((i) => i.id === afterId) : -1
  if (idx === -1) items.push(item)
  else items.splice(idx + 1, 0, item)
}

function removeIf(items: MenuItem[], id: string, name: string) {
  const idx = items.findIndex((i) => i.id === id && i.name === name)
  if (idx !== -1) items.splice(idx, 1)
}

/** Aplica los cambios pendientes. Devuelve una copia; no modifica el original. */
export function applyContentUpdates(input: MenuData): MenuData {
  const from = input.contentVersion ?? 0
  if (from >= CONTENT_VERSION) return input
  const data: MenuData = JSON.parse(JSON.stringify(input))
  if (from < 3) applyV3(data)
  if (from < 4) applyV4(data)
  if (from < 5) applyV5(data)
  if (from < 6) applyV6(data)
  if (from < 7) applyV7(data)
  if (from < 8) applyV8(data)
  if (from < 9) applyV9(data)
  if (from < 10) applyV10(data)
  if (from < 11) applyV11(data)
  if (from < 12) applyV12(data)
  if (from < 13) applyV13(data)
  if (from < 14) applyV14(data)
  data.contentVersion = CONTENT_VERSION
  return data
}

/** v14 (16/10/2026): chipirones con guarnición, horario de los arroces y traducción del de cola de toro. */
function applyV14(data: MenuData) {
  for (const cat of data.categories ?? []) {
    for (const it of cat.items ?? []) {
      if (it.id === 'c15' && ['Chipirones a su amiga', 'Chipirones con ensalada o patatas'].includes(it.name)) {
        it.name = 'Chipirones'
        it.nameI18n = { en: 'Baby squid', de: 'Baby-Tintenfische', pt: 'Lulinhas', fr: 'Chipirons' }
        it.description = 'Con ensalada o patatas'
        it.descriptionI18n = { en: 'With salad or potatoes', de: 'Mit Salat oder Kartoffeln', pt: 'Com salada ou batatas', fr: 'Avec salade ou pommes de terre' }
      }
      // Renombrado a mano en el admin: las traducciones seguían siendo las del arroz de carrillada
      if (it.name === 'Arroz de cola de toro y trufa' && (!it.nameI18n?.en || it.nameI18n.en === 'Rice with braised pork cheek & truffle')) {
        it.nameI18n = {
          en: 'Oxtail & truffle rice',
          de: 'Reis mit Ochsenschwanz und Trüffel',
          pt: 'Arroz de rabo de boi e trufa',
          fr: 'Riz à la queue de bœuf et à la truffe',
        }
      }
    }
    if (cat.id === 'arroces' && (!cat.note?.trim() || cat.note === 'Solo los fines de semana')) {
      cat.note = 'Fines de semana y festivos, solo a mediodía'
      cat.noteI18n = {
        en: 'Weekends & holidays, lunchtime only',
        de: 'Wochenende & Feiertage, nur mittags',
        pt: 'Fins de semana e feriados, só ao almoço',
        fr: 'Week-ends et jours fériés, le midi uniquement',
      }
    }
  }
}

/** v13 (10/10/2026): pulpo a la plancha (16 €) en Caliente, junto a los chipirones. */
function applyV13(data: MenuData) {
  const cat = (data.categories ?? []).find((c) => c.id === 'caliente')
  if (!cat) return
  const items = [...(cat.items ?? [])].sort(byOrder)
  const pulpo: MenuItem = {
    id: 'c16',
    name: 'Pulpo a la plancha',
    nameI18n: { en: 'Grilled octopus', de: 'Gegrillter Oktopus', pt: 'Polvo grelhado', fr: 'Poulpe à la plancha' },
    priceTapa: 16,
    priceMedia: 16,
    samePrice: true,
    order: 0,
    allergens: ['molusco'],
  }
  insertAfter(items, items.some((i) => i.id === 'c15') ? 'c15' : null, pulpo)
  cat.items = items.map((it, i) => ({ ...it, order: i }))
}

/** v12 (10/10/2026): nombres cortos con el detalle en la descripción (línea pequeña debajo). */
const SHORT_NAMES: {
  id: string
  from: string
  name?: string
  nameI18n?: Translations
  description: string
  descriptionI18n: Translations
}[] = [
  {
    id: 'e2',
    from: 'Ensaladilla de langostinos',
    description: 'Con huevo frito',
    descriptionI18n: { en: 'With fried egg', de: 'Mit Spiegelei', pt: 'Com ovo estrelado', fr: 'Avec œuf au plat' },
  },
  {
    id: 'c1',
    from: 'Solomillo en salsa (carbonara, whisky, brava)',
    name: 'Solomillo en salsa',
    nameI18n: { en: 'Pork sirloin in sauce', de: 'Schweinefilet in Soße', pt: 'Lombinho de porco com molho', fr: 'Filet mignon de porc en sauce' },
    description: 'A elegir: carbonara, whisky o brava',
    descriptionI18n: {
      en: 'Your choice: carbonara, whisky or brava',
      de: 'Nach Wahl: Carbonara, Whisky oder Brava',
      pt: 'À escolha: carbonara, whisky ou brava',
      fr: 'Au choix : carbonara, whisky ou brava',
    },
  },
  {
    id: 'c2',
    from: 'Salmón con patatas o ensalada',
    name: 'Salmón',
    nameI18n: { en: 'Salmon', de: 'Lachs', pt: 'Salmão', fr: 'Saumon' },
    description: 'Con ensalada o patatas',
    descriptionI18n: { en: 'With salad or potatoes', de: 'Mit Salat oder Kartoffeln', pt: 'Com salada ou batatas', fr: 'Avec salade ou pommes de terre' },
  },
  {
    id: 'c11',
    from: 'Albóndigas de vaca con salsa de tomate',
    name: 'Albóndigas de vaca',
    nameI18n: { en: 'Beef meatballs', de: 'Rindfleischbällchen', pt: 'Almôndegas de vaca', fr: 'Boulettes de bœuf' },
    description: 'Con salsa de tomate',
    descriptionI18n: { en: 'In tomato sauce', de: 'In Tomatensoße', pt: 'Com molho de tomate', fr: 'Sauce tomate' },
  },
  {
    id: 'c7',
    from: 'Pollo asado con salsa cheddar',
    name: 'Pollo asado',
    nameI18n: { en: 'Roast chicken', de: 'Brathähnchen', pt: 'Frango assado', fr: 'Poulet rôti' },
    description: 'Con salsa cheddar',
    descriptionI18n: { en: 'With cheddar sauce', de: 'Mit Cheddar-Soße', pt: 'Com molho cheddar', fr: 'Sauce cheddar' },
  },
]

function applyV12(data: MenuData) {
  for (const cat of data.categories ?? []) {
    for (const it of cat.items ?? []) {
      const sn = SHORT_NAMES.find((x) => x.id === it.id)
      if (!sn || it.name !== sn.from || it.description) continue
      if (sn.name) {
        it.name = sn.name
        if (sn.nameI18n) it.nameI18n = { ...sn.nameI18n }
      }
      it.description = sn.description
      it.descriptionI18n = { ...sn.descriptionI18n }
    }
  }
}

/** v11 (10/10/2026): descripción de la salsa de la burger de presa. */
function applyV11(data: MenuData) {
  for (const cat of data.categories ?? []) {
    const c10 = cat.items?.find((i) => i.id === 'c10')
    if (!c10 || c10.description) continue
    c10.description = 'Salsa de mayonesa, huevo duro, bacon y queso'
    c10.descriptionI18n = {
      en: 'Sauce made with mayonnaise, hard-boiled egg, bacon & cheese',
      de: 'Soße aus Mayonnaise, gekochtem Ei, Bacon und Käse',
      pt: 'Molho de maionese, ovo cozido, bacon e queijo',
      fr: 'Sauce à la mayonnaise, œuf dur, bacon et fromage',
    }
    // Huevo (mayonesa, huevo duro) y lácteos (queso) por la salsa; gluten por el pan, como las otras
    if (!c10.allergens?.length) c10.allergens = ['gluten', 'huevo', 'lacteo']
  }
}

/** v10 (10/10/2026): las hamburguesas pasan a su propia sección, con nombres cortos. */
const BURGERS: { id: string; from: string; name: string; nameI18n: Translations }[] = [
  {
    id: 'c6',
    from: 'Hamburguesa de solomillo con bacon y queso',
    name: 'Clásica con bacon y queso',
    nameI18n: { en: 'Classic with bacon & cheese', de: 'Klassisch mit Bacon und Käse', pt: 'Clássico com bacon e queijo', fr: 'Classique, bacon et fromage' },
  },
  {
    id: 'c7',
    from: 'Hamburguesa de pollo asado con salsa cheddar',
    name: 'Pollo asado con salsa cheddar',
    nameI18n: { en: 'Roast chicken with cheddar sauce', de: 'Brathähnchen mit Cheddar-Soße', pt: 'Frango assado com molho cheddar', fr: 'Poulet rôti, sauce cheddar' },
  },
  {
    id: 'c10',
    from: 'Hamburguesa de presa ibérica',
    name: 'Presa ibérica',
    nameI18n: { en: 'Iberian pork presa', de: 'Iberische Presa', pt: 'Presa ibérica', fr: 'Presa ibérique' },
  },
]

function applyV10(data: MenuData) {
  const cats = data.categories ?? []
  if (cats.some((c) => c.id === 'hamburguesas')) return
  const caliente = cats.find((c) => c.id === 'caliente')
  if (!caliente) return
  const moved: MenuItem[] = []
  for (const b of BURGERS) {
    const it = caliente.items.find((i) => i.id === b.id)
    if (!it) continue
    caliente.items = caliente.items.filter((i) => i !== it)
    if (it.name === b.from) {
      it.name = b.name
      it.nameI18n = { ...b.nameI18n }
    }
    moved.push(it)
  }
  if (!moved.length) return
  caliente.items = [...caliente.items].sort(byOrder).map((it, i) => ({ ...it, order: i }))
  cats.push({
    id: 'hamburguesas',
    name: 'Hamburguesas',
    icon: '🍔',
    order: caliente.order + 0.5,
    nameI18n: { en: 'Burgers', de: 'Burger', pt: 'Hambúrgueres', fr: 'Burgers' },
    items: moved.map((it, i) => ({ ...it, order: i })),
  })
  data.categories = [...cats].sort(byOrder).map((c, i) => ({ ...c, order: i }))
}

/** v9 (10/10/2026): la burger de presa ya no lleva «con salsa casera». */
function applyV9(data: MenuData) {
  for (const cat of data.categories ?? []) {
    const c10 = cat.items?.find((i) => i.id === 'c10' && i.name === 'Hamburguesa de presa ibérica con salsa casera')
    if (!c10) continue
    c10.name = 'Hamburguesa de presa ibérica'
    c10.nameI18n = {
      en: 'Iberian pork (presa) burger',
      de: 'Burger von der iberischen Presa',
      pt: 'Hambúrguer de presa ibérica',
      fr: 'Burger de presa ibérique',
    }
  }
}

/** v8 (10/10/2026): la ensalada de pollo lleva salsa de miel y mostaza. */
function applyV8(data: MenuData) {
  const cat = (data.categories ?? []).find((c) => c.id === 'entrantes')
  const e1 = cat?.items?.find((i) => i.id === 'e1' && i.name === 'Ensalada de pollo frito y mostaza')
  if (!e1) return
  e1.name = 'Ensalada de pollo frito con salsa de miel y mostaza'
  e1.nameI18n = {
    en: 'Fried chicken salad with honey mustard dressing',
    de: 'Salat mit frittiertem Hähnchen und Honig-Senf-Dressing',
    pt: 'Salada de frango frito com molho de mel e mostarda',
    fr: 'Salade de poulet frit, sauce miel-moutarde',
  }
}

/** v7 (10/10/2026): las 4 croquetas pasan a ser un solo plato «Croquetas» con sus sabores. */
const CROQUETAS_I18N: Translations = { en: 'Croquettes', de: 'Kroketten', pt: 'Croquetes', fr: 'Croquettes' }
const CROQUETA_SABORES: { from: string; fullName: string; variant: MenuVariant }[] = [
  {
    from: 'e5',
    fullName: 'Croquetas de carrillada',
    variant: { id: 'carrillada', name: 'Carrillada', nameI18n: { en: 'Braised pork cheek', de: 'Geschmorte Schweinebäckchen', pt: 'Bochecha de porco', fr: 'Joue de porc braisée' } },
  },
  {
    from: 'e5b',
    fullName: 'Croquetas de jamón',
    variant: { id: 'jamon', name: 'Jamón', nameI18n: { en: 'Cured ham', de: 'Schinken', pt: 'Presunto', fr: 'Jambon cru' } },
  },
  {
    from: 'e5c',
    fullName: 'Croquetas de puchero',
    variant: { id: 'puchero', name: 'Puchero', nameI18n: { en: 'Puchero (Andalusian stew)', de: 'Puchero (andalusischer Eintopf)', pt: 'Puchero (cozido andaluz)', fr: 'Puchero (pot-au-feu andalou)' } },
  },
  {
    from: 'e5d',
    fullName: 'Croquetas de gambas',
    variant: { id: 'gambas', name: 'Gambas', nameI18n: { en: 'Prawn', de: 'Garnelen', pt: 'Camarão', fr: 'Crevettes' }, allergens: ['crustaceo'] },
  },
]

function applyV7(data: MenuData) {
  const cat = (data.categories ?? []).find((c) => c.id === 'entrantes')
  if (!cat) return
  const items = [...(cat.items ?? [])].sort(byOrder)
  const e5 = items.find((i) => i.id === 'e5' && i.name === 'Croquetas de carrillada')
  if (!e5 || e5.variants?.length) return
  const variants: MenuVariant[] = []
  for (const s of CROQUETA_SABORES) {
    const it: MenuItem | undefined = s.from === 'e5' ? e5 : items.find((i) => i.id === s.from && i.name === s.fullName)
    if (!it) continue
    variants.push({ ...s.variant, nameI18n: { ...s.variant.nameI18n }, ...(it.hidden ? { hidden: true } : {}) })
    if (it !== e5) items.splice(items.indexOf(it), 1)
  }
  e5.name = 'Croquetas'
  e5.nameI18n = { ...CROQUETAS_I18N }
  e5.variants = variants
  // El plato se ve mientras haya algún sabor visible
  if (variants.some((v) => !v.hidden)) delete e5.hidden
  else e5.hidden = true
  cat.items = items.map((it, i) => ({ ...it, order: i }))
}

/** Frase que se añadió en la v5 y se quitó en la v6 (solo para reconocerla). */
const ARROCES_DESCRIPTION_V5 = 'Paella hecha al momento para compartir. Cuantos más seáis, más grande la hacemos: para 2, 3, 4, 5, 6 personas…'

/** v5 (10/10/2026): arroces mínimo 2 personas. */
function applyV5(data: MenuData) {
  const cat = (data.categories ?? []).find((c) => c.id === 'arroces')
  if (cat && cat.minPeople === undefined) cat.minPeople = 2
}

/** v6 (10/10/2026): arroces sin explicación y sin precio por persona (siempre «Consultar»). */
function applyV6(data: MenuData) {
  const cat = (data.categories ?? []).find((c) => c.id === 'arroces')
  if (!cat) return
  if (cat.description === ARROCES_DESCRIPTION_V5) {
    cat.description = ''
    delete cat.descriptionI18n
  }
  cat.pricePerPerson = false
  for (const it of cat.items ?? []) {
    it.priceTapa = 0
    it.priceMedia = 0
    it.samePrice = true
  }
}

/** v4 (10/10/2026): salmón con patatas o ensalada, chipirones a su amiga y dos arroces. */
function applyV4(data: MenuData) {
  for (const cat of data.categories ?? []) {
    const items = [...(cat.items ?? [])].sort(byOrder)

    if (cat.id === 'caliente') {
      const c2 = items.find((i) => i.id === 'c2')
      if (c2 && c2.name === 'Salmón con pipirrana') {
        c2.name = DISH_NAMES.c2
        c2.nameI18n = { ...DISH_I18N.c2 }
      }
      insertAfter(items, 'c2', dish('c15', { allergens: ['molusco', 'gluten'] }))
    } else if (cat.id === 'arroces') {
      // Con los arroces ya en la carta, el aviso genérico se guarda oculto (se puede volver a mostrar)
      const a1 = items.find((i) => i.id === 'a1')
      if (a1 && a1.name === 'Preguntar por nuestros arroces (fin de semana)') a1.hidden = true
      insertAfter(items, null, dish('a2'))
      insertAfter(items, null, dish('a3', { allergens: ['molusco'] }))
    } else continue

    cat.items = items.map((it, i) => ({ ...it, order: i }))
  }
}

/** v3 (oct. 2026): croquetas, tacos, hamburguesas, platos nuevos y traducciones revisadas. */
function applyV3(data: MenuData) {
  for (const cat of data.categories ?? []) {
    const items = [...(cat.items ?? [])].sort(byOrder)
    const find = (id: string) => items.find((i) => i.id === id)

    if (cat.id === 'entrantes') {
      // Croquetas: carrillada y jamón visibles; puchero y gambas guardadas pero ocultas
      const e5 = find('e5')
      if (e5 && e5.name === 'Croquetas sabores') e5.name = DISH_NAMES.e5
      const base = e5 ?? { priceTapa: 4.2, priceMedia: 8.4, samePrice: false, allergens: ['gluten', 'huevo', 'sulfitos'] }
      const croqueta = (id: string, hidden: boolean, allergens: string[] | undefined) =>
        dish(id, { priceTapa: base.priceTapa, priceMedia: base.priceMedia, samePrice: base.samePrice, allergens, ...(hidden ? { hidden: true } : {}) })
      insertAfter(items, 'e5', croqueta('e5b', false, base.allergens ? [...base.allergens] : undefined))
      insertAfter(items, 'e5b', croqueta('e5c', true, base.allergens ? [...base.allergens] : undefined))
      const gambasAllergens = base.allergens ? Array.from(new Set([...base.allergens, 'crustaceo'])) : ['crustaceo']
      insertAfter(items, 'e5c', croqueta('e5d', true, gambasAllergens))
      // Tacos: añadir el de abanico ibérico y ocultar el de chipirón
      insertAfter(items, 'e7', dish('e10', { priceTapa: 7.5, priceMedia: 7.5 }))
      const e8 = find('e8')
      if (e8) e8.hidden = true
    }

    if (cat.id === 'caliente') {
      // Brioche de pulled pork → brioche de cochinita pibil (mismo sitio y precio)
      const c4 = find('c4')
      if (c4 && c4.name === 'Brioche de pulled pork') {
        const idx = items.indexOf(c4)
        items.splice(idx, 1, dish('c9', { priceTapa: c4.priceTapa, priceMedia: c4.priceMedia, samePrice: c4.samePrice }))
      }
      const c6 = find('c6')
      if (c6 && c6.name === 'Hamburguesa') c6.name = DISH_NAMES.c6
      const c7 = find('c7')
      if (c7 && c7.name === 'Hamburguesa de pollo asado') {
        c7.name = DISH_NAMES.c7
        if (c7.allergens && !c7.allergens.includes('lacteo')) c7.allergens = [...c7.allergens, 'lacteo']
      }
      insertAfter(items, 'c7', dish('c10'))
      const c8 = find('c8')
      if (c8) c8.hidden = true
      insertAfter(items, null, dish('c11'))
      insertAfter(items, null, dish('c12'))
      insertAfter(items, null, dish('c13'))
      insertAfter(items, null, dish('c14', { hidden: true }))
    }

    if (cat.id === 'arroces' && cat.note === undefined) {
      cat.note = ARROCES_NOTE
      cat.noteI18n = { ...ARROCES_NOTE_I18N }
    }

    if (cat.id === 'postres') {
      insertAfter(items, null, dish('p4', { priceTapa: 3, priceMedia: 3 }))
    }

    if (cat.id === 'fuera-carta') {
      // Vuelven a su sitio en la carta (Entrantes y Caliente)
      removeIf(items, 'f6', 'Taco de abanico')
      removeIf(items, 'f7', 'Hamburguesa de presa')
    }

    // Traducciones revisadas, solo si el nombre en español sigue siendo el mismo
    if (CATEGORY_I18N[cat.id] && cat.name === CATEGORY_NAMES[cat.id]) cat.nameI18n = { ...CATEGORY_I18N[cat.id] }
    for (const it of items) {
      if (DISH_I18N[it.id] && it.name === DISH_NAMES[it.id]) it.nameI18n = { ...DISH_I18N[it.id] }
    }

    cat.items = items.map((it, i) => ({ ...it, order: i }))
  }

  for (const wc of data.wineCategories ?? []) {
    if (WINE_CATEGORY_I18N[wc.id] && wc.name === WINE_CATEGORY_NAMES[wc.id]) wc.nameI18n = { ...WINE_CATEGORY_I18N[wc.id] }
  }

}
