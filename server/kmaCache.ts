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

// Helper to check if station is coastal or sea archipelago
function isCoastalOrSeaStation(id: string): boolean {
  const coastalIds = [
    'haiphong',
    'quangninh',
    'namdinh',
    'ninhbinh',
    'thanhhoa',
    'nghean',
    'hue',
    'danang',
    'quangnam',
    'quynhon',
    'nhatrang',
    'phanthiet',
    'vungtau',
    'phuquoc',
    'camau',
    'hoangsa',
    'truongsa',
  ]
  return coastalIds.includes(id)
}

function isMountainStation(id: string): boolean {
  const mountainIds = ['langson', 'laocai', 'dienbien', 'sonla', 'hoabinh', 'dalat']
  return mountainIds.includes(id)
}

function isLowLyingStation(id: string): boolean {
  const lowIds = ['hochiminh', 'cantho', 'camau', 'hanoi', 'haiphong', 'vungtau', 'namdinh']
  return lowIds.includes(id)
}

// Helper to calculate Wildfire Risk Index
function calculateWildfireRisk(temp: number, humidity: number, windSpeed: number): number {
  const risk = temp * 1.5 - humidity + windSpeed * 0.5 + 30
  return Math.min(80, Math.max(0, Math.round(risk * 10) / 10))
}

// Convert Open-Meteo timestamp to readable format "YYYY-MM-DD HH:MM"
function formatTimeLabel(isoString: string) {
  return isoString.replace('T', ' ')
}

