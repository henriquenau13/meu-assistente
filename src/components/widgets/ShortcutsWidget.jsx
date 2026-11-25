import { useState } from 'react'
import Icon from '../Icon'

const ITEMS = [
  { id: 'capture', icon: 'capture', label: 'Capturar' },
  { id: 'calc', icon: 'calc', label: 'Calculadora' },
  { id: 'files', icon: 'folder', label: 'Arquivos' },
  { id: 'display', icon: 'monitor', label: 'Tela' },
  { id: 'dnd', icon: 'bell-off', label: 'Não perturbe' },
  { id: 'lock', icon: 'lock', label: 'Bloquear' },
]

function ShortcutsWidget() {
  const [flash, setFlash] = useState(null)

  // Por enquanto só dá um "brilho" ao clicar. Na Etapa 2 vai executar de verdade.
  const press = (id) => {
    setFlash(id)
    setTimeout(() => setFlash(null), 450)
  }

  return (
    <div className="wgrid cols-6">
      {ITEMS.map((item, i) => (
        <button
          key={item.id}
          className={`w-card shortcut ${flash === item.id ? 'flash' : ''}`}
          style={{ '--i': i }}
          onClick={() => press(item.id)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ShortcutsWidget