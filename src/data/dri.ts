import type { MicroTargets, Sex } from '../domain/types'

// Source: ปริมาณสารอาหารอ้างอิงที่ควรได้รับประจำวันสำหรับคนไทย พ.ศ. 2563 (Thai DRI 2020), กรมอนามัย
//   calcium, iron, magnesium: ตารางที่ 3 แร่ธาตุ, หน้า 441
//   vitamin D: ตารางที่ 2 วิตามิน, หน้า 440 (600 IU = 15 µg)
//   potassium: โปตัสเซียม ตารางที่ 1, หน้า 401 — the book gives a range; the lower bound is used as the daily target
// Values for ages above 60 reuse the 51-60 row. Ages below 19 reuse 19-30 (the app blocks
// deficit/high-protein modes for under-18s anyway).
type Row = { maxAge: number; male: MicroTargets; female: MicroTargets }

const ROWS: Row[] = [
  {
    maxAge: 30,
    male: { calciumMg: 800, ironMg: 11.5, magnesiumMg: 310, potassiumMg: 2525, vitaminDUg: 15 },
    female: { calciumMg: 800, ironMg: 20, magnesiumMg: 250, potassiumMg: 2050, vitaminDUg: 15 },
  },
  {
    maxAge: 50,
    male: { calciumMg: 800, ironMg: 11.5, magnesiumMg: 320, potassiumMg: 2450, vitaminDUg: 15 },
    female: { calciumMg: 800, ironMg: 20, magnesiumMg: 260, potassiumMg: 2050, vitaminDUg: 15 },
  },
  {
    maxAge: Infinity,
    male: { calciumMg: 1000, ironMg: 11.5, magnesiumMg: 300, potassiumMg: 2450, vitaminDUg: 15 },
    female: { calciumMg: 1000, ironMg: 10, magnesiumMg: 260, potassiumMg: 2050, vitaminDUg: 15 },
  },
]

export function driFor(sex: Sex, age: number): MicroTargets {
  const row = ROWS.find((r) => age <= r.maxAge)!
  return { ...row[sex] }
}
