import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Repo } from '../db/repo'
import { foodLabel } from '../domain/dailySummary'
import { nutrientsFor } from '../domain/nutrients'
import type { Food } from '../domain/types'
import { fmt } from './dates'
import { parseGrams } from './validate'

export function StateTag({ state }: { state: Food['state'] }) {
  if (state === 'na') return null
  return <span className={`tag tag--${state}`}>{state === 'cooked' ? 'สุก' : 'ดิบ'}</span>
}

export function AddFoodPanel({ repo, onAdd, onClose }: {
  repo: Repo
  onAdd: (food: Food, grams: number) => Promise<void>
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [food, setFood] = useState<Food | null>(null)
  const [grams, setGrams] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    repo.searchFoods(q).then((r) => { if (live) setResults(r.slice(0, 30)) })
    return () => { live = false }
  }, [q, repo])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!food) return
    const g = parseGrams(grams)
    if (!g.ok) { setError(g.error); return }
    await onAdd(food, g.grams)
    setFood(null); setGrams(''); setQ(''); setError('')
  }

  const parsed = parseGrams(grams)
  const preview = food && parsed.ok ? nutrientsFor(food, parsed.grams) : null

  return (
    <section className="add-panel" aria-label="เพิ่มอาหาร">
      <div className="add-panel__head">
        <h2>เพิ่มอาหาร</h2>
        <button type="button" className="icon-btn" aria-label="ปิด" onClick={onClose}><X size={22} aria-hidden /></button>
      </div>
      {!food ? (
        <>
          <label className="field">
            <span>ค้นหาอาหาร</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น ข้าว อกไก่ ไข่" autoFocus />
          </label>
          {q.trim() && (
            results.length ? (
              <ul className="results" aria-label="ผลการค้นหา">
                {results.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="result" onClick={() => setFood(f)}>
                      <span className="result__name">{f.nameTh} <StateTag state={f.state} /></span>
                      <span className="result__meta">{fmt(f.per100g.kcal)} kcal · โปรตีน {fmt(f.per100g.proteinG, 1)} g ต่อ 100 g</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="empty">ไม่พบ “{q}” ลองพิมพ์ให้สั้นลง หรือพิมพ์ชื่อภาษาอังกฤษ</p>
          )}
        </>
      ) : (
        <form onSubmit={submit} className="grams-form" noValidate>
          <p className="picked">
            <strong>{foodLabel(food)}</strong>
            <button type="button" className="link" onClick={() => setFood(null)}>เปลี่ยน</button>
          </p>
          <label className="field field--big">
            <span>น้ำหนัก (กรัม)</span>
            <input inputMode="decimal" value={grams} onChange={(e) => { setGrams(e.target.value); setError('') }} autoFocus aria-invalid={!!error} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {preview && (
            <p className="preview">
              {fmt(preview.kcal)} kcal · โปรตีน {fmt(preview.proteinG, 1)} g · คาร์บ {fmt(preview.carbG, 1)} g · ไขมัน {fmt(preview.fatG, 1)} g
            </p>
          )}
          <button type="submit" className="btn btn--primary">บันทึก</button>
          <p className="fine">ที่มา: {food.sourceRef}</p>
        </form>
      )}
    </section>
  )
}
