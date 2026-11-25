import { useEffect, useState } from 'react'

export function useMedia() {
  const [media, setMedia] = useState(null)

  useEffect(() => {
    const api = window.assistantMedia
    if (!api) return // fora do Electron (navegador): fica sem música

    let alive = true

    // estado inicial, caso já tenha algo tocando
    api.getState().then((s) => {
      if (alive && s?.active) setMedia({ ...s, at: Date.now() })
    })

    // atualizações (chegam a cada segundo e quando a música muda)
    const stop = api.onUpdate((msg) => {
      if (!msg.active) {
        setMedia(null)
        return
      }
      setMedia((prev) => ({
        ...msg,
        // a capa só vem quando a música muda: mantém a anterior
        thumb: msg.thumb !== undefined ? msg.thumb : prev?.thumb ?? null,
        at: Date.now(),
      }))
    })

    return () => {
      alive = false
      stop()
    }
  }, [])

  return media
}