// Builds src/data/foods.seed.json from the USDA FoodData Central SR Legacy CSV.
// Usage: node scripts/build-foods.ts <path-to-FoodData_Central_sr_legacy_food_csv_dir>
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { join } from 'node:path'

type Key = 'kcal' | 'proteinG' | 'fatG' | 'carbG' | 'fiberG' | 'sodiumMg' | 'calciumMg' | 'ironMg' | 'potassiumMg' | 'magnesiumMg' | 'vitaminDUg'
const NUTRIENT_IDS: Record<string, Key> = {
  '1008': 'kcal', '1003': 'proteinG', '1004': 'fatG', '1005': 'carbG', '1079': 'fiberG',
  '1093': 'sodiumMg', '1087': 'calciumMg', '1089': 'ironMg', '1092': 'potassiumMg', '1090': 'magnesiumMg', '1114': 'vitaminDUg',
}
interface Entry { fdcId: number; nameTh: string; nameEn: string; state: 'raw' | 'cooked' | 'na' }

function cells(line: string): string[] {
  return [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'))
}

const dir = process.argv[2]
if (!dir) throw new Error('usage: node scripts/build-foods.ts <csv dir>')
const entries: Entry[] = JSON.parse(readFileSync('data/foods.ids.json', 'utf8'))
const wanted = new Set(entries.map((e) => String(e.fdcId)))

const descriptions = new Map<string, string>()
for (const line of readFileSync(join(dir, 'food.csv'), 'utf8').split('\n')) {
  const c = cells(line)
  if (wanted.has(c[0])) descriptions.set(c[0], c[2])
}

const values = new Map<string, Partial<Record<Key, number>>>()
const rl = createInterface({ input: createReadStream(join(dir, 'food_nutrient.csv')) })
for await (const line of rl) {
  const c = cells(line)
  const key = NUTRIENT_IDS[c[2]]
  if (!key || !wanted.has(c[1])) continue
  const v = values.get(c[1]) ?? {}
  v[key] = Number(c[3])
  values.set(c[1], v)
}

const foods = entries.map((e) => {
  const id = String(e.fdcId)
  const desc = descriptions.get(id)
  if (!desc) throw new Error(`fdcId ${id} not found in food.csv`)
  const v = values.get(id) ?? {}
  const missing = (Object.values(NUTRIENT_IDS) as Key[]).filter((k) => v[k] === undefined)
  const per100g = Object.fromEntries((Object.values(NUTRIENT_IDS) as Key[]).map((k) => [k, v[k] ?? 0]))
  return {
    id: `usda-${id}`,
    nameTh: e.nameTh,
    nameEn: e.nameEn,
    state: e.state,
    source: 'usda',
    sourceRef: `USDA FDC SR Legacy ${id}: ${desc}` + (missing.length ? ` (no data, set to 0: ${missing.join(', ')})` : ''),
    per100g,
  }
})
writeFileSync('src/data/foods.seed.json', JSON.stringify(foods, null, 1) + '\n')
console.log(`wrote ${foods.length} foods`)
