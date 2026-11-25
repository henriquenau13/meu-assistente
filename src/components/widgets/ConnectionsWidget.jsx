import { useState } from 'react'
import ToggleTile from './ToggleTile'

const ITEMS = [
  { id: 'wifi', icon: 'wifi', label: 'Wi-Fi', on: true },
  { id: 'bluetooth', icon: 'bluetooth', label: 'Bluetooth', on: true },
  { id: 'airplane', icon: 'plane', label: 'Modo avião', on: false },
  { id: 'cast', icon: 'cast', label: 'Projetar', on: false },
]

function ConnectionsWidget() {
  const [state, setState] = useState(
    Object.fromEntries(ITEMS.map((i) => [i.id, i.on]))
  )

  const toggle = (id) => setState((s) => ({ ...s, [id]: !s[id] }))

  return (
    <div className="wgrid cols-4">
      {ITEMS.map((item, i) => (
        <ToggleTile
          key={item.id}
          index={i}
          stacked
          icon={item.icon}
          label={item.label}
          status={state[item.id] ? 'Ligado' : 'Desligado'}
          on={state[item.id]}
          onClick={() => toggle(item.id)}
        />
      ))}
    </div>
  )
}

export default ConnectionsWidget