# Phase 1 — Core Nutrition (ชั่งอาหาร + เป้าสารอาหาร + น้ำหนัก) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA ที่แต่ละคนตั้งโปรไฟล์ได้ บันทึกอาหารแบบชั่ง (ดิบ/สุก) ชั่งน้ำหนักตัว/รอบเอว เห็นเป้าสารอาหารรายวันที่ปรับอัตโนมัติจากแนวโน้มน้ำหนัก และสรุปรายวัน "ที่เหลือวันนี้"

**Architecture:** React + TypeScript PWA ข้อมูลเก็บในเครื่อง (IndexedDB ผ่าน Dexie) หลัง repository interface เพื่อเปลี่ยนเป็น Supabase sync ใน Phase 3 ได้โดยไม่แตะ UI สูตรคำนวณทั้งหมดอยู่ใน `src/domain/` เป็นฟังก์ชันบริสุทธิ์ ทดสอบได้ด้วย Vitest

**Tech Stack:** Vite, React 18, TypeScript, vite-plugin-pwa, Dexie, fake-indexeddb (test), Vitest, @testing-library/react

**Spec:** `docs/2026-11-16-fitness-nutrition-app-design.md`

### ลำดับช่วงทั้งหมด (แผนแยกไฟล์ เขียนเมื่อจบช่วงก่อนหน้า)
1. **Phase 1 (แผนนี้):** โภชนาการหลัก — spec §1 goals 1(ชั่ง),2,3 · §4 · §5.1 · §7 รายวัน (ส่วนอาหาร)
2. Phase 2: ออกกำลังกาย — §6 + คาร์บตามวันซ้อม (ใช้ `trainingDays` ใน profile ไปก่อนใน Phase 1)
3. Phase 3: Supabase sync + โหมดถ่ายรูป Gemini + เมนูมาตรฐาน — §3, §5.2
4. Phase 4: สรุปรายสัปดาห์ครบทุกข้อ — §7 รายสัปดาห์

**การเปลี่ยนจาก spec ที่ต้องแจ้งผู้ใช้:** Phase 1 เก็บข้อมูลในเครื่องแต่ละคน (ยังไม่ใช้ Supabase) เพื่อให้เริ่มใช้ได้โดยไม่ต้องสมัครบัญชี Supabase ย้ายข้อมูลขึ้น Supabase ใน Phase 3

## Global Constraints
- ภาษา UI: ไทย, หน่วย: กรัม / kg / kcal / ml
- วันที่เก็บเป็นสตริง `YYYY-MM-DD` ตามเวลาท้องถิ่นของเครื่อง ณ ตอนบันทึก
- ตัวเลขโภชนาการทุกตัวคำนวณจากฐานข้อมูล ต่อ 100 g — ห้ามมีค่าที่ไม่มีแหล่ง (`source` ทุก food)
- ค่าจาก spec (ห้ามเปลี่ยนโดยไม่ถาม): โปรตีน 1.6–2.2 g/kg (ค่าเริ่ม 2.0) · ไขมัน ≥ 25% kcal และ ≥ 0.5 g/kg · ใยอาหาร 14 g/1000 kcal · โซเดียม < 2000 mg · น้ำ 33 ml/kg · 7700 kcal/kg · ปรับเป้าสัปดาห์ละครั้ง ไม่เกิน ±150 kcal · เป้า kcal ไม่ต่ำกว่า BMR · สัปดาห์ที่บันทึกอาหาร < 5 วัน ไม่ปรับเป้า
- อัตราลดเริ่มต้น −0.75%/สัปดาห์ (ปรับได้ −0.5 ถึง −1.0) และอัตโนมัติเป็น −0.5% เมื่อห่างน้ำหนักเป้า ≤ 5 kg
- กลุ่มพิเศษ (`under18` | `pregnant` | `kidney`): kcal = TDEE (ไม่ขาด), โปรตีน 0.8 g/kg, แสดงแบนเนอร์ "ควรปรึกษาแพทย์/นักกำหนดอาหาร"
- UI ทุกหน้าออกแบบด้วย skill **impeccable**, ใช้งานได้ที่ความกว้าง 360px
- แสดงข้อความแจ้งข้อจำกัดความรับผิดชอบ (spec ท้ายเอกสาร) ในหน้าตั้งค่าโปรไฟล์

## Review Focus
1. **ชั่งน้ำหนักไม่ทุกวัน / ข้ามหลายวัน** — trend ต้องคำนวณตามวันที่จริง ไม่ใช่ตามลำดับรายการ → test ใน Task 2 (`ewmaTrend handles gaps`)
2. **วันที่บันทึกอาหารไม่ครบ (ลืมมื้อ)** ทำให้ค่าเฉลี่ยการกินต่ำเกินจริง → ผู้ใช้กด "วันนี้บันทึกครบ" ได้; adaptive TDEE ใช้เฉพาะวันที่ `complete` → test ใน Task 2
3. **กรอกกรัมผิดหน่วย** (0.2 แทน 200, 20000) → รับ 1–3000 g เท่านั้น แสดงข้อผิดพลาด → test ใน Task 6
4. **บันทึกหลังเที่ยงคืน** ต้องลงวันที่ที่ผู้ใช้เลือกบนหน้าจอ ไม่ใช่เวลาปัจจุบันเสมอ → test ใน Task 6
5. **น้ำหนักกระโดด (บวมน้ำ/รอบเดือน)** ต้องไม่ทำให้เป้าเปลี่ยนเกิน ±150 → test ใน Task 3

---

### Task 1: Scaffold โปรเจกต์ + git

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `.gitignore`

**Interfaces:**
- Produces: `npm test` (vitest run), `npm run dev`, `npm run build`

- [ ] **Step 1:** `git init`; `npm create vite@latest . -- --template react-ts`; ติดตั้ง `vitest @testing-library/react @testing-library/jest-dom jsdom vite-plugin-pwa dexie fake-indexeddb`
- [ ] **Step 2: Write the failing test** `src/App.test.tsx`: render `<App/>` แล้ว `expect(screen.getByRole('heading', {name: 'คุมอาหาร'})).toBeInTheDocument()`
- [ ] **Step 3:** Run `npx vitest run` → Expected: FAIL (heading not found)
- [ ] **Step 4:** `App.tsx` แสดง `<h1>คุมอาหาร</h1>`; ตั้ง vitest `environment: 'jsdom'`; ตั้ง `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'คุมอาหาร', short_name: 'คุมอาหาร', lang: 'th', display: 'standalone' } })`
- [ ] **Step 5:** Run `npx vitest run` → PASS; `npm run build` → สำเร็จ มี `dist/manifest.webmanifest`
- [ ] **Step 6:** Commit `chore: scaffold PWA project`

### Task 2: สูตรพลังงาน (`src/domain/energy.ts`)

**Files:**
- Create: `src/domain/types.ts`, `src/domain/energy.ts`, `src/domain/energy.test.ts`

**Interfaces:**
- Produces (types.ts):
  ```ts
  type Sex = 'male' | 'female'
  type Goal = 'recomp' | 'fat_loss' | 'maintain'
  type SpecialGroup = 'none' | 'under18' | 'pregnant' | 'kidney'
  interface Profile { id: string; name: string; sex: Sex; birthYear: number; heightCm: number;
    goal: Goal; targetWeightKg: number; activityFactor: 1.2 | 1.375 | 1.55 | 1.725;
    weeklyRatePct: number /* e.g. -0.75 */; specialGroup: SpecialGroup; trainingDays: number[] /* 0=Sun */ }
  interface WeighIn { profileId: string; date: string; kg: number }
  interface DayIntake { date: string; kcal: number; complete: boolean }
  ```
- Produces (energy.ts):
  - `bmrMifflin(sex: Sex, kg: number, heightCm: number, age: number): number` — male `10kg + 6.25h − 5a + 5`, female `… − 161`
  - `ewmaTrend(weighIns: WeighIn[], alpha = 0.1): { date: string; trend: number }[]` — เรียงตามวันที่; ค่าแรก = น้ำหนักแรก; ถ้าห่าง g วัน ใช้ `a = 1 − (1 − alpha)^g`
  - `adaptiveTdee(intakes: DayIntake[], trend: {date:string;trend:number}[], windowDays = 14): number | null` — ใช้เฉพาะ `complete`; คืน `null` ถ้าวัน complete < 10 ใน 14 วันล่าสุด; สูตร `avgKcal − (trendEnd − trendStart) × 7700 / days`

- [ ] **Step 1: Write failing tests**
  - `bmrMifflin('male', 100, 175, 30)` → `1948.75`; `bmrMifflin('female', 70, 160, 30)` → `1389`
  - `ewmaTrend` จาก [100, 100, 101] วันติดกัน → trend สุดท้าย `100.1` (±0.001)
  - `ewmaTrend handles gaps`: [100 วันที่ 1, 98 วันที่ 4] → trend `100 + (1−0.9³)(98−100)` = `99.458`
  - `adaptiveTdee`: 14 วัน complete กิน 2500, trend ลด 1 kg → `2500 + 7700/14` = `3050`
  - `adaptiveTdee` ได้ `null` เมื่อ complete แค่ 9 วัน
  - `adaptiveTdee` ไม่นับวัน `complete: false` (ใส่วัน 500 kcal ไม่ complete แล้วผลเท่าเดิม)
