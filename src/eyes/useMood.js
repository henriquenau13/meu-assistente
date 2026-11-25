import { useCallback, useEffect, useState } from 'react'

const SLEEPY_AFTER = 15000 // 15s sem uso -> sonolento (use 5000 para testar rápido)
const SLEEP_AFTER = 4000   // +4s -> dormindo

// mood: neutral | sleepy | sleeping | waking
export function useMood(mode) {
  const [mood, setMood] = useState('neutral')

  useEffect(() => {
    let timer

    if (mood === 'waking') {
      timer = setTimeout(() => setMood('neutral'), 800)
    } else if (mode === 'closed' && mood === 'neutral') {
      timer = setTimeout(() => setMood('sleepy'), SLEEPY_AFTER)
    } else if (mode === 'closed' && mood === 'sleepy') {
      timer = setTimeout(() => setMood('sleeping'), SLEEP_AFTER)
    }

    return () => clearTimeout(timer)
  }, [mode, mood])

  // acorda se estiver dormindo ou sonolento
  const wake = useCallback(() => {
    setMood((m) => (m === 'sleeping' || m === 'sleepy' ? 'waking' : m))
  }, [])

  return { mood, setMood, wake }
}