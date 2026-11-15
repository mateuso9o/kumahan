import 'fake-indexeddb/auto'
import { createRepo, type Repo } from './repo'

let repo: Repo
let n = 0
beforeEach(async () => {
  repo = await createRepo(`test-${n++}`)
})

test('seeds foods on first open', async () => {
  const hits = await repo.searchFoods('ไก่')
  expect(hits.some((f) => f.nameTh === 'อกไก่' && f.state === 'raw')).toBe(true)
  expect(hits.some((f) => f.nameTh === 'อกไก่' && f.state === 'cooked')).toBe(true)
})

test('searchFoods matches English case-insensitively', async () => {
  const hits = await repo.searchFoods('CHICKEN BREAST')
  expect(hits.length).toBe(2)
})

test('weigh-in on the same day replaces the earlier one', async () => {
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-01', kg: 100 })
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-01', kg: 99.5 })
  expect(await repo.weighIns('p')).toEqual([{ profileId: 'p', date: '2026-01-01', kg: 99.5 }])
})

test('logRecipe creates one log per item on the given date', async () => {
  const r = await repo.saveRecipe({
    profileId: 'p', name: 'ข้าวอกไก่',
    items: [{ foodId: 'usda-168878', grams: 200 }, { foodId: 'usda-171477', grams: 100 }],
  })
  await repo.logRecipe(r.id, '2026-01-02')
  const logs = await repo.logsForDay('p', '2026-01-02')
  expect(logs.map((l) => [l.foodId, l.grams, l.source])).toEqual([
    ['usda-168878', 200, 'weighed'],
    ['usda-171477', 100, 'weighed'],
  ])
})

test('dayIntakes sums kcal per day and reads completeness', async () => {
  await repo.addFoodLog({ profileId: 'p', date: '2026-01-01', foodId: 'usda-168878', grams: 200, source: 'weighed', estimated: false })
  await repo.addFoodLog({ profileId: 'p', date: '2026-01-02', foodId: 'usda-168878', grams: 100, source: 'weighed', estimated: false })
  await repo.setDayComplete('p', '2026-01-01', true)
  const rice = (await repo.searchFoods('White rice')).find((f) => f.state === 'cooked')!
  const days = await repo.dayIntakes('p', '2026-01-01', '2026-01-03')
  expect(days).toEqual([
    { date: '2026-01-01', kcal: rice.per100g.kcal * 2, complete: true },
    { date: '2026-01-02', kcal: rice.per100g.kcal, complete: false },
    { date: '2026-01-03', kcal: 0, complete: false },
  ])
})

test('loggedFoods returns distinct foods this profile has logged', async () => {
  await repo.addFoodLog({ profileId: 'p', date: '2026-01-01', foodId: 'usda-171477', grams: 100, source: 'weighed', estimated: false })
  await repo.addFoodLog({ profileId: 'p', date: '2026-01-02', foodId: 'usda-171477', grams: 120, source: 'weighed', estimated: false })
  await repo.addFoodLog({ profileId: 'other', date: '2026-01-02', foodId: 'usda-175180', grams: 120, source: 'weighed', estimated: false })
  expect((await repo.loggedFoods('p')).map((f) => f.id)).toEqual(['usda-171477'])
})

test('allFoods returns the whole seed', async () => {
  expect((await repo.allFoods()).length).toBe(70)
})

test('cycle day can be added and removed', async () => {
  await repo.addCycleDay({ profileId: 'p', date: '2026-01-01' })
  await repo.removeCycleDay('p', '2026-01-01')
  expect(await repo.cycleDays('p')).toEqual([])
})

test('deleteFoodLog removes it', async () => {
  const log = await repo.addFoodLog({ profileId: 'p', date: '2026-01-01', foodId: 'usda-168878', grams: 200, source: 'weighed', estimated: false })
  await repo.deleteFoodLog(log.id)
  expect(await repo.logsForDay('p', '2026-01-01')).toEqual([])
})

test('profiles and targets round-trip', async () => {
  await repo.saveProfile({
    id: 'p', name: 'ฉัน', sex: 'male', birthYear: 1996, heightCm: 175, goal: 'recomp', targetWeightKg: 78,
    activityFactor: 1.375, weeklyRatePct: -0.75, specialGroup: 'none', trainingDays: [1, 2, 4, 5],
  })
  expect((await repo.listProfiles()).map((p) => p.name)).toEqual(['ฉัน'])
  await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-01', kcal: 2200, tdee: 2900, reason: 'x' })
  await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-08', kcal: 2150, tdee: 2850, reason: 'y' })
  expect((await repo.latestTarget('p'))!.weekStart).toBe('2026-01-08')
})