- [ ] **Step 2:** `npx vitest run src/domain/energy.test.ts` → FAIL
- [ ] **Step 3:** Implement ตาม Interfaces
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5:** Commit `feat: energy math (BMR, trend, adaptive TDEE)`

### Task 3: เป้าสารอาหาร (`src/domain/targets.ts`)

**Files:**
- Create: `src/domain/targets.ts`, `src/domain/targets.test.ts`

**Interfaces:**
- Consumes: types, `bmrMifflin`
- Produces:
  - `interface DayTargets { kcal: number; proteinG: number; fatG: number; carbG: number; fiberG: number; sodiumMaxMg: number; waterMl: number; micros: MicroTargets; medicalBanner: boolean }`
  - `proteinRefWeight(p: Profile, kg: number): number` — `targetWeightKg` ถ้า BMI (kg/(h/100)²) ≥ 25 ไม่งั้น `kg`
  - `effectiveRatePct(p: Profile, trendKg: number): number` — `0` ถ้า goal `maintain` หรือ specialGroup ≠ none; `-0.5` ถ้า `trendKg − targetWeightKg ≤ 5`; ไม่งั้น `weeklyRatePct`
  - `weeklyKcalTarget(args: { tdee: number; trendKg: number; ratePct: number; bmr: number; previous: number | null }): number` — `raw = tdee + ratePct/100 × trendKg × 7700 / 7`; clamp ให้ต่างจาก `previous` ไม่เกิน ±150 (ถ้ามี); แล้ว `max(bmr)`; ปัดเป็นทวีคูณ 10
  - `dayTargets(p: Profile, trendKg: number, weeklyKcal: number, micros: MicroTargets): DayTargets` — โปรตีน `2.0 × refWeight` (กลุ่มพิเศษ `0.8 × kg`); ไขมัน `max(0.25 × kcal / 9, 0.5 × refWeight)`; คาร์บ `(kcal − P×4 − F×9)/4` โดยใช้ P และ F ที่ปัดเป็นจำนวนเต็มแล้ว; ใยอาหาร `14 × kcal/1000`; น้ำ `33 × kg`; ปัดกรัมเป็นจำนวนเต็ม

- [ ] **Step 1: Write failing tests**
  - `proteinRefWeight` ผู้ชาย 175 cm 100 kg เป้า 78 → `78`; 175 cm 70 kg → `70`
  - `dayTargets` kcal 2400 ref 78 → protein `156`, fat `67`, carb `(2400 − 624 − 603)/4` = `293`, fiber `34`
  - `weeklyKcalTarget({tdee: 3000, trendKg: 100, ratePct: -0.75, bmr: 1949, previous: null})` → `2180` (3000 − 825 = 2175 → ปัด 2180)
  - **น้ำหนักกระโดด:** เหมือนข้างบนแต่ `previous: 2500` → `2350`
  - floor: `tdee 1900, ratePct -1, trendKg 100, bmr 1949, previous null` → raw 800 ต่ำกว่า BMR → `1950` (ปัดขึ้นเป็นทวีคูณ 10)
  - `effectiveRatePct` specialGroup `kidney` → `0`; `dayTargets` kidney → `medicalBanner: true`, protein `0.8 × kg`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** Implement (floor: ปัดขึ้นเป็นทวีคูณ 10 เมื่อชน BMR)
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5:** Commit `feat: daily nutrient targets`

### Task 4: ข้อมูลอาหาร + ค่าแนะนำวิตามิน/แร่ธาตุ

**Files:**
- Create: `scripts/build-foods.ts`, `data/foods.ids.json`, `src/data/foods.seed.json` (generated, committed), `src/data/dri.ts`, `src/domain/nutrients.ts`, `src/domain/nutrients.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface Nutrients { kcal: number; proteinG: number; fatG: number; carbG: number; fiberG: number;
    sodiumMg: number; calciumMg: number; ironMg: number; potassiumMg: number; magnesiumMg: number; vitaminDUg: number }
  type MicroTargets = Pick<Nutrients, 'calciumMg' | 'ironMg' | 'potassiumMg' | 'magnesiumMg' | 'vitaminDUg'>
  interface Food { id: string; nameTh: string; nameEn: string; state: 'raw' | 'cooked' | 'na';
    source: 'usda' | 'thai_fcd' | 'custom'; sourceRef: string; per100g: Nutrients }
  ```
  - `nutrientsFor(food: Food, grams: number): Nutrients`
  - `sumNutrients(list: Nutrients[]): Nutrients`
  - `driFor(sex: Sex, age: number): MicroTargets` (`src/data/dri.ts`)

- [ ] **Step 1:** ตรวจสิทธิ์การใช้ตารางองค์ประกอบอาหารไทย (มหิดล) — ถ้าใช้ไม่ได้หรือดาวน์โหลดไม่ได้ ใช้ USDA FoodData Central (SR Legacy, public domain) อย่างเดียว **ถามผู้ใช้ก่อนดาวน์โหลดไฟล์** (ชื่อไฟล์ แหล่ง ขนาด)
- [ ] **Step 2:** `data/foods.ids.json` รายการอาหารเริ่มต้น ~60 รายการ พร้อมชื่อไทย แยกดิบ/สุกเป็นคนละรายการ ต้องมี: ข้าวขาว ดิบ/สุก, ข้าวกล้อง ดิบ/สุก, อกไก่ ดิบ/สุก, สะโพกไก่, หมูสันใน, เนื้อวัวไม่ติดมัน, ปลา, ไข่ไก่, ไข่ขาว, เต้าหู้, นมจืด, เวย์โปรตีน (custom จากฉลาก), กล้วย, ผักใบเขียวหลัก, น้ำมันพืช, ขนมปังโฮลวีต, ข้าวโอ๊ต, เส้นก๋วยเตี๋ยว
- [ ] **Step 3:** `scripts/build-foods.ts` อ่าน CSV ของแหล่งข้อมูล → เขียน `src/data/foods.seed.json` (ค่าที่ไม่มีในแหล่ง = 0 และบันทึกไว้ใน `sourceRef`)
- [ ] **Step 4:** `src/data/dri.ts` ค่าจาก Thai DRI 2563 (กรมอนามัย) สำหรับชาย/หญิง 19–30, 31–50, 51–70 ใส่ comment อ้างหน้าในเอกสารทุกค่า; vitamin D ใช้ค่าในเอกสารเดียวกัน
- [ ] **Step 5: Write failing tests** `nutrientsFor(ข้าวสุก, 200)` → kcal = `2 × per100g.kcal`; `sumNutrients` รวมถูกทุกฟิลด์; seed: ทุก food มี `sourceRef` ไม่ว่าง และ kcal ≈ `4P + 4C + 9F` ภายใน ±15% (จับข้อมูลนำเข้าผิดคอลัมน์); `ข้าวขาว ดิบ` kcal/100g > 300 และ `สุก` < 150
- [ ] **Step 6:** Run → FAIL → implement → PASS
- [ ] **Step 7:** Commit `feat: food data and nutrient math`

### Task 5: ฐานข้อมูลในเครื่อง (`src/db/`)

**Files:**
- Create: `src/db/db.ts`, `src/db/repo.ts`, `src/db/repo.test.ts`

**Interfaces:**
- Consumes: types จาก Task 2–4
- Produces:
  - `interface FoodLog { id: string; profileId: string; date: string; foodId: string; grams: number; source: 'weighed' | 'photo' | 'standard_menu'; estimated: boolean; createdAt: number }`
  - `interface Recipe { id: string; profileId: string; name: string; items: { foodId: string; grams: number }[] }`
  - `interface WaistLog { profileId: string; date: string; cm: number }` · `interface CycleLog { profileId: string; date: string }` · `interface DayStatus { profileId: string; date: string; complete: boolean }` · `interface TargetRecord { profileId: string; weekStart: string; kcal: number; tdee: number; reason: string }`
  - `repo` (ทั้งหมด async): `saveProfile`, `listProfiles`, `addFoodLog`, `deleteFoodLog`, `logsForDay(profileId, date)`, `saveRecipe`, `listRecipes(profileId)`, `logRecipe(recipeId, date)`, `addWeighIn` (upsert ต่อวัน), `weighIns(profileId)`, `addWaist`, `setDayComplete(profileId, date, complete)`, `dayIntakes(profileId, fromDate, toDate): DayIntake[]`, `searchFoods(q: string): Food[]` (ค้นทั้งชื่อไทย/อังกฤษ ไม่สนตัวพิมพ์), `latestTarget(profileId)`, `saveTarget`
  - Dexie DB ชื่อ `kumahan`, version 1, seed foods ครั้งแรกจาก `foods.seed.json`

