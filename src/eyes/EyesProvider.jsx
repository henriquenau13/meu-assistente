import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EyesContext } from './eyesContext'
import { REACTIONS } from './reactions'

export function EyesProvider({ children }) {
  const [reaction, setReaction] = useState(null)
  const timer = useRef(null)

  // react('happy')  ou  react('happy', 3000) para escolher a duração
  const react = useCallback((name, ms) => {
    const def = REACTIONS[name]
    if (!def) return

    clearTimeout(timer.current)
    setReaction(name)
    timer.current = setTimeout(() => setReaction(null), ms ?? def.duration)
  }, [])

  // calm() volta os olhos ao normal na hora
  const calm = useCallback(() => {
    clearTimeout(timer.current)
    setReaction(null)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const value = useMemo(() => ({ reaction, react, calm }), [reaction, react, calm])

  return <EyesContext.Provider value={value}>{children}</EyesContext.Provider>
}