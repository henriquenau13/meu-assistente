import { useState } from 'react'
import Icon from '../Icon'
import ToggleTile from './ToggleTile'

function ScreenWidget() {
  const [brightness, setBrightness] = useState(70)
  const [dark, setDark] = useState(true)
  const [night, setNight] = useState(false)
  const [auto, setAuto] = useState(false)

  return (
    <div className="screen">
      <div className="w-card slider-card" style={{ '--i': 0 }}>
        <Icon name="sun" />
        <input
          type="range"
          className="slider"
          min="0"
          max="100"
          value={brightness}
          style={{ '--val': `${brightness}%` }}
          onChange={(e) => setBrightness(Number(e.target.value))}
          aria-label="Brilho"
        />
        <span className="slider-value">{brightness}%</span>
      </div>

      <div className="wgrid cols-3">
        <ToggleTile
          index={1}
          icon="theme"
          label="Tema"
          status={dark ? 'Escuro' : 'Claro'}
          on={dark}
          onClick={() => setDark(!dark)}
        />
        <ToggleTile
          index={2}
          icon="moon"
          label="Luz noturna"
          status={night ? 'Ligada' : 'Desligada'}
          on={night}
          onClick={() => setNight(!night)}
        />
        <ToggleTile
          index={3}
          icon="sun"
          label="Auto-brilho"
          status={auto ? 'Ligado' : 'Desligado'}
          on={auto}
          onClick={() => setAuto(!auto)}
        />
      </div>
    </div>
  )
}

export default ScreenWidget