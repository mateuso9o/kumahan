import type { MicroTargets, Profile } from './types'

export interface DayTargets {
  kcal: number
  proteinG: number
  fatG: number
  carbG: number
  fiberG: number
  sodiumMaxMg: number
  waterMl: number
  micros: MicroTargets
  medicalBanner: boolean
}

const KCAL_PER_KG = 7700
const MAX_WEEKLY_CHANGE = 150
const PROTEIN_G_PER_KG = 2.0
const SPECIAL_PROTEIN_G_PER_KG = 0.8

export function bmi(kg: number, heightCm: number): number {
  return kg / (heightCm / 100) ** 2
}

export function proteinRefWeight(p: Profile, kg: number): number {
  return bmi(kg, p.heightCm) >= 25 ? p.targetWeightKg : kg
}

/** Special handling applies when the profile says so or the age is under 18, whatever the profile says. */
export function isSpecial(p: Profile, age?: number): boolean {
  return p.specialGroup !== 'none' || (age !== undefined && age < 18)
}

export function effectiveRatePct(p: Profile, trendKg: number, age?: number): number {
  if (p.goal === 'maintain' || isSpecial(p, age)) return 0
  if (trendKg <= p.targetWeightKg) return 0
  if (trendKg - p.targetWeightKg <= 5) return -0.5
  return p.weeklyRatePct
}

export function weeklyKcalTarget(args: {
  tdee: number
  trendKg: number
  ratePct: number
  bmr: number
  previous: number | null
}): number {
  const { tdee, trendKg, ratePct, bmr, previous } = args
  let kcal = tdee + ((ratePct / 100) * trendKg * KCAL_PER_KG) / 7
  if (previous !== null) {
    kcal = Math.min(previous + MAX_WEEKLY_CHANGE, Math.max(previous - MAX_WEEKLY_CHANGE, kcal))
  }
  if (kcal < bmr) return Math.ceil(bmr / 10) * 10
  return Math.round(kcal / 10) * 10
}

export function dayTargets(p: Profile, trendKg: number, weeklyKcal: number, micros: MicroTargets, age?: number): DayTargets {
  const special = isSpecial(p, age)
  const ref = proteinRefWeight(p, trendKg)
  const proteinG = Math.round(special ? SPECIAL_PROTEIN_G_PER_KG * trendKg : PROTEIN_G_PER_KG * ref)
  const fatG = Math.round(Math.max((0.25 * weeklyKcal) / 9, 0.5 * ref))
  const carbG = Math.max(0, Math.round((weeklyKcal - proteinG * 4 - fatG * 9) / 4))
  return {
    kcal: weeklyKcal,
    proteinG,
    fatG,
    carbG,
    fiberG: Math.round((14 * weeklyKcal) / 1000),
    sodiumMaxMg: 2000,
    waterMl: Math.round(33 * trendKg),
    micros,
    medicalBanner: special,
  }
}
