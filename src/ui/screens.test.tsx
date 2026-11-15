import 'fake-indexeddb/auto'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRepo, type Repo } from '../db/repo'
import type { Profile } from '../domain/types'
import { ProfileSetup } from './ProfileSetup'
import { FoodLogScreen } from './FoodLogScreen'
import { BodyScreen } from './BodyScreen'
import { TodayScreen } from './TodayScreen'

const me: Profile = {
  id: 'p', name: 'ฉัน', sex: 'male', birthYear: 1996, heightCm: 175, goal: 'recomp', targetWeightKg: 78,
  activityFactor: 1.375, weeklyRatePct: -0.75, specialGroup: 'none', trainingDays: [1, 2, 4, 5],
}
let repo: Repo
let n = 0
beforeEach(async () => {
  repo = await createRepo(`ui-${n++}`)
})

describe('ProfileSetup', () => {
  test('kidney disease is saved as a special group and shows the doctor advice', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<ProfileSetup repo={repo} today="2026-01-15" onDone={onDone} />)
    await user.type(screen.getByLabelText('ชื่อ'), 'แม่')
    await user.type(screen.getByLabelText('ปีเกิด (ค.ศ.)'), '1970')
    await user.type(screen.getByLabelText('ส่วนสูง (cm)'), '160')
    await user.type(screen.getByLabelText('น้ำหนักตอนนี้ (kg)'), '65')
    await user.type(screen.getByLabelText('น้ำหนักเป้าหมาย (kg)'), '60')
    await user.click(screen.getByLabelText('โรคไต'))
    expect(screen.getByText(/ก่อนเปลี่ยนการกิน/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'บันทึกโปรไฟล์' }))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    const [saved] = await repo.listProfiles()
    expect(saved.specialGroup).toBe('kidney')
    expect(await repo.weighIns(saved.id)).toEqual([{ profileId: saved.id, date: '2026-01-15', kg: 65 }])
  })
})

describe('FoodLogScreen', () => {
  test('a food added while viewing yesterday is logged on yesterday', async () => {
    const user = userEvent.setup()
    function Harness() {
      return <FoodLogScreen repo={repo} profile={me} date="2026-01-14" onDateChange={() => {}} />
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'เพิ่มอาหาร' }))
    await user.type(screen.getByLabelText('ค้นหาอาหาร'), 'ข้าวขาว')
    const results = await screen.findByRole('list', { name: 'ผลการค้นหา' })
    await user.click(within(results).getByRole('button', { name: /ข้าวขาว.*สุก/ }))
    await user.type(screen.getByLabelText('น้ำหนัก (กรัม)'), '200')
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))
    await waitFor(async () => expect((await repo.logsForDay('p', '2026-01-14')).length).toBe(1))
    expect((await repo.logsForDay('p', '2026-01-14'))[0]).toMatchObject({ foodId: 'usda-168878', grams: 200 })
  })

  test('search results label raw and cooked', async () => {
    const user = userEvent.setup()
    render(<FoodLogScreen repo={repo} profile={me} date="2026-01-14" onDateChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'เพิ่มอาหาร' }))
    await user.type(screen.getByLabelText('ค้นหาอาหาร'), 'อกไก่')
    const results = await screen.findByRole('list', { name: 'ผลการค้นหา' })
    expect(within(results).getByText('ดิบ')).toBeInTheDocument()
    expect(within(results).getByText('สุก')).toBeInTheDocument()
  })

  test('grams in the wrong unit show an error and log nothing', async () => {
    const user = userEvent.setup()
    render(<FoodLogScreen repo={repo} profile={me} date="2026-01-14" onDateChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'เพิ่มอาหาร' }))
    await user.type(screen.getByLabelText('ค้นหาอาหาร'), 'ข้าวขาว')
    const results = await screen.findByRole('list', { name: 'ผลการค้นหา' })
    await user.click(within(results).getByRole('button', { name: /ข้าวขาว.*สุก/ }))
    await user.type(screen.getByLabelText('น้ำหนัก (กรัม)'), '0.2')
    await user.click(screen.getByRole('button', { name: 'บันทึก' }))
    expect(await screen.findByText('ใส่น้ำหนักเป็นกรัม (1–3000)')).toBeInTheDocument()
    expect(await repo.logsForDay('p', '2026-01-14')).toEqual([])
  })
})

describe('BodyScreen', () => {
  test('shows the trend, not the latest weight', async () => {
    await repo.addWeighIn({ profileId: 'p', date: '2026-01-14', kg: 100 })
    await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 101 })
    render(<BodyScreen repo={repo} profile={me} today="2026-01-15" />)
    expect(await screen.findByText('100.1')).toBeInTheDocument()
  })
  test('cycle logging only for female profiles', async () => {
    const { unmount } = render(<BodyScreen repo={repo} profile={me} today="2026-01-15" />)
    await screen.findByText('น้ำหนักแนวโน้ม (kg)')
    expect(screen.queryByText(/รอบเดือน/)).not.toBeInTheDocument()
    unmount()
    render(<BodyScreen repo={repo} profile={{ ...me, sex: 'female' }} today="2026-01-15" />)
    expect(await screen.findByText(/รอบเดือน/)).toBeInTheDocument()
  })
})

describe('TodayScreen', () => {
  test('asks for a weigh-in before any target exists', async () => {
    render(<TodayScreen repo={repo} profile={me} date="2026-01-15" today="2026-01-15" onAddFood={() => {}} />)
    expect(await screen.findByText(/ชั่งน้ำหนักครั้งแรก/)).toBeInTheDocument()
  })
  test('shows remaining energy and the protein suggestion', async () => {
    await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-15', kcal: 2400, tdee: 3000, reason: 'ใช้สูตรประมาณ' })
    await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 100 })
    await repo.addFoodLog({ profileId: 'p', date: '2026-01-15', foodId: 'usda-168878', grams: 200, source: 'weighed', estimated: false })
    render(<TodayScreen repo={repo} profile={me} date="2026-01-15" today="2026-01-15" onAddFood={() => {}} />)
    expect(await screen.findByText('2,140')).toBeInTheDocument()
    expect(screen.getByText(/ยังขาดโปรตีน/)).toBeInTheDocument()
  })
  test('special group shows the medical banner', async () => {
    await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-15', kcal: 2400, tdee: 2400, reason: 'x' })
    await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 100 })
    render(<TodayScreen repo={repo} profile={{ ...me, specialGroup: 'kidney' }} date="2026-01-15" today="2026-01-15" onAddFood={() => {}} />)
    expect(await screen.findByText(/ควรปรึกษาแพทย์/)).toBeInTheDocument()
  })
})
