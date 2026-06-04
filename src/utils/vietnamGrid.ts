import type { DisasterPoint, DisasterScenario } from '../data/scenarios'

type Coordinate = [number, number]
type Ring = Coordinate[]
type Polygon = Ring[]
type MultiPolygon = Polygon[]

type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: Polygon }
  | { type: 'MultiPolygon'; coordinates: MultiPolygon }

type GeoJsonFeature = {
  type: 'Feature'
  geometry: GeoJsonGeometry
  properties?: any
}

export type VietnamGeoJson = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export type GridCell = {
  id: string
  lon: number
  lat: number
  value: number
  direction?: number
}

type BaseGridCell = Omit<GridCell, 'value'>

const GRID_BOUNDS = {
  minLon: 102.1,
  maxLon: 109.5,
  minLat: 8.5,
  maxLat: 23.4,
}

const baseGridCache = new WeakMap<VietnamGeoJson, BaseGridCell[]>()

function pointInRing(lon: number, lat: number, ring: Ring) {
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

function pointInPolygon(lon: number, lat: number, polygon: Polygon) {
  if (!pointInRing(lon, lat, polygon[0])) {
    return false
  }

  return !polygon.slice(1).some((hole) => pointInRing(lon, lat, hole))
}

function pointInGeometry(lon: number, lat: number, geometry: GeoJsonGeometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(lon, lat, geometry.coordinates)
  }

  return geometry.coordinates.some((polygon) => pointInPolygon(lon, lat, polygon))
}

function isInsideVietnam(lon: number, lat: number, geoJson: VietnamGeoJson) {
  return geoJson.features.some((feature) => pointInGeometry(lon, lat, feature.geometry))
}

function estimateValue(lon: number, lat: number, points: DisasterPoint[], maxValue: number) {
  let weighted = 0
  let weightSum = 0

  for (const point of points) {
    const lonDistance = (lon - point.lon) * Math.cos((lat * Math.PI) / 180) * 111
    const latDistance = (lat - point.lat) * 111
    const distance = Math.sqrt(lonDistance * lonDistance + latDistance * latDistance)
    const weight = 1 / Math.max(distance, 4.5) ** 2.25
    weighted += point.value * weight
    weightSum += weight
  }

  const value = weighted / weightSum
  const step = maxValue <= 50 ? 1 : 2
  return Math.min(maxValue, Math.max(0, Math.round(value / step) * step))
}

function estimateDirection(lon: number, lat: number, points: DisasterPoint[]) {
  let sinSum = 0
  let cosSum = 0
  let weightSum = 0

  for (const point of points) {
    if (point.direction === undefined) continue
    const rad = (point.direction * Math.PI) / 180
    const lonDistance = (lon - point.lon) * Math.cos((lat * Math.PI) / 180) * 111
    const latDistance = (lat - point.lat) * 111
    const distance = Math.sqrt(lonDistance * lonDistance + latDistance * latDistance)
    const weight = 1 / Math.max(distance, 4.5) ** 2.25
    
    sinSum += Math.sin(rad) * weight
    cosSum += Math.cos(rad) * weight
    weightSum += weight
  }

  if (weightSum === 0) return 0
  const avgSin = sinSum / weightSum
  const avgCos = cosSum / weightSum
  let angle = (Math.atan2(avgSin, avgCos) * 180) / Math.PI
  return Math.round((angle + 360) % 360)
}

export function buildVietnamGrid(scenario: DisasterScenario, geoJson: VietnamGeoJson | null): GridCell[] {
  if (!geoJson || scenario.id === 'sst' || scenario.id === 'wave') {
    return []
  }

  const baseCells = getBaseGridCells(geoJson)
  const maxPointValue = Math.max(...scenario.points.map((point) => point.value), 0)
  const lowValueThreshold =
    maxPointValue < scenario.maxValue * 0.12 ? 0 : Math.min(scenario.maxValue * 0.035, maxPointValue * 0.15)
  const cells: GridCell[] = []
  const isWindScenario = ['wind', 'forecast_wind', 'gust', 'typhoon'].includes(scenario.id)

  for (const baseCell of baseCells) {
    const value = estimateValue(baseCell.lon, baseCell.lat, scenario.points, scenario.maxValue)

    if (scenario.id !== 'temperature' && (value <= 0 || (lowValueThreshold > 0 && value < lowValueThreshold))) {
      continue
    }

    const direction = isWindScenario ? estimateDirection(baseCell.lon, baseCell.lat, scenario.points) : undefined

    cells.push({
      ...baseCell,
      id: `${scenario.id}-${baseCell.id}`,
      value,
      direction,
    })
  }

  return cells
}

function getBaseGridCells(geoJson: VietnamGeoJson) {
  const cached = baseGridCache.get(geoJson)

  if (cached) {
    return cached
  }

  const cells: BaseGridCell[] = []
  const latStep = 0.12
  const lonStep = 0.12

  for (let lat = GRID_BOUNDS.minLat; lat <= GRID_BOUNDS.maxLat; lat += latStep) {
    for (let lon = GRID_BOUNDS.minLon; lon <= GRID_BOUNDS.maxLon; lon += lonStep) {
      if (!isInsideVietnam(lon, lat, geoJson)) {
        continue
      }

      cells.push({
        id: `${lon.toFixed(3)}-${lat.toFixed(3)}`,
        lon,
        lat,
      })
    }
  }

  baseGridCache.set(geoJson, cells)
  return cells
}
