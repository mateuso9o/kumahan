import { useCallback, useEffect, useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import type { FoodLog, Recipe, Repo } from '../db/repo'
import { foodLabel } from '../domain/dailySummary'
import { nutrientsFor, sumNutrients } from '../domain/nutrients'
import type { Food, Profile } from '../domain/types'
import { AddFoodPanel } from './AddFoodPanel'
import { fmt } from './dates'

interface Row { log: FoodLog; food: Food }

export function FoodLogScreen({ repo, profile, date, startOpen = false }: {
  repo: Repo
  profile: Profile
  date: string
  onDateChange?: (d: string) => void
  startOpen?: boolean
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [complete, setComplete] = useState(false)
  const [adding, setAdding] = useState(startOpen)
  const [naming, setNaming] = useState(false)
  const [recipeName, setRecipeName] = useState('')

  const load = useCallback(async () => {
    const logs = await repo.logsForDay(profile.id, date)
    const out: Row[] = []
    for (const log of logs) {
      const food = await repo.getFood(log.foodId)
      if (food) out.push({ log, food })
    }
    setRows(out)
    setRecipes(await repo.listRecipes(profile.id))
    setComplete(await repo.isDayComplete(profile.id, date))
  }, [repo, profile.id, date])

  useEffect(() => { load() }, [load])

  async function add(food: Food, grams: number) {
    await repo.addFoodLog({ profileId: profile.id, date, foodId: food.id, grams, source: 'weighed', estimated: false })
    await load()
  }

  async function saveRecipe() {
    if (!recipeName.trim() || rows.length === 0) return
    await repo.saveRecipe({ profileId: profile.id, name: recipeName.trim(), items: rows.map((r) => ({ foodId: r.food.id, grams: r.log.grams })) })
    setNaming(false); setRecipeName('')
    await load()
  }

  const total = sumNutrients(rows.map((r) => nutrientsFor(r.food, r.log.grams)))

  return (
    <div className="screen">
      {adding ? (
        <AddFoodPanel repo={repo} onAdd={add} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" className="btn btn--primary btn--wide" onClick={() => setAdding(true)}>
          <Plus size={20} aria-hidden /> เพิ่มอาหาร
        </button>
      )}

      {recipes.length > 0 && (
        <section aria-label="มื้อโปรด" className="favs">
          <h3>มื้อโปรด กดเพื่อบันทึกทั้งมื้อ</h3>
          <div className="chips">
            {recipes.map((r) => (
              <button key={r.id} type="button" className="chip" onClick={async () => { await repo.logRecipe(r.id, date); await load() }}>
                <Star size={16} aria-hidden /> {r.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-label="รายการอาหาร">
        {rows.length === 0 ? (
          <p className="empty">ยังไม่มีอาหารของวันนี้ ชั่งแล้วกด “เพิ่มอาหาร” ใส่เป็นกรัม เลือกให้ตรงว่าดิบหรือสุก</p>
        ) : (
          <ul className="log-list">
            {rows.map(({ log, food }) => {
              const n = nutrientsFor(food, log.grams)
              return (
                <li key={log.id} className="log-item">
                  <div>
                    <div className="log-item__name">{foodLabel(food)}</div>
                    <div className="log-item__meta">
                      {fmt(log.grams)} g · โปรตีน {fmt(n.proteinG, 1)} g{log.estimated && <span className="tag tag--estimate">ประมาณ</span>}
                    </div>
                  </div>
                  <div className="log-item__kcal">{fmt(n.kcal)}<small> kcal</small></div>
                  <button type="button" className="icon-btn" aria-label={`ลบ ${foodLabel(food)}`} onClick={async () => { await repo.deleteFoodLog(log.id); await load() }}>
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              )
            })}
            <li className="log-total">
              <span>รวม</span>
              <span>{fmt(total.kcal)} kcal · P {fmt(total.proteinG)} · C {fmt(total.carbG)} · F {fmt(total.fatG)}</span>
            </li>
          </ul>
        )}
      </section>

      {rows.length > 0 && (
        naming ? (
          <div className="inline-form">
            <label className="field">
              <span>ชื่อมื้อโปรด</span>
              <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="เช่น ข้าวอกไก่มื้อเที่ยง" autoFocus />
            </label>
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => setNaming(false)}>ยกเลิก</button>
              <button type="button" className="btn btn--primary" onClick={saveRecipe} disabled={!recipeName.trim()}>บันทึกมื้อโปรด</button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn--quiet" onClick={() => setNaming(true)}>
            <Star size={18} aria-hidden /> บันทึกรายการวันนี้เป็นมื้อโปรด
          </button>
        )
      )}

      <label className="complete-toggle">
        <input type="checkbox" checked={complete} onChange={async (e) => { await repo.setDayComplete(profile.id, date, e.target.checked); setComplete(e.target.checked) }} />
        <span>
          <strong>วันนี้บันทึกครบแล้ว</strong>
          <small>แอปใช้เฉพาะวันที่บันทึกครบมาคำนวณการเผาผลาญจริง วันที่ลืมบันทึกจะไม่ทำให้ตัวเลขเพี้ยน</small>
        </span>
      </label>
    </div>
  )
}
