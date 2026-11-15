import { proteinRefWeight, effectiveRatePct, weeklyKcalTarget, dayTargets } from './targets'
import type { MicroTargets, Profile } from './types'

const micros: MicroTargets = { calciumMg: 800, ironMg: 10, potassiumMg: 3500, magnesiumMg: 300, vitaminDUg: 15 }
const me: Profile = {
  id: 'me', name: 'me', sex: 'male', birthYear: 1996, heightCm: 175, goal: 'recomp',
  targetWeightKg: 78, activityFactor: 1.375, weeklyRatePct: -0.75, specialGroup: 'none', trainingDays: [1, 2, 4, 5],
}

describe('proteinRefWeight', () => {
  test('uses target weight when BMI >= 25', () => expect(proteinRefWeight(me, 100)).toBe(78))
  test('uses current weight when BMI < 25', () => expect(proteinRefWeight(me, 70)).toBe(70))
})

describe('dayTargets', () => {
  test('macros from kcal and ref weight', () => {
    const t = dayTargets(me, 100, 2400, micros)
    expect(t.proteinG).toBe(156)
    expect(t.fatG).toBe(67)
    expect(t.carbG).toBe(293)
    expect(t.fiberG).toBe(34)
    expect(t.sodiumMaxMg).toBe(2000)
    expect(t.waterMl).toBe(3300)
    expect(t.medicalBanner).toBe(false)
  })
  test('special group kidney: low protein and medical banner', () => {
    const t = dayTargets({ ...me, specialGroup: 'kidney' }, 100, 2400, micros)
    expect(t.proteinG).toBe(80)
    expect(t.medicalBanner).toBe(true)
  })
})

describe('weeklyKcalTarget', () => {
  test('deficit from rate', () =>
    expect(weeklyKcalTarget({ tdee: 3000, trendKg: 100, ratePct: -0.75, bmr: 1949, previous: null })).toBe(2180))
  test('weight jump clamps change to 150 kcal', () =>
    expect(weeklyKcalTarget({ tdee: 3000, trendKg: 100, ratePct: -0.75, bmr: 1949, previous: 2500 })).toBe(2350))
  test('never below BMR, rounded up', () =>
    expect(weeklyKcalTarget({ tdee: 1900, trendKg: 100, ratePct: -1, bmr: 1949, previous: null })).toBe(1950))
})

describe('effectiveRatePct', () => {
  test('special group gets no deficit', () => expect(effectiveRatePct({ ...me, specialGroup: 'kidney' }, 100)).toBe(0))
  test('maintain goal gets no deficit', () => expect(effectiveRatePct({ ...me, goal: 'maintain' }, 100)).toBe(0))
  test('slows to -0.5 within 5 kg of target', () => expect(effectiveRatePct(me, 83)).toBe(-0.5))
  test('uses profile rate otherwise', () => expect(effectiveRatePct(me, 100)).toBe(-0.75))
})

describe('safety stops', () => {
  test('no deficit once trend reaches the target weight', () => expect(effectiveRatePct(me, 78)).toBe(0))
  test('no deficit below the target weight', () => expect(effectiveRatePct(me, 74)).toBe(0))
  test('under 18 by age gets no deficit even with special group none', () => expect(effectiveRatePct(me, 100, 16)).toBe(0))
  test('under 18 by age gets normal protein and the banner', () => {
    const t = dayTargets(me, 60, 2400, micros, 16)
    expect(t.proteinG).toBe(48)
    expect(t.medicalBanner).toBe(true)
  })
  test('adults are unaffected by the age check', () => expect(effectiveRatePct(me, 100, 30)).toBe(-0.75))
})
