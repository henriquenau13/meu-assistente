import { useRef, useState } from 'react'
import QuickHeader from './QuickHeader'
import HomePage from './pages/HomePage'
import TodayPage from './pages/TodayPage'
import MusicPage from './pages/MusicPage'
import OrganizePage from './pages/OrganizePage'
import './QuickPanel.css'

const PAGES = [
  { id: 'home', title: 'Início', Component: HomePage },
  { id: 'today', title: 'Hoje', Component: TodayPage },
  { id: 'music', title: 'Música', Component: MusicPage },
  { id: 'organize', title: 'Organização', Component: OrganizePage },
]

function QuickPanel({ onExpand }) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const goTo = (i) => setIndex(Math.max(0, Math.min(PAGES.length - 1, i)))
  const go = (id) => goTo(PAGES.findIndex((p) => p.id === id))

  // ----- arrastar -----
  const onDown = (e) => {
    startX.current = e.clientX
    setDragging(true)
  }
  const onMove = (e) => {
    if (dragging) setDragX(e.clientX - startX.current)
  }
  const onUp = () => {
    if (!dragging) return
    if (dragX < -60) goTo(index + 1)
    else if (dragX > 60) goTo(index - 1)
    setDragging(false)
    setDragX(0)
  }

  return (
    <div className="quick">
      <QuickHeader />

      <div
        className="quick-viewport"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <div
          className={`quick-track ${dragging ? 'dragging' : ''}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }}
        >
          {PAGES.map(({ id, Component }, i) => (
            <div key={id} className={`quick-page ${i === index ? 'active' : ''}`}>
              <Component go={go} onExpand={onExpand} />
            </div>
          ))}
        </div>
      </div>

      <div className="quick-footer">
        <span className="footer-title">{PAGES[index].title}</span>

        <div className="nav">
          <button
            className="icon-btn"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Página anterior"
          >
            ‹
          </button>

          <div className="dots">
            {PAGES.map(({ id }, i) => (
              <button
                key={id}
                className={`dot ${i === index ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Ir para página ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="icon-btn"
            onClick={() => goTo(index + 1)}
            disabled={index === PAGES.length - 1}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>

        <button className="open-all" onClick={onExpand}>
          Abrir tudo
          <svg viewBox="0 0 24 24">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default QuickPanel