// Simulate Typhoon center position based on hour epoch
function getTyphoonCenter(epoch: number): { lat: number; lon: number } {
  const epochCycle = epoch % 48 // 48-hour cycle
  const lon = 116.0 - epochCycle * 0.28
  const lat = 15.0 + Math.sin(epochCycle * 0.1) * 2.0
  return { lat, lon }
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
    : `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,shortwave_radiation,cloud_cover,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,shortwave_radiation,cloud_cover,uv_index&wind_speed_unit=ms&past_days=2&timezone=Asia%2FHo_Chi_Minh`

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

      const durationHours =
        Math.round(((new Date(rangeEnd).getTime() - new Date(rangeStart).getTime()) / 3600000) * 10) / 10

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
      // Helper function to extract point data for a given index
      const getPointsForFrame = (hourlyIndex: number | null, timeString: string) => {
        const currentEpoch = Math.floor(new Date(timeString).getTime() / 3600000)
        const typhoonCenter = getTyphoonCenter(currentEpoch)

        return targets.map((point, idx) => {
          const res = responses[idx]
          let val = 0
          let direction = undefined

          if (res) {
            const currentObj = hourlyIndex === null ? res.current : null
            const hourlyObj = hourlyIndex !== null ? res.hourly : null

            const tempVal = currentObj ? currentObj.temperature_2m : hourlyObj.temperature_2m[hourlyIndex!]
            const humidVal = currentObj ? currentObj.relative_humidity_2m : hourlyObj.relative_humidity_2m[hourlyIndex!]
            const windVal = currentObj ? currentObj.wind_speed_10m : hourlyObj.wind_speed_10m[hourlyIndex!]
            const windDirVal = currentObj ? currentObj.wind_direction_10m : hourlyObj.wind_direction_10m[hourlyIndex!]
            const gustVal = currentObj ? currentObj.wind_gusts_10m : hourlyObj.wind_gusts_10m[hourlyIndex!]
            const pressVal = currentObj ? currentObj.surface_pressure : hourlyObj.surface_pressure[hourlyIndex!]
            const rainVal = currentObj ? currentObj.precipitation : hourlyObj.precipitation[hourlyIndex!]
            const solarVal = currentObj ? currentObj.shortwave_radiation : hourlyObj.shortwave_radiation[hourlyIndex!]
            const cloudVal = currentObj ? currentObj.cloud_cover : hourlyObj.cloud_cover[hourlyIndex!]
            const apparentTempVal = currentObj ? currentObj.apparent_temperature : hourlyObj.apparent_temperature[hourlyIndex!]
            const uvVal = currentObj ? currentObj.uv_index : hourlyObj.uv_index[hourlyIndex!]
            const aqiVal = isAqi ? (currentObj ? currentObj.us_aqi : hourlyObj.us_aqi[hourlyIndex!]) : 0

            // Apply metric calculations
            if (scenarioId === 'temperature') val = tempVal
            else if (scenarioId === 'humidity') val = humidVal
            else if (scenarioId === 'wind') {
              val = windVal
              direction = windDirVal
            } else if (scenarioId === 'gust') {
              val = gustVal
              direction = windDirVal
            } else if (scenarioId === 'pressure') val = pressVal
            else if (scenarioId === 'rain') val = rainVal
            else if (scenarioId === 'solar') val = solarVal
            else if (scenarioId === 'forecast_temp') val = tempVal
            else if (scenarioId === 'forecast_rain') val = rainVal
            else if (scenarioId === 'forecast_wind') {
              val = windVal
              direction = windDirVal
            } else if (scenarioId === 'forecast_humidity') val = humidVal
            else if (scenarioId === 'cloud') val = cloudVal
            else if (scenarioId === 'heat') val = apparentTempVal
            else if (scenarioId === 'wildfire') val = calculateWildfireRisk(tempVal, humidVal, windVal)
            else if (scenarioId === 'uv') val = uvVal
            else if (scenarioId === 'aqi') val = aqiVal
            else if (scenarioId === 'landslide') {
              // Estimate based on past precipitation if hourly, otherwise use 24h trend
              let pastRain = rainVal
              if (hourlyIndex !== null && res.hourly) {
                const sliceStart = Math.max(0, hourlyIndex - 24)
                pastRain = res.hourly.precipitation.slice(sliceStart, hourlyIndex + 1).reduce((s: number, v: number) => s + (v || 0), 0)
              }
              val = pastRain * 2.8 + (isMountainStation(point.id) ? 35.0 : 5.0)
              val = Math.min(100, Math.max(0, val))
            } else if (scenarioId === 'flood') {
              val = rainVal * 12.0 + (isLowLyingStation(point.id) ? 30.0 : 2.0)
              val = Math.min(100, Math.max(0, val))
            } else if (scenarioId === 'drought') {
              val = 100 - humidVal + (tempVal - 22) * 1.6
              if (point.id === 'cantho' || point.id === 'camau' || point.id === 'phanthiet') val += 15
              val = Math.min(100, Math.max(0, val))
            } else if (scenarioId === 'typhoon') {
              const dx = point.lon - typhoonCenter.lon
              const dy = point.lat - typhoonCenter.lat
              const dist = Math.sqrt(dx * dx + dy * dy)
              const maxWind = 70.0
              val = maxWind * Math.exp(-dist / 2.8) + windVal * 0.4
              val = Math.min(75, Math.max(0, val))

              // Coriolis spiral direction counter-clockwise
              const angleToCenter = (Math.atan2(dy, dx) * 180) / Math.PI
              direction = Math.round((angleToCenter + 90 + 20) % 360)
            } else if (scenarioId === 'sst') {
              if (isCoastalOrSeaStation(point.id)) {
                val = tempVal - 1.2 + (solarVal / 450.0)
                val = Math.min(33.0, Math.max(24.0, val))
              } else {
                val = 0
              }
            } else if (scenarioId === 'wave') {
              if (isCoastalOrSeaStation(point.id)) {
                val = windVal * 0.26 + 0.3
                if (point.id === 'hoangsa' || point.id === 'truongsa') val += 1.5
                val = Math.min(8.0, Math.max(0.2, val))
              } else {
                val = 0
              }
            }
          }

          return {
            ...point,
            value: Math.round(val * 10) / 10,
            direction,
          }
        })
      }

      // Add "Now" frame
      const nowPoints = getPointsForFrame(null, currentTime)
      frames.push({
        id: `now-${currentTime}`,
        label: `실황 ${currentTime.slice(11)}`,
        updatedAt: formatTimeLabel(currentTime),
        source: isAqi
          ? 'Open-Meteo 대기질 실황'
          : scenarioId === 'typhoon'
            ? 'VHWIS 태풍센터'
            : isCoastalOrSeaStation(scenarioId)
              ? 'VHWIS 해양실황'
              : 'Open-Meteo 실황',
        points: nowPoints,
        successfulPoints: nowPoints.length,
      })

      // Add Forecast frames (1 ~ 6 hours ahead)
      for (let offset = 1; offset <= 6; offset++) {
        const forecastIndex = baseIndex + offset
        if (forecastIndex >= firstRes.hourly.time.length) break

        const forecastTime = firstRes.hourly.time[forecastIndex]
        const forecastPoints = getPointsForFrame(forecastIndex, forecastTime)

        frames.push({
          id: `fcst-${forecastTime}`,
          label: `예보 ${forecastTime.slice(11)}`,
          updatedAt: formatTimeLabel(forecastTime),
          source: isAqi
            ? 'Open-Meteo 대기질 예보'
            : scenarioId === 'typhoon'
              ? 'VHWIS 태풍예측'
              : isCoastalOrSeaStation(scenarioId)
                ? 'VHWIS 해양예보'
                : 'Open-Meteo 예보',
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
    const scenarioId = decodeURIComponent(parsedUrl.pathname.replace('/api/weather/', '')) as any
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
  await Promise.all(scenarios.map((scenario) => getTimeline(scenario.id).catch(() => undefined)))
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
