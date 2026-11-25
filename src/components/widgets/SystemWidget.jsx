const STATS = [
  { label: 'CPU', value: 23, detail: 'Uso atual' },
  { label: 'Memória', value: 58, detail: '9,3 de 16 GB' },
  { label: 'Disco', value: 41, detail: '212 GB livres' },
  { label: 'Bateria', value: 87, detail: 'Em uso' },
]

function SystemWidget() {
  return (
    <div className="wgrid cols-4">
      {STATS.map((s, i) => (
        <div key={s.label} className="w-card sys-card" style={{ '--i': i }}>
          <span className="w-label">{s.label}</span>
          <div className="sys-value">{s.value}%</div>
          <div className="sys-bar">
            <span style={{ width: `${s.value}%` }}></span>
          </div>
          <div className="sys-detail">{s.detail}</div>
        </div>
      ))}
    </div>
  )
}

export default SystemWidget