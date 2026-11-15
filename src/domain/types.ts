export type Sex = 'male' | 'female'
export type Goal = 'recomp' | 'fat_loss' | 'maintain'
export type SpecialGroup = 'none' | 'under18' | 'pregnant' | 'kidney'
export type ActivityFactor = 1.2 | 1.375 | 1.55 | 1.725

export interface Profile {
  id: string
  name: string
  sex: Sex
  birthYear: number
  heightCm: number
  goal: Goal
  targetWeightKg: number
  activityFactor: ActivityFactor
  /** e.g. -0.75 = lose 0.75% of body weight per week */
  weeklyRatePct: number
  specialGroup: SpecialGroup
  /** 0 = Sunday */
  trainingDays: number[]
}

export interface WeighIn {
  profileId: string
  date: string
  kg: number
}

export interface DayIntake {
  date: string
  kcal: number
  complete: boolean
}

export interface TrendPoint {
  date: string
  trend: number
}

export interface Nutrients {
  kcal: number
  proteinG: number
  fatG: number
  carbG: number
  fiberG: number
  sodiumMg: number
  calciumMg: number
  ironMg: number
  potassiumMg: number
  magnesiumMg: number
  vitaminDUg: number
}

export type MicroTargets = Pick<Nutrients, 'calciumMg' | 'ironMg' | 'potassiumMg' | 'magnesiumMg' | 'vitaminDUg'>

export interface Food {
  id: string
  nameTh: string
  nameEn: string
  state: 'raw' | 'cooked' | 'na'
  source: 'usda' | 'thai_fcd' | 'custom'
  sourceRef: string
  per100g: Nutrients
}
