import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { useMedia } from '../useMedia'

// 84 -> "1:24"
const fmt = (sec) => {
  const t = Math.max(0, Math.floor(sec))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

const ellipsis = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

function MusicWidget() {
  const media = useMedia()
  const api = window.assistantMedia
  const volApi = window.assistantVolume

  // ===== VOLUME (só do Spotify) =====
  const [volume, setVolume] = useState(65)
  const [muted, setMuted] = useState(false)
  const [found, setFound] = useState(false) // o Spotify já apareceu no mixer?
  const ignoreUntil = useRef(0) // enquanto você mexe, ignora o que o Windows manda
  const lastSent = useRef(0)

  useEffect(() => {
    if (!volApi) return
    let alive = true

    const apply = (s) => {
      if (!s) return
      setFound(s.found !== false)
      if (s.found === false || s.volume === undefined) return
      if (Date.now() < ignoreUntil.current) return
      setVolume(s.volume)
      setMuted(!!s.muted)
    }

    volApi.getState().then((s) => alive && apply(s))
    const stop = volApi.onUpdate(apply)

    return () => {
      alive = false
      stop()
    }
  }, [volApi])

  const level = muted ? 0 : volume

  const changeVolume = (value) => {
    ignoreUntil.current = Date.now() + 1500
    setVolume(value)

    if (muted) {
      setMuted(false)
      volApi?.mute(false)
    }

    // manda ao Windows no máximo ~16 vezes por segundo
    const now = Date.now()
    if (now - lastSent.current > 60) {
      lastSent.current = now
      volApi?.set(value)
    }
  }

  // ao soltar o slider, garante o valor final
  const commitVolume = () => {
    ignoreUntil.current = Date.now() + 1500
    volApi?.set(volume)
  }

  const toggleMute = () => {
    ignoreUntil.current = Date.now() + 1500
    setMuted(!muted)
    volApi?.mute(!muted)
  }

  // ===== PROGRESSO DA MÚSICA =====
  const [seekTo, setSeekTo] = useState(null) // posição que você está arrastando

  // relógio para a barra andar suave entre as atualizações
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!media?.playing) return
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [media?.playing])

  const playing = media?.playing ?? false
  const duration = media?.duration ?? 0

  let position = media?.position ?? 0
  if (media?.playing) position += Math.max(0, now - media.at) / 1000
  if (duration > 0) position = Math.min(position, duration)

  const shownPosition = seekTo !== null ? seekTo : position
  const percent = duration > 0 ? (shownPosition / duration) * 100 : 0

  const commitSeek = () => {
    if (seekTo === null) return
    api?.command(`seek ${Math.round(seekTo)}`)
    setTimeout(() => setSeekTo(null), 1300)
  }

  // sem música: o botão principal abre o Spotify
  const onMain = () => (media ? api?.command('toggle') : api?.openSpotify())

  const coverStyle = media?.thumb
    ? {
        backgroundImage: `url(${media.thumb})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { opacity: media ? 1 : 0.35 }

  return (
    <div className="music">
      <div className="music-top">
        <div className="cover" style={coverStyle}></div>

        <div className="music-info">
          <div className="music-title" style={ellipsis}>
            {media ? media.title || 'Sem título' : 'Nada tocando'}
          </div>
          <div className="music-artist" style={ellipsis}>
            {media ? media.artist || media.app : 'Abra o Spotify e dê play'}
          </div>

          <div className="progress">
            <input
              type="range"
              className="slider seek"
              min="0"
              max={duration > 0 ? duration : 1}
              step="1"
              value={duration > 0 ? shownPosition : 0}
              disabled={!media || duration <= 0}
              style={{ '--val': `${percent}%` }}
              onChange={(e) => setSeekTo(Number(e.target.value))}
              onPointerUp={commitSeek}
              onKeyUp={commitSeek}
              aria-label="Posição da música"
            />
            <div className="times">
              <span>{media ? fmt(shownPosition) : '--:--'}</span>
              <span>{duration > 0 ? fmt(duration) : '--:--'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="music-bottom">
        <div
          className="volume"
          style={{ opacity: found ? 1 : 0.4, transition: 'opacity 0.3s' }}
          title={found ? 'Volume do Spotify' : 'Dê play no Spotify para controlar o volume'}
        >
          <button
            className="ctrl small"
            onClick={toggleMute}
            disabled={!found}
            aria-label="Silenciar"
          >
            <Icon name={level === 0 ? 'volume-off' : 'volume'} />
          </button>
          <input
            type="range"
            className="slider"
            min="0"
            max="100"
            value={level}
            disabled={!found}
            style={{ '--val': `${level}%` }}
            onChange={(e) => changeVolume(Number(e.target.value))}
            onPointerUp={commitVolume}
            onKeyUp={commitVolume}
            aria-label="Volume do Spotify"
          />
        </div>

        <div className="controls">
          <button
            className="ctrl"
            onClick={() => api?.command('previous')}
            disabled={!media || !media.canPrev}
            style={{ opacity: media?.canPrev ? 1 : 0.35 }}
            aria-label="Anterior"
          >
            <svg className="solid" viewBox="0 0 24 24"><path d="M6 6h2v12H6zM20 6v12L9.5 12z" /></svg>
          </button>

          <button
            className="ctrl main"
            onClick={onMain}
            aria-label={playing ? 'Pausar' : 'Reproduzir'}
          >
            {playing ? (
              <svg className="solid" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg className="solid" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button
            className="ctrl"
            onClick={() => api?.command('next')}
            disabled={!media || !media.canNext}
            style={{ opacity: media?.canNext ? 1 : 0.35 }}
            aria-label="Próxima"
          >
            <svg className="solid" viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM4 6v12l10.5-6z" /></svg>
          </button>
        </div>

        <button className="chip-btn" onClick={() => api?.openSpotify()}>
          <Icon name="headphones" />
          Spotify
          <Icon name="chevron" />
        </button>
      </div>
    </div>
  )
}

export default MusicWidget