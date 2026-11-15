import type { DayTargets } from './targets'
import type { Food, Nutrients } from './types'

export type RowStatus = 'under' | 'ok' | 'over'
export interface SummaryRow { key: keyof Nutrients; label: string; unit: string; eaten: number; target: number; status: RowStatus }

const LABELS: [keyof Nutrients, string, string][] = [
  ['kcal', 'พลังงาน', 'kcal'],
  ['carbG', 'คาร์บ', 'g'],
  ['fiberG', 'ใยอาหาร', 'g'],
  ['proteinG', 'โปรตีน', 'g'],
  ['fatG', 'ไขมัน', 'g'],
  ['sodiumMg', 'โซเดียม', 'mg'],
  ['calciumMg', 'แคลเซียม', 'mg'],
  ['ironMg', 'เหล็ก', 'mg'],
  ['potassiumMg', 'โพแทสเซียม', 'mg'],
  ['magnesiumMg', 'แมกนีเซียม', 'mg'],
  ['vitaminDUg', 'วิตามินดี', 'µg'],
]

function targetFor(t: DayTargets, key: keyof Nutrients): number {
  switch (key) {
    case 'kcal': return t.kcal
    case 'proteinG': return t.proteinG
    case 'fatG': return t.fatG
    case 'carbG': return t.carbG
    case 'fiberG': return t.fiberG
    case 'sodiumMg': return t.sodiumMaxMg
    default: return t.micros[key]
  }
}

function status(key: keyof Nutrients, eaten: number, target: number): RowStatus {
  if (key === 'sodiumMg') return eaten <= target ? 'ok' : 'over'
  const r = target > 0 ? eaten / target : 1
  return r < 0.9 ? 'under' : r > 1.1 ? 'over' : 'ok'
}

export function foodLabel(f: Food): string {
  return f.state === 'na' ? f.nameTh : `${f.nameTh} (${f.state === 'cooked' ? 'สุก' : 'ดิบ'})`
}

function gramsToFill(gap: number, per100g: number): number {
  return Math.round(gap / (per100g / 100) / 10) * 10
}

/** A food counts as a fibre source at 3 g fibre or more per 100 kcal (vegetables, fruit, beans; not rice). */
const FIBER_PER_100KCAL = 3

export function dailySummary(targets: DayTargets, eaten: Nutrients, foods: Food[], fiberFoods: Food[] = foods) {
  const rows: SummaryRow[] = LABELS.map(([key, label, unit]) => {
    const target = targetFor(targets, key)
    return { key, label, unit, eaten: eaten[key], target, status: status(key, eaten[key], target) }
  })
  const suggestions: string[] = []

  const proteinGap = Math.round(targets.proteinG - eaten.proteinG)
  if (proteinGap >= 15) {
    const best = [...foods]
      .filter((f) => f.per100g.proteinG > 0 && f.per100g.kcal > 0)
      .sort((a, b) => b.per100g.proteinG / b.per100g.kcal - a.per100g.proteinG / a.per100g.kcal)[0]
    suggestions.push(
      best
        ? `ยังขาดโปรตีน ${proteinGap} g — เช่น ${foodLabel(best)} ${gramsToFill(proteinGap, best.per100g.proteinG)} g`
        : `ยังขาดโปรตีน ${proteinGap} g`,
    )
  }
  const fiberGap = Math.round(targets.fiberG - eaten.fiberG)
  if (fiberGap >= 8) {
    const best = [...fiberFoods].filter((f) => f.per100g.kcal > 0 && (f.per100g.fiberG / f.per100g.kcal) * 100 >= FIBER_PER_100KCAL)
      .sort((a, b) => b.per100g.fiberG / b.per100g.kcal - a.per100g.fiberG / a.per100g.kcal)[0]
    suggestions.push(
      best ? `ยังขาดใยอาหาร ${fiberGap} g — เพิ่มผักผลไม้ เช่น ${foodLabel(best)}` : `ยังขาดใยอาหาร ${fiberGap} g — เพิ่มผักผลไม้`,
    )
  }
  if (eaten.sodiumMg > targets.sodiumMaxMg) suggestions.push('โซเดียมเกินเป้าแล้ว — มื้อที่เหลือเลี่ยงน้ำซุป/น้ำจิ้ม')
  return { rows, suggestions }
}
