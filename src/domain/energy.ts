import type { DayIntake, Sex, TrendPoint, WeighIn } from './types'

const KCAL_PER_KG = 7700
const DAY_MS = 86400000

export function bmrMifflin(sex: Sex, kg: number, heightCm: number, age: number): number {
  return 10 * kg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS)
}

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(date + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10)
}

/** Exponentially smoothed weight; a gap of g days applies the smoothing g times. */
export function ewmaTrend(weighIns: WeighIn[], alpha = 0.1): TrendPoint[] {
  const sorted = [...weighIns].sort((a, b) => a.date.localeCompare(b.date))
  const out: TrendPoint[] = []
  let prev: TrendPoint | undefined
  for (const w of sorted) {
    if (!prev) {
      prev = { date: w.date, trend: w.kg }
    } else {
      const gap = Math.max(1, daysBetween(prev.date, w.date))
      const a = 1 - Math.pow(1 - alpha, gap)
      prev = { date: w.date, trend: prev.trend + a * (w.kg - prev.trend) }
    }
    out.push(prev)
  }
  return out
}

/** Trend value on a date: latest point on or before it, else the earliest point. */
export function trendAt(trend: TrendPoint[], date: string): number | null {
  if (trend.length === 0) return null
  let best: TrendPoint | null = null
  for (const p of trend) if (p.date <= date && (!best || p.date > best.date)) best = p
  return (best ?? trend.reduce((a, b) => (a.date < b.date ? a : b))).trend
}

/** Least-squares slope of weight over real dates, in kg per day. */
export function weightSlopePerDay(weighIns: WeighIn[], origin: string): number {
  const xs = weighIns.map((w) => daysBetween(origin, w.date))
  const ys = weighIns.map((w) => w.kg)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  return den === 0 ? 0 : num / den
}

/**
 * Real energy expenditure over the last windowDays days: average logged intake on
 * complete days minus the energy of the weight change, where the change is the
 * least-squares slope of the raw weigh-ins (the smoothed trend lags ~9 days and
 * would bias this low). Null when fewer than 10 complete days, fewer than 4
 * weigh-ins, or no weigh-in within 3 days of either end of the window.
 */
export function adaptiveTdee(intakes: DayIntake[], weighIns: WeighIn[], windowDays = 14): number | null {
  if (intakes.length === 0) return null
  const end = intakes.reduce((m, d) => (d.date > m ? d.date : m), intakes[0].date)
  const start = addDays(end, -(windowDays - 1))
  const inWindow = intakes.filter((d) => d.complete && d.date >= start && d.date <= end)
  if (inWindow.length < 10) return null
  const ws = weighIns.filter((w) => w.date >= start && w.date <= end)
  if (ws.length < 4) return null
  if (!ws.some((w) => daysBetween(start, w.date) <= 3) || !ws.some((w) => daysBetween(w.date, end) <= 3)) return null
  const avgKcal = inWindow.reduce((s, d) => s + d.kcal, 0) / inWindow.length
  return avgKcal - weightSlopePerDay(ws, start) * KCAL_PER_KG
}
