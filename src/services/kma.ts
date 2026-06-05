import type { DisasterPoint, DisasterScenario } from '../data/scenarios'

export type VhwisFrame = {
  id: string
  label: string
  updatedAt: string
  source: string
  points: DisasterPoint[]
  gridPoints?: DisasterPoint[]
  successfulPoints?: number
}

export type WeatherTimeline = {
  scenarioId: DisasterScenario['id']
  frames: VhwisFrame[]
  cacheHit: boolean
  successfulPoints: number
  updatedAt: string
}

type WeatherTimelineOptions = {
  forceRefresh?: boolean
  start?: string
  end?: string
}

export async function loadWeatherTimeline(
  scenario: DisasterScenario,
  signal?: AbortSignal,
  options: WeatherTimelineOptions = {},
): Promise<WeatherTimeline> {
  const searchParams = new URLSearchParams()

  if (options.forceRefresh) {
    searchParams.set('refresh', '1')
  }

  if (options.start) {
    searchParams.set('start', options.start)
  }

  if (options.end) {
    searchParams.set('end', options.end)
  }

  const query = searchParams.toString()
  const response = await fetch(`/api/weather/${scenario.id}${query ? `?${query}` : ''}`, { signal })

  if (!response.ok) {
    throw new Error(`Weather timeline failed: ${response.status}`)
  }

  return (await response.json()) as WeatherTimeline
}
