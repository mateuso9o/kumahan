import seed from '../data/foods.seed.json'
import { addDays } from '../domain/energy'
import { nutrientsFor } from '../domain/nutrients'
import type { DayIntake, Food, Profile, WeighIn } from '../domain/types'
import { openDb, type FoodLog, type Recipe, type TargetRecord, type WaistLog, type CycleLog } from './db'

export type { FoodLog, Recipe, TargetRecord, WaistLog, CycleLog }

const newId = () => crypto.randomUUID()

// Strictly increasing so logs added in the same millisecond keep their order.
let lastStamp = 0
const stamp = () => (lastStamp = Math.max(Date.now(), lastStamp + 1))

export async function createRepo(dbName = 'kumahan') {
  const db = openDb(dbName)
  await db.transaction('rw', db.foods, async () => {
    if ((await db.foods.count()) === 0) await db.foods.bulkPut(seed as Food[])
  })

  const repo = {
    saveProfile: (p: Profile) => db.profiles.put(p).then(() => p),
    listProfiles: () => db.profiles.toArray(),

    getFood: (id: string) => db.foods.get(id),
    allFoods: () => db.foods.toArray(),
    async loggedFoods(profileId: string): Promise<Food[]> {
      const ids = new Set((await db.foodLogs.filter((l) => l.profileId === profileId).toArray()).map((l) => l.foodId))
      return (await db.foods.bulkGet([...ids])).filter((f): f is Food => !!f)
    },
    async searchFoods(q: string): Promise<Food[]> {
      const needle = q.trim().toLowerCase()
      if (!needle) return []
      return db.foods
        .filter((f) => f.nameTh.toLowerCase().includes(needle) || f.nameEn.toLowerCase().includes(needle))
        .toArray()
    },

    async addFoodLog(l: Omit<FoodLog, 'id' | 'createdAt'>): Promise<FoodLog> {
      const log: FoodLog = { ...l, id: newId(), createdAt: stamp() }
      await db.foodLogs.add(log)
      return log
    },
    deleteFoodLog: (id: string) => db.foodLogs.delete(id),
    async logsForDay(profileId: string, date: string): Promise<FoodLog[]> {
      const logs = await db.foodLogs.where('[profileId+date]').equals([profileId, date]).toArray()
      return logs.sort((a, b) => a.createdAt - b.createdAt)
    },

    async saveRecipe(r: Omit<Recipe, 'id'> & { id?: string }): Promise<Recipe> {
      const recipe: Recipe = { ...r, id: r.id ?? newId() }
      await db.recipes.put(recipe)
      return recipe
    },
    listRecipes: (profileId: string) => db.recipes.where('profileId').equals(profileId).toArray(),
    async logRecipe(recipeId: string, date: string): Promise<FoodLog[]> {
      const r = await db.recipes.get(recipeId)
      if (!r) throw new Error(`recipe ${recipeId} not found`)
      const out: FoodLog[] = []
      for (const it of r.items) {
        out.push(await repo.addFoodLog({ profileId: r.profileId, date, foodId: it.foodId, grams: it.grams, source: 'weighed', estimated: false }))
      }
      return out
    },

    addWeighIn: (w: WeighIn) => db.weighIns.put(w),
    async weighIns(profileId: string): Promise<WeighIn[]> {
      return (await db.weighIns.where('profileId').equals(profileId).toArray()).sort((a, b) => a.date.localeCompare(b.date))
    },
    addWaist: (w: WaistLog) => db.waistLogs.put(w),
    async waistLogs(profileId: string): Promise<WaistLog[]> {
      return (await db.waistLogs.where('profileId').equals(profileId).toArray()).sort((a, b) => a.date.localeCompare(b.date))
    },
    addCycleDay: (c: CycleLog) => db.cycleLogs.put(c),
    cycleDays: (profileId: string) => db.cycleLogs.where('profileId').equals(profileId).toArray(),
    removeCycleDay: (profileId: string, date: string) => db.cycleLogs.delete([profileId, date]),

    setDayComplete: (profileId: string, date: string, complete: boolean) => db.dayStatus.put({ profileId, date, complete }),
    async isDayComplete(profileId: string, date: string): Promise<boolean> {
      return (await db.dayStatus.get([profileId, date]))?.complete ?? false
    },
    async dayIntakes(profileId: string, fromDate: string, toDate: string): Promise<DayIntake[]> {
      const out: DayIntake[] = []
      for (let d = fromDate; d <= toDate; d = addDays(d, 1)) {
        let kcal = 0
        for (const l of await repo.logsForDay(profileId, d)) {
          const f = await db.foods.get(l.foodId)
          if (f) kcal += nutrientsFor(f, l.grams).kcal
        }
        out.push({ date: d, kcal, complete: await repo.isDayComplete(profileId, d) })
      }
      return out
    },

    async latestTarget(profileId: string): Promise<TargetRecord | undefined> {
      const all = await db.targets.where('profileId').equals(profileId).toArray()
      return all.sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]
    },
    saveTarget: (t: TargetRecord) => db.targets.put(t),
  }
  return repo
}

export type Repo = Awaited<ReturnType<typeof createRepo>>
