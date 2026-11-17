import { useEffect, useState } from 'react'

const USER_NAME = 'Henrique' // ← coloque seu nome aqui (opcional)

function getGreeting(hour) {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function QuickHeader() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const date = now
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()

  const greeting = getGreeting(now.getHours()) + (USER_NAME ? `, ${USER_NAME}` : '')

  return (
    <div className="quick-header">
      <div>
        <div className="hello">
          {greeting} <span className="wave">👋</span>
        </div>
        <div className="hello-sub">O que vamos fazer hoje?</div>
      </div>

      <div className="header-right">
        <span className="online">● ONLINE</span>
        <span className="header-date">{date}</span>
      </div>
    </div>
  )
}

export default QuickHeader