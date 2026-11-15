import { dailySummary } from './dailySummary'
import { ZERO_NUTRIENTS } from './nutrients'
import type { DayTargets } from './targets'
import type { Food } from './types'

const targets: DayTargets = {
  kcal: 2400, proteinG: 156, fatG: 67, carbG: 293, fiberG: 34, sodiumMaxMg: 2000, waterMl: 3300,
  micros: { calciumMg: 800, ironMg: 11.5, magnesiumMg: 320, potassiumMg: 2450, vitaminDUg: 15 }, medicalBanner: false,
}
const chicken: Food = {
  id: 'c', nameTh: 'อกไก่', nameEn: 'Chicken breast', state: 'cooked', source: 'usda', sourceRef: 'x',
  per100g: { ...ZERO_NUTRIENTS, kcal: 165, proteinG: 31 },
}
const rice: Food = { ...chicken, id: 'r', nameTh: 'ข้าวขาว', per100g: { ...ZERO_NUTRIENTS, kcal: 130, proteinG: 2.7 } }
const row = (s: ReturnType<typeof dailySummary>, key: string) => s.rows.find((r) => r.key === key)!

test('suggests the most protein-dense food for a protein gap', () => {
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, proteinG: 116, fiberG: 34 }, [rice, chicken])
  expect(s.suggestions).toContain('ยังขาดโปรตีน 40 g — เช่น อกไก่ (สุก) 130 g')
  expect(row(s, 'proteinG').status).toBe('under')
})

test('protein within 90-110% is ok with no protein suggestion', () => {
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, proteinG: 150, fiberG: 34 }, [chicken])
  expect(row(s, 'proteinG').status).toBe('ok')
  expect(s.suggestions.some((x) => x.includes('โปรตีน'))).toBe(false)
})

test('sodium above the max is over and warns', () => {
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, sodiumMg: 2300 }, [chicken])
  expect(row(s, 'sodiumMg').status).toBe('over')
  expect(s.suggestions).toContain('โซเดียมเกินเป้าแล้ว — มื้อที่เหลือเลี่ยงน้ำซุป/น้ำจิ้ม')
})

test('sodium below the max is ok', () => {
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, sodiumMg: 500 }, [chicken])
  expect(row(s, 'sodiumMg').status).toBe('ok')
})

test('fiber gap of 8 g or more gets a suggestion', () => {
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, fiberG: 20, proteinG: 156 }, [chicken])
  expect(s.suggestions.some((x) => x.startsWith('ยังขาดใยอาหาร 14 g'))).toBe(true)
})

test('fiber suggestion never names a low-fiber food', () => {
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, fiberG: 20, proteinG: 156 }, [{ ...rice, per100g: { ...rice.per100g, fiberG: 0.4 } }])
  expect(s.suggestions).toContain('ยังขาดใยอาหาร 14 g — เพิ่มผักผลไม้')
})

test('fiber suggestion uses the separate fiber food list when given', () => {
  const kale: Food = { ...chicken, id: 'k', nameTh: 'คะน้า', state: 'raw', per100g: { ...ZERO_NUTRIENTS, kcal: 49, fiberG: 3.6 } }
  const s = dailySummary(targets, { ...ZERO_NUTRIENTS, fiberG: 20, proteinG: 156 }, [rice], [rice, kale])
  expect(s.suggestions).toContain('ยังขาดใยอาหาร 14 g — เพิ่มผักผลไม้ เช่น คะน้า (ดิบ)')
})
