import type { TrendPoint, WeighIn } from '../domain/types'
import { daysBetween } from '../domain/energy'

/** Daily weigh-ins as faint dots, the smoothed trend as a solid line, cycle days marked on the axis. */
export function TrendChart({ weighIns, trend, cycleDays = [] }: { weighIns: WeighIn[]; trend: TrendPoint[]; cycleDays?: string[] }) {
  if (weighIns.length < 2) {
    return <p className="empty">ชั่งอีก 2–3 วันจะเห็นเส้นแนวโน้ม น้ำหนักรายวันแกว่งได้ 1–2 kg จากน้ำและอาหารในท้อง ให้ดูเส้นแนวโน้มเป็นหลัก</p>
  }
  const W = 340, H = 160, PAD = 28
  const first = weighIns[0].date
  const last = weighIns[weighIns.length - 1].date
  const span = Math.max(1, daysBetween(first, last))
  const values = [...weighIns.map((w) => w.kg), ...trend.map((t) => t.trend)]
  const lo = Math.floor(Math.min(...values) - 0.5)
  const hi = Math.ceil(Math.max(...values) + 0.5)
  const x = (d: string) => PAD + (daysBetween(first, d) / span) * (W - PAD - 8)
  const y = (kg: number) => 8 + ((hi - kg) / (hi - lo)) * (H - 28)
  const path = trend.map((t, i) => `${i ? 'L' : 'M'}${x(t.date).toFixed(1)},${y(t.trend).toFixed(1)}`).join(' ')

  return (
    <svg className="trend-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`กราฟน้ำหนัก ${weighIns.length} วัน`}>
      {[hi, (hi + lo) / 2, lo].map((v) => (
        <g key={v}>
          <line x1={PAD} x2={W - 8} y1={y(v)} y2={y(v)} className="trend-chart__grid" />
          <text x={PAD - 4} y={y(v) + 4} className="trend-chart__axis" textAnchor="end">{v.toFixed(0)}</text>
        </g>
      ))}
      {cycleDays.filter((d) => d >= first && d <= last).map((d) => (
        <rect key={d} x={x(d) - 2} y={H - 18} width={4} height={8} rx={2} className="trend-chart__cycle" />
      ))}
      {weighIns.map((w) => <circle key={w.date} cx={x(w.date)} cy={y(w.kg)} r={2.6} className="trend-chart__dot" />)}
      <path d={path} className="trend-chart__line" />
    </svg>
  )
}
