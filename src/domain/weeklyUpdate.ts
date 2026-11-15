import type { Repo, TargetRecord } from '../db/repo'
import { addDays, adaptiveTdee, bmrMifflin, daysBetween, ewmaTrend, trendAt } from './energy'
import { effectiveRatePct, weeklyKcalTarget } from './targets'

export async function runWeeklyUpdate(repo: Repo, profileId: string, today: string): Promise<TargetRecord | null> {
  const profile = (await repo.listProfiles()).find((p) => p.id === profileId)
  if (!profile) return null
  const weighIns = await repo.weighIns(profileId)
  if (weighIns.length === 0) return null
  const previous = await repo.latestTarget(profileId)
  if (previous && daysBetween(previous.weekStart, today) < 7) return null

  const trend = ewmaTrend(weighIns)
  const trendKg = trendAt(trend, today)!
  const age = Number(today.slice(0, 4)) - profile.birthYear
  const bmr = bmrMifflin(profile.sex, trendKg, profile.heightCm, age)
  const yesterday = addDays(today, -1)
  const intakes = await repo.dayIntakes(profileId, addDays(yesterday, -13), yesterday)
  const completeDays = intakes.filter((d) => d.complete).length
  const lastWeekComplete = intakes.slice(-7).filter((d) => d.complete).length
  const adaptive = adaptiveTdee(intakes, weighIns)
  const tdee = Math.round(adaptive ?? bmr * profile.activityFactor)

  let kcal: number
  let reason: string
  if (previous && lastWeekComplete < 5) {
    kcal = previous.kcal
    reason = `คงเป้าเดิม เพราะสัปดาห์ที่แล้วบันทึกไม่ครบ (${lastWeekComplete}/7 วัน) — ข้อมูลไม่พอจะปรับอย่างแม่นยำ`
  } else {
    const ratePct = effectiveRatePct(profile, trendKg, age)
    kcal = weeklyKcalTarget({ tdee, trendKg, ratePct, bmr, previous: previous?.kcal ?? null })
    const base = adaptive === null
      ? `ใช้สูตรประมาณ (BMR × กิจกรรม ≈ ${tdee} kcal) เพราะบันทึกครบแค่ ${completeDays} วันใน 14 วัน`
      : `คำนวณจากการกินจริงและแนวโน้มน้ำหนัก: ร่างกายใช้ ≈ ${tdee} kcal/วัน`
    const change = previous ? kcal - previous.kcal : 0
    const delta = previous ? (change === 0 ? ' — เป้าคงเดิม' : ` — ${change > 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(change)} kcal`) : ''
    const floor = kcal <= Math.ceil(bmr / 10) * 10 && ratePct < 0 ? ' (ไม่ต่ำกว่า BMR เพื่อความปลอดภัย)' : ''
    const atTarget = profile.goal !== 'maintain' && trendKg <= profile.targetWeightKg ? ' — ถึงน้ำหนักเป้าแล้ว เป้าจึงเป็นการคงน้ำหนัก' : ''
    reason = base + delta + floor + atTarget
  }
  const record: TargetRecord = { profileId, weekStart: today, kcal, tdee, reason }
  await repo.saveTarget(record)
  return record
}
