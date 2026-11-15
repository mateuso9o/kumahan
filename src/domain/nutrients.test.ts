import { nutrientsFor, sumNutrients, ZERO_NUTRIENTS } from './nutrients'
import seed from '../data/foods.seed.json'
import type { Food } from './types'

const foods = seed as Food[]
const byName = (th: string, state: Food['state']) => foods.find((f) => f.nameTh === th && f.state === state)!

describe('nutrientsFor', () => {
  test('scales per-100g values by grams', () => {
    const rice = byName('ข้าวขาว', 'cooked')
    const n = nutrientsFor(rice, 200)
    expect(n.kcal).toBeCloseTo(rice.per100g.kcal * 2, 6)
    expect(n.ironMg).toBeCloseTo(rice.per100g.ironMg * 2, 6)
  })
})

describe('sumNutrients', () => {
  test('adds every field', () => {
    const a = { ...ZERO_NUTRIENTS, kcal: 100, proteinG: 10, vitaminDUg: 1 }
    const b = { ...ZERO_NUTRIENTS, kcal: 50, proteinG: 5, vitaminDUg: 2 }
    expect(sumNutrients([a, b])).toEqual({ ...ZERO_NUTRIENTS, kcal: 150, proteinG: 15, vitaminDUg: 3 })
  })
  test('empty list is zero', () => expect(sumNutrients([])).toEqual(ZERO_NUTRIENTS))
})

describe('food seed', () => {
  test('has the curated list', () => expect(foods.length).toBe(70))
  test('every food has a source reference', () => {
    for (const f of foods) expect(f.sourceRef, f.nameEn).toMatch(/\S/)
  })
  test('kcal matches 4P + 4(C - fiber) + 2 fiber + 9F within 15%', () => {
    for (const f of foods) {
      const { kcal, proteinG, carbG, fatG, fiberG } = f.per100g
      const est = 4 * proteinG + 4 * (carbG - fiberG) + 2 * fiberG + 9 * fatG
      expect(Math.abs(kcal - est) / Math.max(kcal, 1), `${f.nameEn} ${f.state}`).toBeLessThan(0.15)
    }
  })
  test('raw vs cooked rice energy', () => {
    expect(byName('ข้าวขาว', 'raw').per100g.kcal).toBeGreaterThan(300)
    expect(byName('ข้าวขาว', 'cooked').per100g.kcal).toBeLessThan(150)
  })
  test('ids are unique', () => expect(new Set(foods.map((f) => f.id)).size).toBe(foods.length))
})
