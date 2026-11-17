import { useEffect, useState } from 'react'

const WEEK_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function TodayPage() {
  const [now, setNow] = useState(new Date())

  // Compromisso de exemplo: sempre daqui a 2h13min (provisório)
  const [event] = useState(() => new Date(Date.now() + 133 * 60000))

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const rawDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)

  // semana atual (começando no domingo)
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  // contagem regressiva do compromisso
  const diff = Math.max(0, Math.round((event - now) / 60000))
  const countdown =
    diff >= 60 ? `${Math.floor(diff / 60)}h ${diff % 60}min` : `${diff} min`
  const progress = Math.min(100, Math.max(0, 100 - (diff / 180) * 100))
  const eventTime = event.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="today">
      <div>
        <div className="today-time">{time}</div>
        <div className="today-date">{date}</div>

        <div className="week">
          {week.map((d, i) => (
            <div
              key={i}
              className={`day ${d.toDateString() === now.toDateString() ? 'is-today' : ''}`}
            >
              {WEEK_LABELS[i]}
              <b>{d.getDate()}</b>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="card hero" style={{ '--i': 0 }}>
          <small>Próximo compromisso</small>
          <div className="hero-title">Reunião de projeto</div>
          <div className="hero-meta">
            <span>{eventTime}</span>
            <b>em {countdown}</b>
          </div>
          <div className="hero-bar">
            <span style={{ width: `${progress}%` }}></span>
          </div>
        </div>

        <div className="chips">
          <div className="card chip" style={{ '--i': 1 }}>
            <i>✓</i>
            <span><b>3</b> tarefas</span>
          </div>
          <div className="card chip" style={{ '--i': 2 }}>
            <i className="pulse"></i>
            <span><b>2</b> novas</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodayPage