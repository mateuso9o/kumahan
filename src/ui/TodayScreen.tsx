import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Repo, TargetRecord } from '../db/repo'
import { driFor } from '../data/dri'
import { dailySummary } from '../domain/dailySummary'
import { daysBetween, ewmaTrend, trendAt } from '../domain/energy'
import { nutrientsFor, sumNutrients } from '../domain/nutrients'
import { dayTargets, proteinRefWeight } from '../domain/targets'
import type { Profile } from '../domain/types'
import { fmt } from './dates'
import { Flag } from './Flag'

type Data = {
  target: TargetRecord
  summary: ReturnType<typeof dailySummary>
  targets: ReturnType<typeof dayTargets>
  eatenKcal: number
  hasEstimate: boolean
  refWeight: number
}

const ackKey = (t: TargetRecord) => `ack:${t.profileId}:${t.weekStart}`
function readAck(t: TargetRecord): boolean {
  try { return localStorage.getItem(ackKey(t)) === '1' } catch { return false }
}

export function TodayScreen({ repo, profile, date, today, onAddFood }: {
  repo: Repo
  profile: Profile
  date: string
  today: string
  onAddFood: () => void
}) {
  const [data, setData] = useState<Data | null | 'none'>(null)
  const [acked, setAcked] = useState(true)

  useEffect(() => {
    let live = true
    ;(async () => {
      const target = await repo.latestTarget(profile.id)
      const weighIns = await repo.weighIns(profile.id)
      if (!target || weighIns.length === 0) { if (live) setData('none'); return }
      const trendKg = trendAt(ewmaTrend(weighIns), date)!
      const age = Number(date.slice(0, 4)) - profile.birthYear
      const targets = dayTargets(profile, trendKg, target.kcal, driFor(profile.sex, age), age)
      const logs = await repo.logsForDay(profile.id, date)
      const parts = []
      for (const l of logs) {
        const f = await repo.getFood(l.foodId)
        if (f) parts.push(nutrientsFor(f, l.grams))
      }
      const eaten = sumNutrients(parts)
      const known = await repo.loggedFoods(profile.id)
      const all = await repo.allFoods()
      const summary = dailySummary(targets, eaten, known.length ? known : all, all)
      if (!live) return
      setData({ target, summary, targets, eatenKcal: eaten.kcal, hasEstimate: logs.some((l) => l.estimated), refWeight: proteinRefWeight(profile, trendKg) })
      setAcked(readAck(target))
    })()
    return () => { live = false }
  }, [repo, profile, date])

  if (data === null) return <div className="screen" aria-busy="true" />
  if (data === 'none') {
    return (
      <div className="screen">
        <p className="empty empty--lead">
          ชั่งน้ำหนักครั้งแรกในแท็บ “ร่างกาย” แล้วแอปจะคำนวณเป้าของคุณ
        </p>
      </div>
    )
  }

  const { target, summary, targets, eatenKcal, hasEstimate, refWeight } = data
  const remaining = Math.round(targets.kcal - eatenKcal)
  const fresh = daysBetween(target.weekStart, today) < 7
  const micros = summary.rows.filter((r) => ['calciumMg', 'ironMg', 'potassiumMg', 'magnesiumMg', 'vitaminDUg'].includes(r.key))

  return (
    <div className="screen screen--today">
      {targets.medicalBanner && (
        <p className="banner banner--medical">โปรไฟล์นี้ไม่ตั้งเป้าให้กินขาดและใช้โปรตีนปกติ ควรปรึกษาแพทย์หรือนักกำหนดอาหาร</p>
      )}
      {fresh && !acked && (
        <div className="changed" role="status">
          <p><strong>เป้าพลังงานสัปดาห์นี้ {fmt(target.kcal)} kcal</strong><br />{target.reason}</p>
          <button type="button" className="btn" onClick={() => { try { localStorage.setItem(ackKey(target), '1') } catch { /* private mode */ } setAcked(true) }}>
            รับทราบ
          </button>
        </div>
      )}

      <section className="remaining" aria-label="พลังงานที่เหลือ">
        <p className="remaining__label">{remaining >= 0 ? 'เหลือ' : 'เกิน'}</p>
        <p className="remaining__value num">{fmt(Math.abs(remaining))}</p>
        <p className="remaining__unit">kcal <span className="num">· กินแล้ว {fmt(eatenKcal)} / {fmt(targets.kcal)}</span>{hasEstimate && <span className="tag tag--estimate">มีค่าประมาณ</span>}</p>
      </section>

      <Flag rows={summary.rows} />

      {summary.suggestions.length > 0 && (
        <ul className="suggestions">
          {summary.suggestions.map((s) => <li key={s}>{s}</li>)}
        </ul>
      )}

      <button type="button" className="fab" onClick={onAddFood}>
        <Plus size={22} aria-hidden /> บันทึกอาหาร
      </button>

      <details className="more">
        <summary>วิตามินและแร่ธาตุ</summary>
        <table className="micro-table">
          <tbody>
            {micros.map((r) => (
              <tr key={r.key} className={`is-${r.status}`}>
                <th scope="row">{r.label}</th>
                <td className="num">{fmt(r.eaten, r.unit === 'mg' && r.target < 50 ? 1 : 0)} / {fmt(r.target, r.target < 50 ? 1 : 0)} {r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fine">วิตามินดีส่วนใหญ่ได้จากแดด ข้อมูลอาหารหลายชนิดไม่มีค่าวิตามินดี ตัวเลขนี้จึงต่ำกว่าจริง</p>
      </details>

      <details className="more">
        <summary>ที่มาของตัวเลข</summary>
        <ul className="sources">
          <li><strong>พลังงาน {fmt(targets.kcal)} kcal:</strong> {target.reason}</li>
          <li><strong>โปรตีน {fmt(targets.proteinG)} g:</strong> {targets.medicalBanner
            ? 'ค่าทั่วไปสำหรับผู้ใหญ่ 0.8 g ต่อน้ำหนักตัว 1 kg ปริมาณที่เหมาะกับคุณควรให้แพทย์หรือนักกำหนดอาหารกำหนด'
            : `2.0 g ต่อ kg ของน้ำหนัก ${fmt(refWeight, 1)} kg (ใช้น้ำหนักเป้าหมายเมื่อ BMI ≥ 25) ช่วงที่งานวิจัยแนะนำคือ 1.6–2.2 g/kg`}</li>
          <li><strong>ไขมัน {fmt(targets.fatG)} g:</strong> อย่างน้อย 25% ของพลังงาน</li>
          <li><strong>คาร์บ {fmt(targets.carbG)} g:</strong> พลังงานที่เหลือหลังโปรตีนและไขมัน</li>
          <li><strong>ใยอาหาร {fmt(targets.fiberG)} g:</strong> 14 g ต่อทุก 1,000 kcal</li>
          <li><strong>โซเดียม ไม่เกิน 2,000 mg:</strong> ตามคำแนะนำ WHO</li>
          <li><strong>วิตามินและแร่ธาตุ:</strong> ปริมาณสารอาหารอ้างอิงสำหรับคนไทย พ.ศ. 2563 (กรมอนามัย)</li>
          <li><strong>ข้อมูลอาหาร:</strong> USDA FoodData Central</li>
        </ul>
      </details>
    </div>
  )
}
