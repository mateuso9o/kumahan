import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays } from '../domain/energy'
import { thaiDate } from './dates'

export function DateNav({ date, today, onChange }: { date: string; today: string; onChange: (d: string) => void }) {
  return (
    <div className="date-nav">
      <button type="button" className="icon-btn" aria-label="วันก่อนหน้า" onClick={() => onChange(addDays(date, -1))}>
        <ChevronLeft size={22} aria-hidden />
      </button>
      <span className="date-nav__label">{date === today ? 'วันนี้' : thaiDate(date)}</span>
      <button type="button" className="icon-btn" aria-label="วันถัดไป" disabled={date >= today} onClick={() => onChange(addDays(date, 1))}>
        <ChevronRight size={22} aria-hidden />
      </button>
    </div>
  )
}
