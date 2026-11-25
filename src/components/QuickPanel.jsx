import { useState } from 'react'
import Icon from './Icon'
import ClockWeather from './ClockWeather'
import { WIDGETS } from './widgets'
import './QuickPanel.css'

// widget = id do widget aberto (ou null)
// onSelect = pede para abrir/fechar um widget
function QuickPanel({ widget, onSelect, onExpand }) {
  // Guarda o último widget aberto, para ele continuar visível enquanto fecha
  const [shown, setShown] = useState(widget)
  if (widget && widget !== shown) setShown(widget)

  const current = WIDGETS.find((w) => w.id === shown)
  const isOpen = widget !== null

  return (
    <div className="quick">
      {/* "compact" esconde os nomes quando há um widget aberto */}
      <div className={`tabbar ${isOpen ? 'compact' : ''}`}>
        <ClockWeather />

        <div className="tabs">
          {WIDGETS.map(({ id, title, icon }) => (
            <button
              key={id}
              className={`tab-item ${id === widget ? 'active' : ''}`}
              onClick={() => onSelect(id === widget ? null : id)}
              aria-label={title}
              title={isOpen ? title : undefined}
            >
              <span className="tab-ico">
                <Icon name={icon} />
              </span>
              <span className="tab-label">{title}</span>
            </button>
          ))}
        </div>

        <div className="tabbar-right">
          <button
            className={`tab round close ${isOpen ? 'show' : ''}`}
            onClick={() => onSelect(null)}
            tabIndex={isOpen ? 0 : -1}
            aria-label="Fechar"
            title="Fechar"
          >
            <Icon name="close" />
          </button>

          <button
            className="tab round"
            onClick={onExpand}
            aria-label="Abrir tudo"
            title="Abrir tudo"
          >
            <Icon name="expand" />
          </button>
        </div>
      </div>

      {current && (
        <div
          className={`widget-area ${isOpen ? 'open' : ''}`}
          style={{ height: current.height }}
        >
          <div className="widget" key={shown}>
            <current.Component />
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickPanel