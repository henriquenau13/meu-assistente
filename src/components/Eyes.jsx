import { useEffect, useRef, useState } from 'react'
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
  const [look, setLook] = useState(CENTER)
  const [moving, setMoving] = useState(false)
  const [blinking, setBlinking] = useState(false)

  // ===== PISCADAS (aleatórias, só quando o humor é neutro) =====
  useEffect(() => {
    if (mood !== 'neutral') {
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
  }, [mood])

  // ===== OLHAR EM VOLTA =====
  const lastRef = useRef(CENTER)

  useEffect(() => {
    if (!active) {
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
        // volta para o meio
        moveTo(CENTER)
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
  }, [active])

  return (
    <div className="face">
      <div
        className={`eyes ${blinking ? 'is-blinking' : ''}`}
        style={{
          '--look-x': `${look.x}px`,
          '--look-y': `${look.y}px`,
          '--tilt': `${look.tilt}deg`,
          '--sx': moving ? 1.12 : 1,
          '--sy': moving ? 0.9 : 1,
        }}
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