import { useRef, useState } from 'react'
import { Eyes, useMood } from '../eyes'
import QuickPanel from './QuickPanel'
import { WIDGETS } from './widgets'
import './Assistant.css'

// Cápsula sem widget aberto (barra com os nomes embaixo dos ícones)
const IDLE_HEIGHT = 132
// Cápsula com widget aberto (barra compacta, sem os nomes)
const BAR_HEIGHT = 120
// Espaço entre a barra e o widget (precisa bater com o CSS)
const WIDGET_GAP = 8

function Assistant() {
  const [mode, setMode] = useState('closed') // closed | quick | full
  const [widget, setWidget] = useState(null) // id do widget aberto (ou null)
  const closeTimer = useRef(null)

  const { mood, wake } = useMood(mode)

  // A altura da cápsula acompanha o widget aberto
  const widgetHeight = WIDGETS.find((w) => w.id === widget)?.height
  const quickHeight = widgetHeight
    ? BAR_HEIGHT + widgetHeight + WIDGET_GAP
    : IDLE_HEIGHT

  const handleEnter = () => {
    clearTimeout(closeTimer.current)
    window.assistantWindow?.setIgnoreMouse(false)

    // ao abrir do zero, começa sem nenhum widget aberto
    if (mode === 'closed') setWidget(null)

    setMode((m) => (m === 'closed' ? 'quick' : m))
    wake()
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
      style={{ '--quick-h': `${quickHeight}px` }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="island">
        <Eyes mood={mood} active={mode === 'closed' && mood === 'neutral'} />

        <div className="layer layer-quick">
          <QuickPanel
            widget={widget}
            onSelect={setWidget}
            onExpand={() => setMode('full')}
          />
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