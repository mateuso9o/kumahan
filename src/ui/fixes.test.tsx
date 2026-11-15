import 'fake-indexeddb/auto'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRepo, type Repo } from '../db/repo'
import type { Profile } from '../domain/types'
import { ProfileSetup } from './ProfileSetup'
import { TodayScreen } from './TodayScreen'
import { useToday } from './useToday'

const me: Profile = {
  id: 'p', name: 'ฉัน', sex: 'male', birthYear: 1996, heightCm: 175, goal: 'recomp', targetWeightKg: 78,
  activityFactor: 1.375, weeklyRatePct: -0.75, specialGroup: 'none', trainingDays: [1, 2, 4, 5],
}
let repo: Repo
let n = 0
beforeEach(async () => { repo = await createRepo(`fx-${n++}`) })

test('a birth year under 18 selects the under-18 group and shows the advice', async () => {
  const user = userEvent.setup()
  render(<ProfileSetup repo={repo} today="2026-01-15" onDone={() => {}} />)
  await user.type(screen.getByLabelText('ปีเกิด (ค.ศ.)'), '2011')
  expect(screen.getByLabelText('อายุต่ำกว่า 18 ปี')).toBeChecked()
  expect(screen.getByText(/ก่อนเปลี่ยนการกิน/)).toBeInTheDocument()
})

test('editing a profile keeps its id and does not duplicate it', async () => {
  const user = userEvent.setup()
  await repo.saveProfile(me)
  const onDone = vi.fn()
  render(<ProfileSetup repo={repo} today="2026-01-15" initial={me} onDone={onDone} />)
  const target = screen.getByLabelText('น้ำหนักเป้าหมาย (kg)')
  await user.clear(target)
  await user.type(target, '80')
  await user.click(screen.getByLabelText('โรคไต'))
  await user.click(screen.getByRole('button', { name: 'บันทึกโปรไฟล์' }))
  await waitFor(() => expect(onDone).toHaveBeenCalled())
  const all = await repo.listProfiles()
  expect(all).toHaveLength(1)
  expect(all[0]).toMatchObject({ id: 'p', targetWeightKg: 80, specialGroup: 'kidney' })
})

test('special-group protein source line does not quote the 1.6-2.2 research range', async () => {
  await repo.saveTarget({ profileId: 'p', weekStart: '2026-01-15', kcal: 2400, tdee: 2400, reason: 'x' })
  await repo.addWeighIn({ profileId: 'p', date: '2026-01-15', kg: 100 })
  render(<TodayScreen repo={repo} profile={{ ...me, specialGroup: 'pregnant' }} date="2026-01-15" today="2026-01-15" onAddFood={() => {}} />)
  await screen.findByText(/ที่มาของตัวเลข/)
  expect(screen.queryByText(/1\.6–2\.2/)).not.toBeInTheDocument()
})

test('useToday moves to the new day when the app comes back after midnight', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-15T23:50:00'))
  let seen = ''
  function Probe() { seen = useToday(); return null }
  render(<Probe />)
  expect(seen).toBe('2026-01-15')
  vi.setSystemTime(new Date('2026-01-16T07:00:00'))
  act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  expect(seen).toBe('2026-01-16')
  vi.useRealTimers()
})
