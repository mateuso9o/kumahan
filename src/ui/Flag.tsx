import type { CSSProperties } from 'react'
import type { SummaryRow } from '../domain/dailySummary'
import { fmt } from './dates'

const BANDS: { key: SummaryRow['key']; label: string; tone: string }[] = [
  { key: 'carbG', label: 'คาร์บ', tone: 'carb' },
  { key: 'fiberG', label: 'ผักผลไม้ · ใยอาหาร', tone: 'fiber' },
  { key: 'proteinG', label: 'โปรตีน', tone: 'protein' },
  { key: 'fatG', label: 'ไขมัน', tone: 'fat' },
  { key: 'sodiumMg', label: 'โซเดียม', tone: 'sodium' },
]

/**
 * The person's own food-guide flag: an inverted triangle of nutrient bands.
 * Each band's fill length is exactly eaten / target. The label is drawn twice:
 * ink over the pale track, white over the solid fill, clipped at the fill edge.
 */
export function Flag({ rows }: { rows: SummaryRow[] }) {
  return (
    <ol className="flag" aria-label="ธงโภชนาการของวันนี้">
      {BANDS.map((b, i) => {
        const r = rows.find((x) => x.key === b.key)!
        const pct = r.target > 0 ? Math.min(1, r.eaten / r.target) : 0
        const text = `${fmt(r.eaten)} / ${fmt(r.target)} ${r.unit}`
        const style = { '--fill': `${(pct * 100).toFixed(1)}%`, '--inset': `${i * 4.5}%` } as CSSProperties
        return (
          <li key={b.key} className={`flag__band flag__band--${b.tone}${r.status === 'over' ? ' is-over' : ''}`} style={style}>
            <span className="sr-only">{b.label} {text}{r.status === 'over' ? ' เกินเป้า' : ''}</span>
            <span className="flag__fill" aria-hidden />
            <span className="flag__text" aria-hidden>
              <span>{b.label}</span><span className="num">{text}</span>
            </span>
            <span className="flag__text flag__text--on-fill" aria-hidden>
              <span>{b.label}</span><span className="num">{text}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
