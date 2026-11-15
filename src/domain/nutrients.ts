import type { Food, Nutrients } from './types'

export const ZERO_NUTRIENTS: Nutrients = {
  kcal: 0, proteinG: 0, fatG: 0, carbG: 0, fiberG: 0, sodiumMg: 0,
  calciumMg: 0, ironMg: 0, potassiumMg: 0, magnesiumMg: 0, vitaminDUg: 0,
}

const KEYS = Object.keys(ZERO_NUTRIENTS) as (keyof Nutrients)[]

export function nutrientsFor(food: Food, grams: number): Nutrients {
  const out = { ...ZERO_NUTRIENTS }
  for (const k of KEYS) out[k] = (food.per100g[k] * grams) / 100
  return out
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  const out = { ...ZERO_NUTRIENTS }
  for (const n of list) for (const k of KEYS) out[k] += n[k]
  return out
}
