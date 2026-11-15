import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Repo, WaistLog } from '../db/repo'
import { ewmaTrend } from '../domain/energy'
import type { Profile, TrendPoint, WeighIn } from '../domain/types'
import { fmt } from './dates'
import { TrendChart } from './TrendChart'

export function BodyScreen({ repo, profile, today, onSaved }: { repo: Repo; profile: Profile; today: string; onSaved?: () => void }) {
  const [weighIns, setWeighIns] = useState<WeighIn[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [waist, setWaist] = useState<WaistLog[]>([])
  const [cycle, setCycle] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [kg, setKg] = useState('')
  const [cm, setCm] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const w = await repo.weighIns(profile.id)
    setWeighIns(w)
    setTrend(ewmaTrend(w))
    setWaist(await repo.waistLogs(profile.id))
    setCycle((await repo.cycleDays(profile.id)).map((c) => c.date))
    setLoaded(true)
  }, [repo, profile.id])
  useEffect(() => { load() }, [load])

  async function saveWeight(e: FormEvent) {
    e.preventDefault()
    const v = Number(kg)
    if (!(v >= 30 && v <= 300)) { setError('น้ำหนักเป็นกิโลกรัม (30–300)'); return }
    await repo.addWeighIn({ profileId: profile.id, date: today, kg: v })
    setKg(''); setError('')
    await load(); onSaved?.()
  }
  async function saveWaist(e: FormEvent) {
    e.preventDefault()
    const v = Number(cm)
    if (!(v >= 40 && v <= 200)) { setError('รอบเอวเป็นเซนติเมตร (40–200)'); return }
    await repo.addWaist({ profileId: profile.id, date: today, cm: v })
    setCm(''); setError('')
    await load()
  }

  if (!loaded) return null
  const current = trend.at(-1)?.trend
  const lastWaist = waist.at(-1)
  const firstWaist = waist[0]
  const todayWeighIn = weighIns.find((w) => w.date === today)

  return (
    <div className="screen">
      <section className="trend-hero" aria-label="แนวโน้มน้ำหนัก">
        <p className="trend-hero__label">น้ำหนักแนวโน้ม (kg)</p>
        <p className="trend-hero__value">{current !== undefined ? current.toFixed(1) : '—'}</p>
        <p className="fine">ค่าเฉลี่ยถ่วงน้ำหนักจากทุกวันที่ชั่ง ไม่ใช่ตัวเลขของเช้านี้ เป้าหมาย {fmt(profile.targetWeightKg, 1)} kg</p>
        <TrendChart weighIns={weighIns} trend={trend} cycleDays={cycle} />
      </section>

      <form className="inline-form" onSubmit={saveWeight} noValidate>
        <label className="field">
          <span>{todayWeighIn ? `ชั่งเช้านี้แล้ว ${todayWeighIn.kg} kg แก้ได้` : 'น้ำหนักเช้านี้ (kg) หลังเข้าห้องน้ำ ก่อนกิน'}</span>
          <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--primary">บันทึกน้ำหนัก</button>
      </form>

      <form className="inline-form" onSubmit={saveWaist} noValidate>
        <label className="field">
          <span>รอบเอว (cm) สัปดาห์ละครั้ง ระดับสะดือ</span>
          <input inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} />
        </label>
        <button type="submit" className="btn">บันทึกรอบเอว</button>
        {lastWaist && (
          <p className="fine">
            ล่าสุด {fmt(lastWaist.cm, 1)} cm
            {firstWaist && firstWaist !== lastWaist && ` (${lastWaist.cm - firstWaist.cm <= 0 ? 'ลด' : 'เพิ่ม'} ${fmt(Math.abs(lastWaist.cm - firstWaist.cm), 1)} cm จากครั้งแรก)`}
          </p>
        )}
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}

      {profile.sex === 'female' && (
        <label className="complete-toggle">
          <input
            type="checkbox"
            checked={cycle.includes(today)}
            onChange={async (e) => {
              if (e.target.checked) await repo.addCycleDay({ profileId: profile.id, date: today })
              else await repo.removeCycleDay(profile.id, today)
              await load()
            }}
          />
          <span>
            <strong>วันนี้เป็นรอบเดือน</strong>
            <small>ช่วงนี้น้ำหนักขึ้น 1–2 kg จากน้ำได้ เป็นเรื่องปกติ กราฟจะทำเครื่องหมายไว้</small>
          </span>
        </label>
      )}
    </div>
  )
}
