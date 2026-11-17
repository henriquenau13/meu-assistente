import { useState } from 'react'

function OrganizePage() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Estudar React', done: false },
    { id: 2, text: 'Revisar o projeto', done: false },
    { id: 3, text: 'Responder mensagens', done: true },
  ])

  const toggle = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <div className="organize">
      <div className="card" style={{ '--i': 0 }}>
        <small>Tarefas pendentes</small>
        {tasks.map((t) => (
          <button
            key={t.id}
            className={`task ${t.done ? 'done' : ''}`}
            onClick={() => toggle(t.id)}
          >
            <span className="task-check"></span>
            {t.text}
          </button>
        ))}
      </div>

      <div className="stack">
        <div className="card timer-card" style={{ '--i': 1 }}>
          <div>
            <small>Temporizador</small>
            <strong>25:00</strong>
          </div>
          <button className="small-btn">Iniciar</button>
        </div>

        <div className="row-2">
          <div className="card" style={{ '--i': 2 }}>
            <small>Lembrete</small>
            <strong>16:00</strong>
          </div>
          <button className="card link-card" style={{ '--i': 3 }}>
            <small>Acesso rápido</small>
            <strong>Agenda ›</strong>
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrganizePage