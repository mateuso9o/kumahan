import { useCallback, useEffect, useRef, useState } from 'react'
import { Apple, Flag as FlagIcon, Pencil, Scale, UserPlus } from 'lucide-react'
import { createRepo, type Repo } from './db/repo'
import { runWeeklyUpdate } from './domain/weeklyUpdate'
import type { Profile } from './domain/types'
import { BodyScreen } from './ui/BodyScreen'
import { DateNav } from './ui/DateNav'
import { FoodLogScreen } from './ui/FoodLogScreen'
import { ProfileSetup } from './ui/ProfileSetup'
import { TodayScreen } from './ui/TodayScreen'
import { useToday } from './ui/useToday'

type Tab = 'today' | 'food' | 'body'
const ACTIVE_KEY = 'active-profile'

function readActive(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY) } catch { return null }
}
function writeActive(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id) } catch { /* private mode: falls back to first profile */ }
}

export default function App() {
  const [repo, setRepo] = useState<Repo | null>(null)
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [activeId, setActiveId] = useState<string | null>(readActive())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<Tab>('today')
  const [openAdd, setOpenAdd] = useState(false)
  const [version, setVersion] = useState(0)
  const today = useToday()
  const [date, setDate] = useState(today)
  // When the day rolls over while the app is open on 'today', follow it to the new today.
  const prevToday = useRef(today)
  useEffect(() => {
    if (prevToday.current !== today) {
      setDate((d) => (d === prevToday.current ? today : d))
      prevToday.current = today
    }
  }, [today])

  useEffect(() => {
    if (typeof indexedDB === 'undefined') return
    createRepo().then(async (r) => {
      setRepo(r)
      setProfiles(await r.listProfiles())
    })
  }, [])

  const profile = profiles?.find((p) => p.id === activeId) ?? profiles?.[0] ?? null

  const refreshTargets = useCallback(async () => {
    if (!repo || !profile) return
    await runWeeklyUpdate(repo, profile.id, today)
    setVersion((v) => v + 1)
  }, [repo, profile, today])

  useEffect(() => { refreshTargets() }, [refreshTargets])

  const showSetup = repo && profiles && (profiles.length === 0 || adding || editing)

  return (
    <div className="app">
      <header className="shell">
        <div className="shell__row">
          <h1 className="shell__title">คุมอาหาร</h1>
          {profiles && profiles.length > 0 && !showSetup && (
            <div className="shell__who">
              <label className="sr-only" htmlFor="who">ผู้ใช้</label>
              <select id="who" value={profile?.id} onChange={(e) => { setActiveId(e.target.value); writeActive(e.target.value) }}>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="button" className="icon-btn icon-btn--on-shell" aria-label="แก้ไขโปรไฟล์" onClick={() => setEditing(true)}>
                <Pencil size={18} aria-hidden />
              </button>
              <button type="button" className="icon-btn icon-btn--on-shell" aria-label="เพิ่มคน" onClick={() => setAdding(true)}>
                <UserPlus size={20} aria-hidden />
              </button>
            </div>
          )}
        </div>
        {profile && !showSetup && tab !== 'body' && <DateNav date={date} today={today} onChange={setDate} />}
      </header>

      <main className="content">
        {showSetup && (
          <ProfileSetup
            repo={repo}
            today={today}
            initial={editing && profile ? profile : undefined}
            onCancel={profiles.length > 0 ? () => { setAdding(false); setEditing(false) } : undefined}
            onDone={async (p) => {
              setProfiles(await repo.listProfiles())
              setActiveId(p.id); writeActive(p.id); setAdding(false); setEditing(false); setTab('today')
            }}
          />
        )}
        {repo && profile && !showSetup && (
          <>
            {tab === 'today' && (
              <TodayScreen key={`${profile.id}-${date}-${version}`} repo={repo} profile={profile} date={date} today={today}
                onAddFood={() => { setOpenAdd(true); setTab('food') }} />
            )}
            {tab === 'food' && (
              <FoodLogScreen key={`${profile.id}-${date}`} repo={repo} profile={profile} date={date} startOpen={openAdd} />
            )}
            {tab === 'body' && <BodyScreen key={profile.id} repo={repo} profile={profile} today={today} onSaved={refreshTargets} />}
          </>
        )}
      </main>

      {profile && !showSetup && (
        <nav className="tabs" aria-label="เมนูหลัก">
          {([['today', 'วันนี้', FlagIcon], ['food', 'อาหาร', Apple], ['body', 'ร่างกาย', Scale]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" className="tabs__item" aria-current={tab === id ? 'page' : undefined}
              onClick={() => { setTab(id); setOpenAdd(false) }}>
              <Icon size={22} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
