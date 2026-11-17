const TILES = [
  { label: 'Hoje', icon: 'clock', to: 'today' },
  { label: 'Música', icon: 'music', to: 'music' },
  { label: 'Tarefas', icon: 'check', to: 'organize' },
  { label: 'Lembretes', icon: 'bell', to: 'organize' },
  { label: 'Timer', icon: 'timer', to: 'organize' },
]

const LINKS = ['Chat', 'Rotinas', 'Memória', 'Configurações']

const ICONS = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  check: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" />
      <path d="M10 21h4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M9 2h6" />
    </>
  ),
}

function HomePage({ go, onExpand }) {
  return (
    <div className="home">
      <div className="home-label">Acesso rápido</div>

      <div className="tiles">
        {TILES.map((t, i) => (
          <button
            key={t.label}
            className="tile"
            style={{ '--i': i }}
            onClick={() => go(t.to)}
          >
            <svg viewBox="0 0 24 24">{ICONS[t.icon]}</svg>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="home-links">
        {LINKS.map((l) => (
          <button key={l} onClick={onExpand}>{l}</button>
        ))}
      </div>
    </div>
  )
}

export default HomePage