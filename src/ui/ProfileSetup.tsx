import { useState, type FormEvent } from 'react'
import type { Repo } from '../db/repo'
import type { ActivityFactor, Goal, Profile, Sex, SpecialGroup } from '../domain/types'

const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const SPECIAL: [SpecialGroup, string][] = [
  ['none', 'ไม่มี'], ['under18', 'อายุต่ำกว่า 18 ปี'], ['pregnant', 'ตั้งครรภ์/ให้นมบุตร'], ['kidney', 'โรคไต'],
]

export function ProfileSetup({ repo, today, onDone, initial, onCancel }: {
  repo: Repo
  today: string
  onDone: (p: Profile) => void
  initial?: Profile
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sex, setSex] = useState<Sex>(initial?.sex ?? 'male')
  const [birthYear, setBirthYear] = useState(initial ? String(initial.birthYear) : '')
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : '')
  const [weight, setWeight] = useState('')
  const [target, setTarget] = useState(initial ? String(initial.targetWeightKg) : '')
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? 'fat_loss')
  const [activity, setActivity] = useState<ActivityFactor>(initial?.activityFactor ?? 1.375)
  const [special, setSpecial] = useState<SpecialGroup>(initial?.specialGroup ?? 'none')
  const [days, setDays] = useState<number[]>(initial?.trainingDays ?? [1, 3, 5])
  const [error, setError] = useState('')

  // Under 18 by birth year always selects the under-18 group; the domain enforces it again by age.
  function onBirthYear(v: string) {
    setBirthYear(v)
    const age = Number(today.slice(0, 4)) - Number(v)
    if (v.length === 4 && age < 18 && age >= 0) setSpecial('under18')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const by = Number(birthYear), h = Number(height), w = Number(weight), t = Number(target)
    if (!name.trim()) return setError('ใส่ชื่อก่อน')
    if (!(by > 1920 && by <= Number(today.slice(0, 4)))) return setError('ปีเกิดเป็น ค.ศ. เช่น 1996')
    if (!(h >= 120 && h <= 230)) return setError('ส่วนสูงเป็นเซนติเมตร (120–230)')
    const weightOk = initial && !weight.trim() ? true : w >= 30 && w <= 300
    if (!weightOk || !(t >= 30 && t <= 300)) return setError('น้ำหนักเป็นกิโลกรัม (30–300)')
    const profile: Profile = {
      id: initial?.id ?? crypto.randomUUID(), name: name.trim(), sex, birthYear: by, heightCm: h, goal, targetWeightKg: t,
      activityFactor: activity, weeklyRatePct: initial?.weeklyRatePct ?? -0.75, specialGroup: special, trainingDays: days,
    }
    await repo.saveProfile(profile)
    if (weight.trim()) await repo.addWeighIn({ profileId: profile.id, date: today, kg: w })
    onDone(profile)
  }

  const num = (label: string, value: string, set: (v: string) => void, step = '1') => (
    <label className="field">
      <span>{label}</span>
      <input inputMode="decimal" type="number" step={step} value={value} onChange={(e) => set(e.target.value)} />
    </label>
  )

  return (
    <form className="setup" onSubmit={submit}>
      <h2>{initial ? 'แก้ไขโปรไฟล์' : 'ตั้งค่าโปรไฟล์'}</h2>
      <label className="field">
        <span>ชื่อ</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>
      <fieldset className="choice">
        <legend>เพศ</legend>
        {(['male', 'female'] as Sex[]).map((s) => (
          <label key={s}><input type="radio" name="sex" checked={sex === s} onChange={() => setSex(s)} />{s === 'male' ? 'ชาย' : 'หญิง'}</label>
        ))}
      </fieldset>
      <div className="field-row">
        {num('ปีเกิด (ค.ศ.)', birthYear, onBirthYear)}
        {num('ส่วนสูง (cm)', height, setHeight)}
      </div>
      <div className="field-row">
        {num(initial ? 'น้ำหนักวันนี้ (kg) ไม่บังคับ' : 'น้ำหนักตอนนี้ (kg)', weight, setWeight, '0.1')}
        {num('น้ำหนักเป้าหมาย (kg)', target, setTarget, '0.1')}
      </div>
      <fieldset className="choice">
        <legend>เป้าหมาย</legend>
        {([['fat_loss', 'ลดน้ำหนัก'], ['recomp', 'เพิ่มกล้าม + ลดไขมัน'], ['maintain', 'คงน้ำหนัก']] as [Goal, string][]).map(([g, l]) => (
          <label key={g}><input type="radio" name="goal" checked={goal === g} onChange={() => setGoal(g)} />{l}</label>
        ))}
      </fieldset>
      <label className="field">
        <span>กิจกรรมในชีวิตประจำวัน (ใช้แค่ช่วงแรก แอปจะปรับจากน้ำหนักจริง)</span>
        <select value={activity} onChange={(e) => setActivity(Number(e.target.value) as ActivityFactor)}>
          <option value={1.2}>นั่งเป็นส่วนใหญ่ ไม่ออกกำลังกาย</option>
          <option value={1.375}>ออกกำลังกาย 1–3 วัน/สัปดาห์</option>
          <option value={1.55}>ออกกำลังกาย 3–5 วัน/สัปดาห์</option>
          <option value={1.725}>ออกกำลังกายหนักเกือบทุกวัน</option>
        </select>
      </label>
      <fieldset className="choice choice--days">
        <legend>วันที่ออกกำลังกาย</legend>
        {DAYS.map((d, i) => (
          <label key={d}>
            <input type="checkbox" checked={days.includes(i)} onChange={() => setDays((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i].sort()))} />
            {d}
          </label>
        ))}
      </fieldset>
      <fieldset className="choice">
        <legend>ภาวะที่ต้องระวัง</legend>
        {SPECIAL.map(([g, l]) => (
          <label key={g}><input type="radio" name="special" checked={special === g} onChange={() => setSpecial(g)} />{l}</label>
        ))}
      </fieldset>
      {special !== 'none' && (
        <p className="banner banner--medical">
          แอปจะไม่ตั้งเป้าให้กินขาดและใช้โปรตีนปกติ (0.8 g/kg) ควรปรึกษาแพทย์หรือนักกำหนดอาหารก่อนเปลี่ยนการกิน
        </p>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="btn-row">
        {onCancel && <button type="button" className="btn" onClick={onCancel}>ยกเลิก</button>}
        <button type="submit" className="btn btn--primary">บันทึกโปรไฟล์</button>
      </div>
      <p className="fine">
        แอปนี้ให้ข้อมูลทั่วไปตามหลักโภชนาการและการออกกำลังกาย ไม่ใช่คำแนะนำทางการแพทย์
        ผู้มีโรคประจำตัวควรปรึกษาแพทย์หรือนักกำหนดอาหาร
      </p>
    </form>
  )
}
