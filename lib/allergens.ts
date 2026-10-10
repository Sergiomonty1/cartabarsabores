/** Claves de alérgenos disponibles, en el orden en que se muestran en el selector. */
export const ALLERGEN_KEYS = [
  'gluten',
  'huevo',
  'lacteo',
  'mostaza',
  'soja',
  'sulfitos',
  'apio',
  'cacahuetes',
  'crustaceo',
  'pescado',
  'sesamo',
  'fruto-cascara',
  'molusco',
] as const

/** Ruta del icono de cada alérgeno en /public. */
export const ALLERGEN_SRC: Record<string, string> = {
  gluten: '/alergenos/gluten.png',
  huevo: '/alergenos/alergenos-huevos.png',
  lacteo: '/alergenos/lacteos.png',
  mostaza: '/alergenos/mostaza.png',
  soja: '/alergenos/alergenos-soja.png',
  sulfitos: '/alergenos/alergenos-sulfitos.png',
  apio: '/alergenos/apio.png',
  cacahuetes: '/alergenos/cacahuetes.png',
  crustaceo: '/alergenos/crustaceo.png',
  pescado: '/alergenos/pescado.png',
  sesamo: '/alergenos/sesamo.png',
  'fruto-cascara': '/alergenos/fruto-cascara.png',
  molusco: '/alergenos/molusco.png',
}

/** Lista de alérgenos con su icono, en el orden del selector. */
export const ALLERGENS: { id: string; src: string }[] = ALLERGEN_KEYS.map((id) => ({ id, src: ALLERGEN_SRC[id] }))

/** Alérgenos de un plato: los suyos + los de los sabores visibles (en el orden del selector). */
export function dishAllergens(item: { allergens?: string[]; variants?: { hidden?: boolean; allergens?: string[] }[] }): string[] {
  const all: string[] = [...(item.allergens ?? [])]
  for (const v of item.variants ?? []) if (!v.hidden) all.push(...(v.allergens ?? []))
  const known = ALLERGEN_KEYS.filter((k) => all.includes(k)) as string[]
  const unknown = all.filter((a, i) => !known.includes(a) && all.indexOf(a) === i)
  return [...known, ...unknown]
}
