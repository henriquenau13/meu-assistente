import { useState } from 'react'

function MusicPage() {
  const [playing, setPlaying] = useState(true)

  return (
    <div className="music">
      <div className="cover"></div>

      <div className="music-info">
        <div className="music-title">Nome da música</div>
        <div className="music-artist">Nome do artista</div>

        <div className="progress">
          <div className="bar"><span></span></div>
          <div className="times">
            <span>1:24</span>
            <span>3:42</span>
          </div>
        </div>

        <div className="controls">
          <button className="ctrl" aria-label="Anterior">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM20 6v12L9.5 12z" /></svg>
          </button>

          <button
            className="ctrl main"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pausar' : 'Reproduzir'}
          >
            {playing ? (
              <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button className="ctrl" aria-label="Próxima">
            <svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM4 6v12l10.5-6z" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MusicPage