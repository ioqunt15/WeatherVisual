import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DisasterPoint, DisasterScenario } from '../src/data/scenarios'
import { scenarios } from '../src/data/scenarios'

type KmaFrame = {
  id: string
  label: string
  updatedAt: string
  source: string
  points: DisasterPoint[]
  gridPoints?: DisasterPoint[]
  successfulPoints?: number
}

type WeatherTimeline = {
  scenarioId: DisasterScenario['id']
  frames: KmaFrame[]
  cacheHit: boolean
  successfulPoints: number
  updatedAt: string
}

type CacheEntry = {
  expiresAt: number
  promise?: Promise<WeatherTimeline>
  payload?: WeatherTimeline
}

type TimelineOptions = {
  start?: string
  end?: string
}

const cache = new Map<string, CacheEntry>()
const REQUEST_TIMEOUT_MS = 8000

// Helper to calculate Wildfire Risk Index
function calculateWildfireRisk(temp: number, humidity: number, windSpeed: number): number {
  // Fire Risk = (Temperature * 1.5) - Humidity + (Wind Speed * 0.5) + 30
  // Scale between 0 and 80
  const risk = (temp * 1.5) - humidity + (windSpeed * 0.5) + 30
  return Math.min(80, Math.max(0, Math.round(risk * 10) / 10))
}

// Convert Open-Meteo timestamp to readable format "YYYY-MM-DD HH:MM"
function formatTimeLabel(isoString: string) {
  return isoString.replace('T', ' ')
}

