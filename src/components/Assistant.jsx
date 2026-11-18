import { useEffect, useRef, useState } from 'react'
import Eyes from './Eyes'
import QuickPanel from './QuickPanel'
import './Assistant.css'

const SLEEPY_AFTER = 15000 // 15s sem uso -> sonolento (use 5000 para testar rápido)
const SLEEP_AFTER = 4000   // +4s -> dormindo

function Assistant() {
  const [mode, setMode] = useState('closed') // closed | quick | full
  const [mood, setMood] = useState('neutral') // neutral | sleepy | sleeping | waking
  const closeTimer = useRef(null)

  // Ciclo de humor: acordado -> sonolento -> dormindo, e acordando -> normal
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

  const handleEnter = () => {
    clearTimeout(closeTimer.current)
    window.assistantWindow?.setIgnoreMouse(false)
    setMode((m) => (m === 'closed' ? 'quick' : m))
    setMood((m) => (m === 'sleeping' || m === 'sleepy' ? 'waking' : m))
  }

  const handleLeave = () => {
    clearTimeout(closeTimer.current)
    window.assistantWindow?.setIgnoreMouse(true)

    closeTimer.current = setTimeout(() => {
      setMode((m) => (m === 'quick' ? 'closed' : m))
    }, 250)
  }

  return (
    <div
      className="assistant"
      data-mode={mode}
      data-mood={mood}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="island">
        <Eyes mood={mood} active={mode === 'closed' && mood === 'neutral'} />

        <div className="layer layer-quick">
          <QuickPanel onExpand={() => setMode('full')} />
        </div>

        <div className="layer layer-full">
          <div className="full-placeholder">
            <h2>Painel completo</h2>
            <p>Na próxima etapa vamos construir o menu lateral aqui.</p>

            <button className="back-btn" onClick={() => setMode('quick')}>
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Assistant