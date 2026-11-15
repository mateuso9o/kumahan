import 'fake-indexeddb/auto'
import { createRepo, type Repo } from '../db/repo'
import { runWeeklyUpdate } from './weeklyUpdate'
import { addDays } from './energy'
import type { Profile } from './types'

const me: Profile = {
  id: 'p', name: 'ฉัน', sex: 'male', birthYear: 1996, heightCm: 175, goal: 'recomp', targetWeightKg: 78,
  activityFactor: 1.375, weeklyRatePct: -0.75, specialGroup: 'none', trainingDays: [1, 2, 4, 5],
}
let repo: Repo
let n = 0
beforeEach(async () => {
  repo = await createRepo(`wu-${n++}`)
  await repo.saveProfile(me)
})

test('no weigh-ins: no target yet', async () => {
  expect(await runWeeklyUpdate(repo, 'p', '2026-01-15')).toBeNull()
})

test('first target uses the formula estimate', async () => {
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 100 })
  const t = (await runWeeklyUpdate(repo, 'p', '2026-01-15'))!
  // age 30, bmr 1948.75 * 1.375 = 2679.5; -0.75% of 100 kg/week = -825/day -> 1854.5 < bmr -> 1950
  expect(t.kcal).toBe(1950)
  expect(t.reason).toContain('สูตรประมาณ')
  expect((await repo.latestTarget('p'))!.weekStart).toBe('2026-01-15')
})

test('target younger than 7 days is kept', async () => {
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 100 })
  await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-12', kcal: 2300, tdee: 3000, reason: 'x' })
  expect(await runWeeklyUpdate(repo, 'p', '2026-01-15')).toBeNull()
})

test('fewer than 5 complete days in the week keeps the previous target', async () => {
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 100 })
  await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-08', kcal: 2300, tdee: 3000, reason: 'x' })
  const t = (await runWeeklyUpdate(repo, 'p', '2026-01-15'))!
  expect(t.kcal).toBe(2300)
  expect(t.reason).toContain('บันทึกไม่ครบ')
})

test('14 complete days use real intake and trend', async () => {
  const start = '2026-01-01'
  for (let i = 0; i < 14; i++) {
    const d = addDays(start, i)
    await repo.addWeighIn({ profileId: 'p', date: d, kg: 100 - i * 0.05 })
    await repo.addFoodLog({ profileId: 'p', date: d, foodId: 'usda-168878', grams: 1800, source: 'weighed', estimated: false })
    await repo.setDayComplete('p', d, true)
  }
  await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-08', kcal: 2300, tdee: 3000, reason: 'x' })
  const t = (await runWeeklyUpdate(repo, 'p', '2026-01-15'))!
  expect(t.reason).toContain('แนวโน้ม')
  expect(Math.abs(t.kcal - 2300)).toBeLessThanOrEqual(150)
})

test('a person already losing at the target rate does not see the target fall every week', async () => {
  const start = '2026-01-01'
  const kcalPerDay = 2000
  const targets: number[] = []
  for (let i = 0; i < 36; i++) {
    const d = addDays(start, i)
    await repo.addWeighIn({ profileId: 'p', date: d, kg: 100 - 0.107 * i })
    // rice cooked is 130 kcal/100 g
    await repo.addFoodLog({ profileId: 'p', date: d, foodId: 'usda-168878', grams: (kcalPerDay / 130) * 100, source: 'weighed', estimated: false })
    await repo.setDayComplete('p', d, true)
    if (i % 7 === 0) {
      const t = await runWeeklyUpdate(repo, 'p', d)
      if (t) targets.push(t.kcal)
    }
  }
  const drops = targets.slice(1).filter((k, i) => k < targets[i])
  expect(drops.length).toBe(0)
})

test('reaching the target weight switches to maintenance and says so', async () => {
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 77 })
  const t = (await runWeeklyUpdate(repo, 'p', '2026-01-15'))!
  expect(t.reason).toContain('ถึงน้ำหนักเป้าแล้ว')
  expect(t.kcal).toBe(t.tdee - (t.tdee % 10 >= 5 ? t.tdee % 10 - 10 : t.tdee % 10))
})
