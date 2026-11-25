import { useEffect, useState } from 'react'

// Cidade: Joinville (para trocar, mude o nome e as coordenadas)
export const CITY = {
  name: 'Joinville',
  latitude: -26.3044,
  longitude: -48.8487,
  timezone: 'America/Sao_Paulo',
}

const REFRESH = 15 * 60 * 1000 // 15 minutos

const URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${CITY.latitude}&longitude=${CITY.longitude}` +
  '&current=temperature_2m,weather_code,is_day' +
  '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  `&timezone=${encodeURIComponent(CITY.timezone)}&forecast_days=1`

// Traduz o código do tempo (padrão WMO) para um tipo de ícone e um texto
export function describeWeather(code, isDay) {
  if (code === 0) return { kind: isDay ? 'clear' : 'night', text: 'Céu limpo' }
  if (code <= 2) return { kind: isDay ? 'partly' : 'cloud', text: 'Parcialmente nublado' }
  if (code === 3) return { kind: 'cloud', text: 'Nublado' }
  if (code <= 48) return { kind: 'fog', text: 'Neblina' }
  if (code <= 57) return { kind: 'rain', text: 'Garoa' }
  if (code <= 67) return { kind: 'rain', text: 'Chuva' }
  if (code <= 77) return { kind: 'snow', text: 'Neve' }
  if (code <= 82) return { kind: 'rain', text: 'Pancadas de chuva' }
  return { kind: 'storm', text: 'Tempestade' }
}

export function useWeather() {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(URL)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        const info = describeWeather(data.current.weather_code, data.current.is_day === 1)

        setWeather({
          temp: Math.round(data.current.temperature_2m),
          max: Math.round(data.daily.temperature_2m_max[0]),
          min: Math.round(data.daily.temperature_2m_min[0]),
          rain: data.daily.precipitation_probability_max[0],
          kind: info.kind,
          text: info.text,
        })
      } catch {
        // sem internet: mantém o último valor (ou nada)
      }
    }

    load()
    const timer = setInterval(load, REFRESH)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return weather
}