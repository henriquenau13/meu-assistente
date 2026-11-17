import { useRef, useState } from 'react'
import Eyes from './Eyes'
import QuickPanel from './QuickPanel'
import './Assistant.css'

function Assistant() {
  const [mode, setMode] = useState('closed') // closed | quick | full
  const closeTimer = useRef(null)

  // Mouse entrou: abre o painel rápido
  const handleEnter = () => {
    clearTimeout(closeTimer.current)
    setMode((m) => (m === 'closed' ? 'quick' : m))
  }

  // Mouse saiu: fecha depois de 250ms (evita fechar sem querer)
  // No painel completo, ele NÃO fecha sozinho
  const handleLeave = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setMode((m) => (m === 'quick' ? 'closed' : m))
    }, 250)
  }

  return (
    <div
      className="assistant"
      data-mode={mode}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="island">
        <Eyes />

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