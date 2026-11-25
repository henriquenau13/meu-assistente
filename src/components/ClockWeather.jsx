import { useEffect, useState } from 'react'
import { CITY, useWeather } from './useWeather'

const WEATHER_ICONS = {
  clear: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </>
  ),
  night: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  partly: (
    <>
      <circle cx="8" cy="8" r="2.8" />
      <path d="M8 2.5v1M2.5 8h1M4 4l.7.7M12 4l-.7.7" />
      <path d="M8.5 20a3.5 3.5 0 01-.3-7A5 5 0 0118 13.5a3.25 3.25 0 01-.5 6.5z" />
    </>
  ),
  cloud: <path d="M7 19a4 4 0 01-.4-7.98A5.5 5.5 0 0117 11a4 4 0 010 8z" />,
  fog: <path d="M4 9h16M6 13h12M4 17h16" />,
  rain: (
    <>
      <path d="M7 15a4 4 0 01-.4-7.98A5.5 5.5 0 0117 7a4 4 0 010 8z" />
      <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
    </>
  ),
  storm: (
    <>
      <path d="M7 15a4 4 0 01-.4-7.98A5.5 5.5 0 0117 7a4 4 0 010 8z" />
      <path d="M12.5 15l-2 3h3l-2 3" />
    </>
  ),
  snow: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    </>
  ),
}

function ClockWeather() {
  const [now, setNow] = useState(new Date())
  const weather = useWeather()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(timer)
  }, [])

  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  // dica que aparece ao passar o mouse
  const tip = weather
    ? `${CITY.name} · ${weather.text}\nMín ${weather.min}° · Máx ${weather.max}° · Chuva ${weather.rain}%`
    : CITY.name

  return (
    <div className="cw" title={tip}>
      <span className="cw-time">{time}</span>

      {weather && (
        <>
          <span className="cw-sep"></span>
          <span className="cw-weather">
            <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
              {WEATHER_ICONS[weather.kind]}
            </svg>
            {weather.temp}°
          </span>
        </>
      )}
    </div>
  )
}

export default ClockWeather