- [ ] **Step 1: Write failing tests** (ใช้ `fake-indexeddb/auto`): addWeighIn วันเดียวกัน 2 ครั้ง → เหลือ 1 รายการค่าล่าสุด; `logRecipe` สร้าง FoodLog ตามจำนวน items; `dayIntakes` คืน kcal รวมรายวันและ `complete` ตาม DayStatus (ไม่มี = false); `searchFoods('ไก่')` เจออกไก่ดิบและสุก
- [ ] **Step 2:** Run → FAIL → implement → PASS
- [ ] **Step 3:** Commit `feat: local database and repository`

### Task 6: ตั้งค่าโปรไฟล์ + บันทึกอาหารแบบชั่ง (UI) — ใช้ skill impeccable

**Files:**
- Create: `src/ui/ProfileSetup.tsx`, `src/ui/FoodLogScreen.tsx`, `src/ui/AddFoodSheet.tsx`, `src/ui/validate.ts`, `src/ui/*.test.tsx`
- Modify: `src/App.tsx` (เลือกโปรไฟล์ → แท็บ วันนี้ / อาหาร / น้ำหนัก)

**Interfaces:**
- Consumes: `repo`, `nutrientsFor`
- Produces: `parseGrams(input: string): { ok: true; grams: number } | { ok: false; error: string }` — รับ 1–3000 (ทศนิยมได้, ตัดช่องว่าง); error ภาษาไทย

- [ ] **Step 1: Write failing tests**
  - `parseGrams('200')` ok 200; `'0.2'` → error `"ใส่น้ำหนักเป็นกรัม (1–3000)"`; `'20000'` → error เดียวกัน; `'abc'` → error
  - ProfileSetup: เลือก "ไต" ในคำถามกลุ่มพิเศษ → บันทึก `specialGroup: 'kidney'` และเห็นข้อความแนะนำปรึกษาแพทย์
  - FoodLogScreen: เลือกวันที่เมื่อวานบนหน้าจอแล้วเพิ่มอาหาร → log มี `date` = เมื่อวาน (Review Focus 4)
  - AddFoodSheet: ผลค้นหาแสดงป้าย "ดิบ"/"สุก" ทุกรายการที่ state ≠ na
- [ ] **Step 2:** Run → FAIL → implement → PASS
- [ ] **Step 3:** ปุ่ม "บันทึกเป็นมื้อโปรด" (สร้าง Recipe จาก log ของมื้อนั้น) และ "วันนี้บันทึกครบแล้ว" (`setDayComplete`)
- [ ] **Step 4:** Commit `feat: profile setup and weighed food logging`

### Task 7: น้ำหนัก รอบเอว รอบเดือน + กราฟแนวโน้ม — ใช้ skill impeccable

**Files:**
- Create: `src/ui/BodyScreen.tsx`, `src/ui/TrendChart.tsx` (SVG เอง ไม่เพิ่มไลบรารี), `src/ui/BodyScreen.test.tsx`

**Interfaces:**
- Consumes: `repo.addWeighIn`, `repo.weighIns`, `repo.addWaist`, `ewmaTrend`

- [ ] **Step 1: Write failing tests:** บันทึก 100, 101 → หน้าจอแสดง "แนวโน้ม" ค่าจาก `ewmaTrend` (1 ตำแหน่งทศนิยม) ไม่ใช่ค่าล่าสุด; ช่องรอบเดือนแสดงเฉพาะ `sex: 'female'`
- [ ] **Step 2:** Run → FAIL → implement (กราฟ: จุดน้ำหนักรายวันจาง + เส้นแนวโน้มเข้ม, จุดวันรอบเดือนมีสัญลักษณ์) → PASS
- [ ] **Step 3:** Commit `feat: body tracking with trend chart`

### Task 8: ปรับเป้ารายสัปดาห์อัตโนมัติ (`src/domain/weeklyUpdate.ts`)

**Files:**
- Create: `src/domain/weeklyUpdate.ts`, `src/domain/weeklyUpdate.test.ts`
- Modify: `src/App.tsx` (เรียกตอนเปิดแอป)

