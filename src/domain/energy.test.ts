import { bmrMifflin, ewmaTrend, adaptiveTdee } from './energy'
import type { DayIntake, WeighIn } from './types'

const w = (date: string, kg: number): WeighIn => ({ profileId: 'p', date, kg })

function days(n: number, start = '2026-01-01'): string[] {
  const d0 = new Date(start + 'T00:00:00Z')
  return Array.from({ length: n }, (_, i) => new Date(d0.getTime() + i * 86400000).toISOString().slice(0, 10))
}

describe('bmrMifflin', () => {
  test('male', () => expect(bmrMifflin('male', 100, 175, 30)).toBe(1948.75))
  test('female', () => expect(bmrMifflin('female', 70, 160, 30)).toBe(1389))
})

describe('ewmaTrend', () => {
  test('consecutive days', () => {
    const t = ewmaTrend([w('2026-01-01', 100), w('2026-01-02', 100), w('2026-01-03', 101)])
    expect(t.at(-1)!.trend).toBeCloseTo(100.1, 3)
  })
  test('handles gaps by elapsed days', () => {
    const t = ewmaTrend([w('2026-01-01', 100), w('2026-01-04', 98)])
    expect(t.at(-1)!.trend).toBeCloseTo(99.458, 3)
  })
  test('sorts by date', () => {
    const t = ewmaTrend([w('2026-01-04', 98), w('2026-01-01', 100)])
    expect(t[0].date).toBe('2026-01-01')
  })
})

describe('adaptiveTdee', () => {
  const ds = days(14)
  // steady loss of 0.1 kg/day: 0.1 * 7700 = 770 kcal/day below expenditure
  const weighIns: WeighIn[] = ds.map((date, i) => w(date, 100 - 0.1 * i))
  const intakes: DayIntake[] = ds.map((date) => ({ date, kcal: 2000, complete: true }))

  test('steady loss: intake plus energy of the weight slope', () => {
    expect(adaptiveTdee(intakes, weighIns)).toBeCloseTo(2770, 5)
  })
  test('is not biased by the smoothed trend lag (real ewma input shape)', () => {
    // a 3-week steady loss; the estimate must stay within 100 kcal of the truth
    const ds21 = days(21)
    const w21 = ds21.map((date, i) => w(date, 100 - 0.1 * i + (i % 2 ? 0.3 : -0.3)))
    const in21 = ds21.map((date) => ({ date, kcal: 2000, complete: true }))
    expect(Math.abs(adaptiveTdee(in21, w21)! - 2770)).toBeLessThan(100)
  })
  test('null when fewer than 10 complete days', () => {
    const few = intakes.map((d, i) => ({ ...d, complete: i < 9 }))
    expect(adaptiveTdee(few, weighIns)).toBeNull()
  })
  test('ignores incomplete days', () => {
    const extra = intakes.map((d, i) => (i === 3 ? { ...d, kcal: 500, complete: false } : d))
    expect(adaptiveTdee(extra, weighIns)).toBeCloseTo(2770, 5)
  })
  test('null when weigh-ins do not cover both ends of the window', () => {
    const late = weighIns.slice(10)
    expect(adaptiveTdee(intakes, late)).toBeNull()
  })
})
