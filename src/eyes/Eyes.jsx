import { useEffect, useRef, useState } from 'react'
import { useEyes } from './eyesContext'
import { REACTION_NAMES } from './reactions'
import './Eyes.css'

const CENTER = { x: 0, y: 0, tilt: 0 }

// Lugares para onde ele pode olhar
const LOOKS = [
  { x: -11, y: 0, tilt: 0 },
  { x: 11, y: 0, tilt: 0 },
  { x: -9, y: -3, tilt: -5 },
  { x: 9, y: -3, tilt: 5 },
  { x: 0, y: -4, tilt: 0 },
  { x: -6, y: 2, tilt: 3 },
  { x: 6, y: 2, tilt: -3 },
]

const rand = (min, max) => min + Math.random() * (max - min)

function Eyes({ mood, active }) {
  const { reaction, react } = useEyes()

  const [look, setLook] = useState(CENTER)
  const [moving, setMoving] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const clicks = useRef(0)
  const lastRef = useRef(CENTER)

  // A reação só aparece com o assistente acordado
  const current = mood === 'neutral' ? reaction : null
  const busy = mood !== 'neutral' || reaction !== null

  // ===== PISCADAS (aleatórias, só no humor neutro e sem reação) =====
  useEffect(() => {
    if (busy) {
      setBlinking(false)
      return
    }

    const timers = []
    const later = (fn, ms) => timers.push(setTimeout(fn, ms))

    const blink = () => {
      setBlinking(true)
      later(() => setBlinking(false), 130)

      // 1 em cada 5: piscada dupla
      if (Math.random() < 0.2) {
        later(() => setBlinking(true), 290)
        later(() => setBlinking(false), 420)
      }

      later(blink, rand(2500, 6000))
    }

    later(blink, rand(1500, 3500))
    return () => timers.forEach(clearTimeout)
  }, [busy])

  // ===== OLHAR EM VOLTA (pausa durante reações) =====
  const roaming = active && !current

  useEffect(() => {
    if (!roaming) {
      setLook(CENTER)
      setMoving(false)
      lastRef.current = CENTER
      return
    }

    const timers = []
    const later = (fn, ms) => timers.push(setTimeout(fn, ms))

    // move os olhos (com tremidinha) e faz a "esticada"
    const moveTo = (target) => {
      lastRef.current = target
      setLook({
        x: target.x + rand(-1, 1),
        y: target.y + rand(-0.5, 0.5),
        tilt: target.tilt,
      })
      setMoving(true)
      later(() => setMoving(false), 140)
    }

    const pickNew = () => {
      let next
      do {
        next = LOOKS[Math.floor(Math.random() * LOOKS.length)]
      } while (next === lastRef.current)
      return next
    }

    const wander = () => {
      const atCenter = lastRef.current === CENTER
      const roll = Math.random()

      if (!atCenter && roll < 0.4) {
        moveTo(CENTER) // volta para o meio
      } else if (roll > 0.8) {
        // olhada dupla: um lado e, logo depois, o outro
        const first = pickNew()
        moveTo(first)
        later(
          () => moveTo({ x: -first.x, y: first.y, tilt: -first.tilt }),
          550
        )
      } else {
        moveTo(pickNew())
      }

      later(wander, rand(1600, 3800))
    }

    later(wander, 1500)
    return () => timers.forEach(clearTimeout)
  }, [roaming])

  // TESTE: cada clique nos olhos mostra a próxima expressão.
  // (Depois trocamos por reações de verdade, ligadas aos widgets.)
  const handleClick = () => {
    if (mood !== 'neutral') return
    react(REACTION_NAMES[clicks.current % REACTION_NAMES.length])
    clicks.current += 1
  }

  // Com reação ativa, o CSS cuida da posição. Sem reação, o JavaScript cuida.
  const style = current
    ? undefined
    : {
        '--look-x': `${look.x}px`,
        '--look-y': `${look.y}px`,
        '--tilt': `${look.tilt}deg`,
        '--sx': moving ? 1.12 : 1,
        '--sy': moving ? 0.9 : 1,
      }

  return (
    <div className="face" onClick={handleClick}>
      <div
        className={`eyes ${blinking ? 'is-blinking' : ''}`}
        data-reaction={current ?? undefined}
        style={style}
      >
        <span className="eye"></span>
        <span className="eye"></span>
      </div>

      {mood === 'sleeping' && (
        <div className="zzz">
          <span>Z</span>
          <span>Z</span>
          <span>Z</span>
        </div>
      )}
    </div>
  )
}

export default Eyes