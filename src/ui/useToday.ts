import { useEffect, useState } from 'react'
import { todayLocal } from './dates'

/** Today's local date, re-read whenever the app regains focus (a home-screen PWA can sleep overnight). */
export function useToday(): string {
  const [today, setToday] = useState(todayLocal())
  useEffect(() => {
    const check = () => setToday(todayLocal())
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])
  return today
}
