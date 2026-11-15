/** Weather from Open-Meteo (free, no key). Temperatures are fetched in °F and converted for display. */

export interface DayWeather { date: string; high: number; low: number; rain: number; code: number }
export interface Forecast { fetchedAt: number; lat: number; lon: number; current: number; currentCode: number; days: DayWeather[] }

const CACHE_KEY = 'capsule:weather'

export async function getForecast(lat: number, lon: number): Promise<Forecast | null> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as Forecast | null
    if (cached && cached.lat === lat && cached.lon === lon && Date.now() - cached.fetchedAt < 30 * 60 * 1000) return cached
  } catch { /* storage may be unavailable */ }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=16`
    const r = await fetch(url)
    if (!r.ok) throw new Error(String(r.status))
    const j = await r.json()
    const f: Forecast = {
      fetchedAt: Date.now(), lat, lon,
      current: Math.round(j.current.temperature_2m), currentCode: j.current.weather_code,
      days: j.daily.time.map((d: string, i: number) => ({
        date: d, high: Math.round(j.daily.temperature_2m_max[i]), low: Math.round(j.daily.temperature_2m_min[i]),
        rain: j.daily.precipitation_probability_max[i] ?? 0, code: j.daily.weather_code[i],
      })),
    }
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(f)) } catch { /* ignore */ }
    return f
  } catch {
    // Offline: fall back to the last forecast we had, even if stale.
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') } catch { return null }
  }
}

export interface Place { name: string; region: string; lat: number; lon: number }
export async function searchCity(q: string): Promise<Place[]> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`)
  if (!r.ok) return []
  const j = await r.json()
  return (j.results || []).map((p: { name: string; admin1?: string; country_code?: string; latitude: number; longitude: number }) => ({
    name: p.name, region: [p.admin1, p.country_code].filter(Boolean).join(', '), lat: p.latitude, lon: p.longitude,
  }))
}

export const isRainy = (d?: DayWeather) => !!d && (d.rain >= 50 || [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(d.code))
export const isSnowy = (d?: DayWeather) => !!d && [71, 73, 75, 77, 85, 86].includes(d.code)
export const condition = (code: number) =>
  code === 0 ? 'clear' : code <= 2 ? 'partly cloudy' : code === 3 ? 'cloudy' : code <= 48 ? 'fog' : code <= 67 || (code >= 80 && code <= 82) ? 'rain' : code <= 77 || code === 85 || code === 86 ? 'snow' : 'storms'

export const toUnit = (f: number, unit: 'F' | 'C') => (unit === 'F' ? f : Math.round(((f - 32) * 5) / 9))
export const deg = (f: number, unit: 'F' | 'C') => `${toUnit(f, unit)}°`
