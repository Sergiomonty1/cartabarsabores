import type { BuilderIngredient, DishBuilder, Translations } from '@/types/menu'
import { ALLERGEN_KEYS } from '@/lib/allergens'

/**
 * Arroz del día: el nombre del plato se monta con los ingredientes elegidos, en los 5 idiomas.
 * Ej.: carrillada + foie → «Arroz de carrillada y foie» / «Rice with braised pork cheek & foie gras».
 */

type L = 'es' | 'en' | 'de' | 'pt' | 'fr'

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)

function word(i: BuilderIngredient, l: L): string {
  if (l === 'es') return lowerFirst(i.name.trim())
  return i.nameI18n?.[l]?.trim() || lowerFirst(i.name.trim())
}

function list(words: string[], and: string): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} ${and} ${words[words.length - 1]}`
}

const AND: Record<L, string> = { es: 'y', en: '&', de: 'und', pt: 'e', fr: 'et' }

function title(l: L, black: boolean, parts: string[]): string {
  const li = list(parts, AND[l])
  switch (l) {
    case 'es':
      return black ? (li ? `Arroz negro con ${li}` : 'Arroz negro') : li ? `Arroz de ${li}` : 'Arroz'
    case 'en':
      return black ? (li ? `Black rice with ${li}` : 'Black rice') : li ? `Rice with ${li}` : 'Rice'
    case 'de':
      return black ? (li ? `Schwarzer Reis mit ${li}` : 'Schwarzer Reis') : li ? `Reis mit ${li}` : 'Reis'
    case 'pt':
      return black ? (li ? `Arroz negro com ${li}` : 'Arroz negro') : li ? `Arroz de ${li}` : 'Arroz'
    case 'fr':
      return black ? (li ? `Riz noir avec ${li}` : 'Riz noir') : li ? `Riz avec ${li}` : 'Riz'
  }
}

/** Nombre, traducciones y alérgenos del plato según los ingredientes elegidos. */
export function buildDish(b: DishBuilder): { name: string; nameI18n: Translations; allergens: string[] } {
  // en el orden en que se han ido eligiendo
  const chosen = b.selected.map((id) => b.options.find((o) => o.id === id)).filter((o): o is BuilderIngredient => !!o)
  const black = chosen.some((o) => o.style)
  const parts = chosen.filter((o) => !o.style)
  const name = title('es', black, parts.map((p) => word(p, 'es')))
  const nameI18n: Translations = {
    en: title('en', black, parts.map((p) => word(p, 'en'))),
    de: title('de', black, parts.map((p) => word(p, 'de'))),
    pt: title('pt', black, parts.map((p) => word(p, 'pt'))),
    fr: title('fr', black, parts.map((p) => word(p, 'fr'))),
  }
  const all = new Set(chosen.flatMap((o) => o.allergens ?? []))
  const allergens = (ALLERGEN_KEYS as readonly string[]).filter((k) => all.has(k))
  return { name, nameI18n, allergens }
}

/* ─── Ingredientes de partida ─── */
const ing = (id: string, name: string, t: [string, string, string, string], allergens?: string[], style?: boolean): BuilderIngredient => ({
  id,
  name,
  nameI18n: { en: t[0], de: t[1], pt: t[2], fr: t[3] },
  ...(allergens ? { allergens } : {}),
  ...(style ? { style } : {}),
})

export const MEAT_RICE_INGREDIENTS: BuilderIngredient[] = [
  ing('carrillada', 'Carrillada', ['braised pork cheek', 'geschmorten Schweinebäckchen', 'bochecha de porco', 'joue de porc braisée']),
  ing('cola-de-toro', 'Cola de toro', ['oxtail', 'Ochsenschwanz', 'rabo de boi', 'queue de bœuf']),
  ing('trufa', 'Trufa', ['truffle', 'Trüffel', 'trufa', 'truffe']),
  ing('foie', 'Foie', ['foie gras', 'Foie gras', 'foie gras', 'foie gras']),
  ing('setas', 'Setas', ['wild mushrooms', 'Pilzen', 'cogumelos', 'champignons']),
  ing('presa', 'Presa ibérica', ['Iberian pork presa', 'iberischer Presa', 'presa ibérica', 'presa ibérique']),
  ing('costillas', 'Costillas', ['pork ribs', 'Schweinerippchen', 'costelinha de porco', 'travers de porc']),
  ing('pollo', 'Pollo', ['chicken', 'Hähnchen', 'frango', 'poulet']),
  ing('conejo', 'Conejo', ['rabbit', 'Kaninchen', 'coelho', 'lapin']),
]

export const SEAFOOD_RICE_INGREDIENTS: BuilderIngredient[] = [
  ing('negro', 'Negro (tinta)', ['', '', '', ''], ['molusco'], true),
  ing('calamar', 'Calamares', ['squid', 'Kalmar', 'lulas', 'calmars'], ['molusco']),
  ing('calamar-potera', 'Calamar de potera frito', ['fried line-caught squid', 'frittiertem, an der Angel gefangenem Kalmar', 'lula frita pescada à linha', 'calmar frit pêché à la ligne'], ['molusco', 'gluten']),
  ing('choco', 'Choco', ['cuttlefish', 'Sepia', 'choco', 'seiche'], ['molusco']),
  ing('chipiron', 'Chipirón', ['baby squid', 'Baby-Tintenfisch', 'lulinhas', 'chipirons'], ['molusco']),
  ing('pulpo', 'Pulpo', ['octopus', 'Oktopus', 'polvo', 'poulpe'], ['molusco']),
  ing('gambas', 'Gambas', ['prawns', 'Garnelen', 'gambas', 'gambas'], ['crustaceo']),
  ing('langostinos', 'Langostinos', ['king prawns', 'Riesengarnelen', 'lagostins', 'langoustines'], ['crustaceo']),
  ing('mejillones', 'Mejillones', ['mussels', 'Miesmuscheln', 'mexilhões', 'moules'], ['molusco']),
  ing('almejas', 'Almejas', ['clams', 'Venusmuscheln', 'amêijoas', 'palourdes'], ['molusco']),
]