**Interfaces:**
- Consumes: `bmrMifflin`, `ewmaTrend`, `adaptiveTdee`, `effectiveRatePct`, `weeklyKcalTarget`, repo
- Produces: `runWeeklyUpdate(profileId: string, today: string): Promise<TargetRecord | null>` — ทำงานเมื่อยังไม่มี target หรือ target ล่าสุดเก่า ≥ 7 วัน; `tdee = adaptiveTdee(...) ?? bmr × activityFactor`; บันทึก `reason` ภาษาไทยที่บอกว่าใช้ค่าไหน เช่น `"ใช้สูตรประมาณ เพราะบันทึกครบแค่ 6 วันใน 14 วัน"` หรือ `"แนวโน้มลด 0.6 kg/สัปดาห์ ช้ากว่าเป้า จึงลด 150 kcal"`

- [ ] **Step 1: Write failing tests:** ไม่มีน้ำหนัก → คืน `null` (ไม่สร้างเป้า) และ UI ขอให้ชั่งก่อน; target ล่าสุด 3 วันก่อน → `null`; สัปดาห์ที่ complete < 5 วัน → kcal = ค่าเดิม และ reason มีคำว่า "บันทึกไม่ครบ"; ข้อมูล 14 วันครบ → ใช้ adaptive
- [ ] **Step 2:** Run → FAIL → implement → PASS
- [ ] **Step 3:** Commit `feat: weekly target auto-adjust`

### Task 9: สรุปรายวัน "ที่เหลือวันนี้" — ใช้ skill impeccable

**Files:**
- Create: `src/domain/dailySummary.ts`, `src/domain/dailySummary.test.ts`, `src/ui/TodayScreen.tsx`

**Interfaces:**
- Consumes: `dayTargets`, `driFor`, `sumNutrients`, repo
- Produces: `dailySummary(targets: DayTargets, eaten: Nutrients, foods: Food[]): { rows: { key: string; label: string; eaten: number; target: number; status: 'under' | 'ok' | 'over' }[]; suggestions: string[] }`
  - `ok` = 90–110% ของเป้า (โซเดียม: ok ถ้า ≤ เป้า, เกิน = `over`)
  - suggestion โปรตีน เมื่อขาด ≥ 15 g: 2 อาหารที่โปรตีนต่อ 100 kcal สูงสุดจาก foods ที่ผู้ใช้เคยบันทึก (ถ้าไม่มีใช้ seed) รูปแบบ `"ยังขาดโปรตีน 40 g — เช่น อกไก่ (สุก) 130 g"` (กรัม = gap / protein ต่อกรัม ปัดเป็น 10)
  - suggestion ใยอาหาร เมื่อขาด ≥ 8 g; ถ้าโซเดียมเกิน: `"โซเดียมเกินเป้าแล้ว — มื้อที่เหลือเลี่ยงน้ำซุป/น้ำจิ้ม"`

- [ ] **Step 1: Write failing tests:** protein เป้า 156 กิน 116 + foods มีอกไก่สุก 31 g/100g → suggestion `"ยังขาดโปรตีน 40 g — เช่น อกไก่ (สุก) 130 g"`; กินโปรตีน 150/156 → `ok` ไม่มี suggestion; โซเดียม 2300/2000 → `over`
- [ ] **Step 2:** Run → FAIL → implement → PASS
- [ ] **Step 3:** TodayScreen: แถบความคืบหน้าแต่ละสารอาหาร, กลุ่มวิตามิน/แร่ธาตุพับได้, แบนเนอร์แพทย์เมื่อ `medicalBanner`, ป้าย "ประมาณ" ถ้ามี log `estimated`
- [ ] **Step 4:** Commit `feat: daily summary screen`

### Task 10: ติดตั้งบนมือถือ + ตรวจรวม

**Files:** Modify: `vite.config.ts` (ไอคอน), `README.md` (วิธีใช้ภาษาไทย)

- [ ] **Step 1:** `npx vitest run` → ทุก test ผ่าน; `npm run build` → สำเร็จ
- [ ] **Step 2:** ทดสอบใน browser pane ที่ความกว้าง 375px: สร้างโปรไฟล์ → บันทึกข้าวสุก 200 g + อกไก่ 100 g → ตัวเลขตรงกับ `nutrientsFor` → ชั่งน้ำหนัก → หน้าวันนี้แสดงเป้า
- [ ] **Step 3:** Deploy: **ผู้ใช้ต้องสมัคร hosting ฟรีเอง** (Cloudflare Pages หรือ Netlify) แล้วอัปโหลด `dist/` — PWA ต้องใช้ HTTPS ถึงจะติดตั้งบนมือถือได้
- [ ] **Step 4:** Commit `chore: phase 1 release`
