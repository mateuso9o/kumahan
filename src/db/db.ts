import Dexie, { type EntityTable } from 'dexie'
import type { Food, Profile, WeighIn } from '../domain/types'

export interface FoodLog {
  id: string
  profileId: string
  date: string
  foodId: string
  grams: number
  source: 'weighed' | 'photo' | 'standard_menu'
  estimated: boolean
  createdAt: number
}
export interface Recipe { id: string; profileId: string; name: string; items: { foodId: string; grams: number }[] }
export interface WaistLog { profileId: string; date: string; cm: number }
export interface CycleLog { profileId: string; date: string }
export interface DayStatus { profileId: string; date: string; complete: boolean }
export interface TargetRecord { profileId: string; weekStart: string; kcal: number; tdee: number; reason: string }

export type AppDb = Dexie & {
  profiles: EntityTable<Profile, 'id'>
  foods: EntityTable<Food, 'id'>
  foodLogs: EntityTable<FoodLog, 'id'>
  recipes: EntityTable<Recipe, 'id'>
  weighIns: Dexie.Table<WeighIn, [string, string]>
  waistLogs: Dexie.Table<WaistLog, [string, string]>
  cycleLogs: Dexie.Table<CycleLog, [string, string]>
  dayStatus: Dexie.Table<DayStatus, [string, string]>
  targets: Dexie.Table<TargetRecord, [string, string]>
}

export function openDb(name: string): AppDb {
  const db = new Dexie(name) as AppDb
  db.version(1).stores({
    profiles: 'id',
    foods: 'id, nameTh, nameEn',
    foodLogs: 'id, [profileId+date]',
    recipes: 'id, profileId',
    weighIns: '[profileId+date], profileId',
    waistLogs: '[profileId+date], profileId',
    cycleLogs: '[profileId+date], profileId',
    dayStatus: '[profileId+date]',
    targets: '[profileId+weekStart], profileId',
  })
  return db
}