async function fetchOpenMeteo(scenarioId: string, options: TimelineOptions = {}): Promise<WeatherTimeline> {
  const scenario = scenarios.find((s) => s.id === scenarioId)
  if (!scenario) {
    throw new Error('Unsupported weather scenario')
  }

  const targets = scenario.points
  const lats = targets.map((t) => t.lat).join(',')
  const lons = targets.map((t) => t.lon).join(',')

  const isAqi = scenarioId === 'aqi'
  const url = isAqi
    ? `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=us_aqi&hourly=us_aqi&past_days=2&timezone=Asia%2FHo_Chi_Minh`
    : `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index&wind_speed_unit=ms&past_days=2&timezone=Asia%2FHo_Chi_Minh`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed: ${response.status}`)
    }

    const data = await response.json()
    const responses = Array.isArray(data) ? data : [data]

    if (responses.length === 0 || !responses[0].current) {
      throw new Error('No weather data returned from Open-Meteo')
    }

    const firstRes = responses[0]
    const currentTime = firstRes.current.time
    const currentHourlyIndex = firstRes.hourly.time.indexOf(currentTime)
    const baseIndex = currentHourlyIndex >= 0 ? currentHourlyIndex : 48

    const frames: KmaFrame[] = []

    if (scenarioId === 'rain' && (options.start || options.end)) {
      const rangeStart = options.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      const rangeEnd = options.end || new Date().toISOString().slice(0, 16)

      const startIndex = firstRes.hourly.time.findIndex((t: string) => t >= rangeStart)
      const endIndex = firstRes.hourly.time.findIndex((t: string) => t >= rangeEnd)

      const startIdx = startIndex >= 0 ? startIndex : Math.max(0, baseIndex - 24)
      const endIdx = endIndex >= 0 ? endIndex : baseIndex

      const durationHours = Math.round(((new Date(rangeEnd).getTime() - new Date(rangeStart).getTime()) / 3600000) * 10) / 10

      const points = targets.map((point, idx) => {
        const res = responses[idx]
        let rainSum = 0
        if (res && res.hourly) {
          for (let i = startIdx; i <= endIdx; i++) {
            rainSum += res.hourly.precipitation[i] || 0
          }
        }
        return {
          ...point,
          value: Math.round(rainSum * 10) / 10,
        }
      })

      frames.push({
        id: `rain-range-${rangeStart}-${rangeEnd}`,
        label: `${durationHours}시간 누적`,
        updatedAt: `${rangeStart.replace('T', ' ')} ~ ${rangeEnd.replace('T', ' ')}`,
        source: 'Open-Meteo 누적 분석',
        points,
        successfulPoints: points.length,
      })
    } else {
      const nowPoints = targets.map((point, idx) => {
        const res = responses[idx]
        let val = 0
        if (res && res.current) {
          if (scenarioId === 'humidity') val = res.current.relative_humidity_2m
          else if (scenarioId === 'wind') val = res.current.wind_speed_10m
          else if (scenarioId === 'uv') val = res.current.uv_index
          else if (scenarioId === 'aqi') val = res.current.us_aqi
          else if (scenarioId === 'temperature') val = res.current.temperature_2m
          else if (scenarioId === 'rain') val = res.current.precipitation
          else if (scenarioId === 'heat') val = res.current.apparent_temperature
          else if (scenarioId === 'wildfire') {
            val = calculateWildfireRisk(
              res.current.temperature_2m,
              res.current.relative_humidity_2m,
              res.current.wind_speed_10m
            )
          }
        }
        return {
          ...point,
          value: Math.round(val * 10) / 10,
        }
      })

      frames.push({
        id: `now-${currentTime}`,
        label: `실황 ${currentTime.slice(11)}`,
        updatedAt: formatTimeLabel(currentTime),
        source: isAqi ? 'Open-Meteo 대기질 실황' : 'Open-Meteo 실황',
        points: nowPoints,
        successfulPoints: nowPoints.length,
      })

      for (let offset = 1; offset <= 6; offset++) {
        const forecastIndex = baseIndex + offset
        if (forecastIndex >= firstRes.hourly.time.length) break

        const forecastTime = firstRes.hourly.time[forecastIndex]
        const forecastPoints = targets.map((point, idx) => {
          const res = responses[idx]
          let val = 0
          if (res && res.hourly) {
            if (scenarioId === 'humidity') val = res.hourly.relative_humidity_2m[forecastIndex]
            else if (scenarioId === 'wind') val = res.hourly.wind_speed_10m[forecastIndex]
            else if (scenarioId === 'uv') val = res.hourly.uv_index[forecastIndex]
            else if (scenarioId === 'aqi') val = res.hourly.us_aqi[forecastIndex]
            else if (scenarioId === 'temperature') val = res.hourly.temperature_2m[forecastIndex]
            else if (scenarioId === 'rain') val = res.hourly.precipitation[forecastIndex]
            else if (scenarioId === 'heat') val = res.hourly.apparent_temperature[forecastIndex]
            else if (scenarioId === 'wildfire') {
              val = calculateWildfireRisk(
                res.hourly.temperature_2m[forecastIndex],
                res.hourly.relative_humidity_2m[forecastIndex],
                res.hourly.wind_speed_10m[forecastIndex]
              )
            }
          }
          return {
            ...point,
            value: Math.round(val * 10) / 10,
          }
        })

        frames.push({
          id: `fcst-${forecastTime}`,
          label: `예보 ${forecastTime.slice(11)}`,
          updatedAt: formatTimeLabel(forecastTime),
          source: isAqi ? 'Open-Meteo 대기질 예보' : 'Open-Meteo 예보',
          points: forecastPoints,
          successfulPoints: forecastPoints.length,
        })
      }
    }

    return {
      scenarioId: scenario.id,
      frames,
      cacheHit: false,
      successfulPoints: targets.length,
      updatedAt: new Date().toISOString(),
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function getTimeline(scenarioId: string, forceRefresh = false, options: TimelineOptions = {}) {
  const cacheKey = `${scenarioId}:${options.start || ''}:${options.end || ''}`
  const now = Date.now()
  const cached = cache.get(cacheKey)

  if (!forceRefresh && cached?.payload && cached.expiresAt > now) {
    return { ...cached.payload, cacheHit: true }
  }

  if (!forceRefresh && cached?.promise && cached.expiresAt > now) {
    return { ...(await cached.promise), cacheHit: true }
  }

  // Set cache expiry to 1 hour
  const expiresAt = now + 60 * 60 * 1000
  const promise = fetchOpenMeteo(scenarioId, options)
  cache.set(cacheKey, { promise, expiresAt })

  try {
    const payload = await promise
    cache.set(cacheKey, { payload, expiresAt })
    return payload
  } catch (error) {
    cache.delete(cacheKey)
    throw error
  }
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

export function createKmaCacheMiddleware(_serviceKey?: string) {
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = request.url ?? ''

    if (!url.startsWith('/api/weather/')) {
      next()
      return
    }

    const parsedUrl = new URL(url, 'http://localhost')
    const scenarioId = decodeURIComponent(parsedUrl.pathname.replace('/api/weather/', ''))
    const forceRefresh = parsedUrl.searchParams.get('refresh') === '1'
    const options = {
      start: parsedUrl.searchParams.get('start') ?? undefined,
      end: parsedUrl.searchParams.get('end') ?? undefined,
    }

    try {
      const payload = await getTimeline(scenarioId, forceRefresh, options)
      sendJson(response, 200, payload)
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : 'Weather API failed' })
    }
  }
}

export async function warmKmaCache(_serviceKey?: string) {
  await Promise.all(
    scenarios.map((scenario) => getTimeline(scenario.id).catch(() => undefined))
  )
}

export function scheduleKmaCacheWarmup(_serviceKey?: string) {
  let timer: NodeJS.Timeout | undefined

  const run = () => {
    warmKmaCache().finally(() => {
      // Refresh cache every 10 minutes
      timer = setTimeout(run, 10 * 60 * 1000)
    })
  }

  run()

  return () => {
    if (timer) {
      clearTimeout(timer)
    }
  }
}
