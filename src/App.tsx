import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  CloudRain,
  Download,
  Droplet,
  Flame,
  Layers,
  Map as MapIcon,
  MapPin,
  Minus,
  PanelsTopLeft,
  Pause,
  Play,
  Plus,
  RotateCw,
  Satellite,
  Settings,
  Square,
  Sun,
  SunDim,
  Thermometer,
  TrendingUp,
  Video,
  Wind,
  ChevronDown,
  ChevronUp,
  X,
  Gauge,
  Cloud,
  Sliders,
} from 'lucide-react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'
import { scenarios, standardStations, type DisasterPoint, type DisasterScenario } from './data/scenarios'
import { historicalTyphoons, type HistoricalTyphoon } from './data/typhoons'
import { createMapStyle, mapThemes, type MapThemeId } from './data/mapThemes'
import { buildVietnamGrid, type GridCell, type VietnamGeoJson } from './utils/vietnamGrid'
import { rgbaToCss, valueToSteppedColor } from './utils/color'
import { loadWeatherTimeline, type VhwisFrame } from './services/kma'

type RegionLayerId = 'stations' | 'regions'

const DEFAULT_MAX_ELEVATION = 80_000
const RAIN_MAX_ELEVATION = 120_000
const RAIN_PRIMARY_ELEVATION_VALUE = 40
const RAIN_PRIMARY_ELEVATION_HEIGHT = 80_000

type Coordinate = [number, number]
type PolygonCoordinates = Coordinate[][]
type MultiPolygonCoordinates = PolygonCoordinates[]

type RegionalFeature = {
  type: 'Feature'
  properties: {
    id: string
    label: string
    value: number
    lon: number
    lat: number
  }
  geometry: {
    type: 'MultiPolygon'
    coordinates: MultiPolygonCoordinates
  }
}

type CalloutLayout = {
  nudgeX: number
  stemHeight: number
}

type CalloutPoint = DisasterPoint & {
  z: number
  offset: [number, number]
  iconId: string
  iconUrl: string
  iconWidth: number
  iconHeight: number
}

type ScriptText = {
  title: string
  headline: string
  subtitle: string
}


type CameraShot = {
  id: string
  name: string
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
  holdSeconds: number
  moveSeconds: number
  thumbnail: string
}

type RecordingState = 'idle' | 'recording' | 'ready'

type RecordingFormat = {
  mimeType: string
  extension: 'mp4' | 'webm'
}

type OverlayKey =
  | 'title'
  | 'status'
  | 'rank'
  | 'legend'
  | 'timeline'
  | 'controls'
  | 'callouts'
  | 'provinceLabels'
  | 'cameraPanel'
  | 'panelToggle'

type OverlayVisibility = Record<OverlayKey, boolean>

const overlayOptions: Array<{ key: OverlayKey; label: string }> = [
  { key: 'title', label: '좌상단 제목' },
  { key: 'status', label: '우상단 상태 배너' },
  { key: 'rank', label: '우측 순위표' },
  { key: 'legend', label: '좌하단 범례' },
  { key: 'timeline', label: '타임바/기간 입력' },
  { key: 'controls', label: '하단 메뉴' },
  { key: 'callouts', label: '지역 배너' },
  { key: 'provinceLabels', label: '지방명 레이어' },
  { key: 'cameraPanel', label: '카메라 패널' },
  { key: 'panelToggle', label: '운영 패널 버튼' },
]

const defaultOverlayVisibility: OverlayVisibility = {
  title: true,
  status: true,
  rank: true,
  legend: true,
  timeline: true,
  controls: true,
  callouts: true,
  provinceLabels: true,
  cameraPanel: true,
  panelToggle: true,
}

function createScriptText(scenario: DisasterScenario): ScriptText {
  return {
    title: scenario.title,
    headline: scenario.headline,
    subtitle: scenario.subtitle,
  }
}




function createCameraThumbnail(view: Pick<CameraShot, 'center' | 'zoom' | 'pitch' | 'bearing'>, index: number) {
  const label = `VIEW ${String(index + 1).padStart(2, '0')}`
  const sub = `${view.center[0].toFixed(2)}, ${view.center[1].toFixed(2)} / Z${view.zoom.toFixed(1)}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="168" height="92" viewBox="0 0 168 92">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#17314a"/>
      <stop offset="0.55" stop-color="#0d2233"/>
      <stop offset="1" stop-color="#06111e"/>
    </linearGradient>
  </defs>
  <rect width="168" height="92" fill="url(#sky)"/>
  <path d="M0 68 C32 55 52 74 82 57 C110 43 129 56 168 36 L168 92 L0 92 Z" fill="#244f3b" opacity="0.86"/>
  <path d="M0 75 C38 63 63 81 96 66 C124 54 141 65 168 50 L168 92 L0 92 Z" fill="#0d4a58" opacity="0.74"/>
  <rect x="10" y="10" width="58" height="17" fill="#f7fbff" opacity="0.94"/>
  <text x="16" y="23" font-family="Noto Sans KR, sans-serif" font-size="10" font-weight="900" fill="#111820">${label}</text>
  <text x="10" y="82" font-family="Noto Sans KR, sans-serif" font-size="9" font-weight="800" fill="#e8f4ff">${sub}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function createDefaultCameraShots(): CameraShot[] {
  const views: Array<Omit<CameraShot, 'id' | 'name' | 'holdSeconds' | 'moveSeconds' | 'thumbnail'>> = [
    { center: [105.85, 21.03], zoom: 6.2, pitch: 0, bearing: 0 }, // Hanoi (North)
    { center: [108.20, 16.05], zoom: 6.2, pitch: 0, bearing: 0 }, // Da Nang (Central)
    { center: [106.63, 10.82], zoom: 6.2, pitch: 0, bearing: 0 }, // Ho Chi Minh City (South)
  ]

  return views.map((view, index) => ({
    id: `camera-${index + 1}`,
    name: `${index + 1}번`,
    ...view,
    holdSeconds: 1,
    moveSeconds: 1,
    thumbnail: createCameraThumbnail(view, index),
  }))
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getHistoricalTyphoonPathData(typhoon: HistoricalTyphoon, frameIdx: number) {
  const currentPoint = typhoon.points[frameIdx] || typhoon.points[0]
  const currentCenter: [number, number] = [currentPoint.lon, currentPoint.lat]
  
  const history: [number, number][] = typhoon.points
    .slice(0, frameIdx + 1)
    .map(p => [p.lon, p.lat] as [number, number])
    
  const forecast: [number, number][] = typhoon.points
    .slice(frameIdx + 1)
    .map(p => [p.lon, p.lat] as [number, number])
    
  const cones = typhoon.points
    .slice(frameIdx + 1)
    .map((p, idx) => {
      return {
        center: [p.lon, p.lat] as [number, number],
        radiusKm: (idx + 1) * 35 + 40
      }
    })
    
  return {
    currentCenter,
    history,
    forecast,
    cones
  }
}

function generateTyphoonTimeline(typhoonId: string, lang: Language): VhwisFrame[] {
  if (typhoonId === 'live') {
    const now = new Date()
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000
    const timeNow = new Date(utcTime + 7 * 60 * 60 * 1000)
    const hourNow = timeNow.getHours()
    const monthNow = String(timeNow.getMonth() + 1).padStart(2, '0')
    const dayNow = String(timeNow.getDate()).padStart(2, '0')
    const dateStrNow = `${timeNow.getFullYear()}.${monthNow}.${dayNow} ${String(hourNow).padStart(2, '0')}:00`
    
    const points = standardStations.map((station: Omit<DisasterPoint, 'value'>) => {
      const stationHash = station.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const ambient = 2.0 + seededRandom(stationHash) * 2.0
      let direction = undefined
      if (station.lat > 19) direction = 230
      else if (station.lat > 14) direction = 250
      else direction = 270
      
      return {
        ...station,
        value: Math.round(ambient * 10) / 10,
        direction
      }
    })

    return [
      {
        id: 'typhoon-live-empty',
        label: lang === 'ko' ? '실황' : lang === 'vi' ? 'Thực tế' : 'Live',
        updatedAt: dateStrNow,
        source: lang === 'ko' ? '태풍 감시 시스템' : lang === 'vi' ? 'Hệ thống giám sát bão' : 'Typhoon Surveillance System',
        points
      }
    ]
  }

  const typhoon = historicalTyphoons.find(t => t.id === typhoonId) || historicalTyphoons[0]
  
  return typhoon.points.map((pt, idx) => {
    const points = standardStations.map((station: Omit<DisasterPoint, 'value'>) => {
      const lonDistance = (station.lon - pt.lon) * Math.cos((pt.lat * Math.PI) / 180) * 111
      const latDistance = (station.lat - pt.lat) * 111
      const distance = Math.sqrt(lonDistance * lonDistance + latDistance * latDistance)
      
      const R = pt.windRadius || 200
      const Vmax = pt.wind || 40
      
      let Vcyclone = 0
      if (distance < 15) {
        Vcyclone = Vmax * (distance / 15)
      } else {
        Vcyclone = Vmax * Math.pow(R / (R + distance - 15), 0.75)
      }
      
      const stationHash = station.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const seed = idx + stationHash
      const ambient = 2.0 + seededRandom(seed) * 2.0
      const totalWind = Math.round((ambient + Vcyclone) * 10) / 10
      
      const v_x = -latDistance + 0.35 * (-lonDistance)
      const v_y = lonDistance + 0.35 * (-latDistance)
      const angleRad = Math.atan2(v_y, v_x)
      let angleDeg = 90 - (angleRad * 180) / Math.PI
      angleDeg = Math.round((angleDeg + 360) % 360)
      
      return {
        ...station,
        value: totalWind,
        direction: angleDeg
      }
    })
    
    return {
      id: `${typhoon.id}-frame-${idx}`,
      label: pt.timeLabel,
      updatedAt: pt.timeLabel,
      source: lang === 'ko' ? '태풍 역사 기록' : lang === 'vi' ? 'Lịch sử bão' : 'Historical Track',
      points
    }
  })
}

function generateMockTimeline(scenario: DisasterScenario, lang: Language = 'vi'): VhwisFrame[] {
  const now = new Date()
  
  // Calculate Vietnam standard time (ICT, GMT+7) based on browser's UTC time
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const timeNow = new Date(utcTime + 7 * 60 * 60 * 1000)
  
  const frames: VhwisFrame[] = []
  
  // 1. 현재상태 (실황) 프레임 추가 (Index 0)
  const hourNow = timeNow.getHours()
  const labelNow = `실황 ${String(hourNow).padStart(2, '0')}:00`
  const monthNow = String(timeNow.getMonth() + 1).padStart(2, '0')
  const dayNow = String(timeNow.getDate()).padStart(2, '0')
  const dateStrNow = `${timeNow.getFullYear()}.${monthNow}.${dayNow} ${String(hourNow).padStart(2, '0')}:00`
  
  // Generate deterministic observed values
  const hourEpochNow = Math.floor(timeNow.getTime() / 3600000)
  const pointsNow = scenario.points.map((point) => {
    const range = (scenario.maxValue - scenario.minValue) * 0.15
    const stationHash = point.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const scenarioHash = scenario.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const seed = hourEpochNow + stationHash + scenarioHash
    const prngVal = seededRandom(seed) - 0.5
    
    // Observed doesn't have sine cycle offset (or has it based on current hour)
    const t = (hourNow - 5) / 24
    const cycle = Math.sin(t * 2 * Math.PI - Math.PI / 2)
    let val = point.value + cycle * range
    val += prngVal * (range * 0.1)
    val = Math.max(scenario.minValue, Math.min(scenario.maxValue, val))
    val = Math.round(val * 10) / 10
    
    let dir = point.direction
    if (dir !== undefined) {
      dir = Math.round((dir + cycle * 45 + prngVal * 30 + 360) % 360)
    }
    return { ...point, value: val, direction: dir }
  })
  
  frames.push({
    id: `${scenario.id}-mock-now`,
    label: labelNow,
    updatedAt: dateStrNow,
    source: translations[lang]['status_sample'] || '샘플 실황 데이터',
    points: pointsNow,
  })

  // 2. 예후 예측 (예보) 프레임들 추가 (Index 1 ~ 6)
  for (let i = 1; i <= 6; i++) {
    const time = new Date(timeNow.getTime() + i * 60 * 60 * 1000)
    const hour = time.getHours()
    
    // Sine wave offset to simulate natural meteorological cycle
    const t = (hour - 5) / 24
    const cycle = Math.sin(t * 2 * Math.PI - Math.PI / 2)
    
    const hourEpoch = Math.floor(time.getTime() / 3600000)
    const points = scenario.points.map((point) => {
      const range = (scenario.maxValue - scenario.minValue) * 0.15
      const stationHash = point.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const scenarioHash = scenario.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const seed = hourEpoch + stationHash + scenarioHash
      const prngVal = seededRandom(seed) - 0.5
      
      let val = point.value + cycle * range
      val += prngVal * (range * 0.1)
      val = Math.max(scenario.minValue, Math.min(scenario.maxValue, val))
      val = Math.round(val * 10) / 10
      
      let dir = point.direction
      if (dir !== undefined) {
        dir = Math.round((dir + cycle * 45 + prngVal * 30 + 360) % 360)
      }
      return { ...point, value: val, direction: dir }
    })
    
    const label = `예보 ${String(hour).padStart(2, '0')}:00`
    const month = String(time.getMonth() + 1).padStart(2, '0')
    const day = String(time.getDate()).padStart(2, '0')
    const dateStr = `${time.getFullYear()}.${month}.${day} ${String(hour).padStart(2, '0')}:00`
    
    frames.push({
      id: `${scenario.id}-mock-fcst-${i}`,
      label,
      updatedAt: dateStr,
      source: translations[lang]['simulation'] || 'AI 시뮬레이션 예보',
      points,
    })
  }
  
  return frames
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function getPreferredRecordingFormat(): RecordingFormat {
  const candidates: RecordingFormat[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=h264', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ]

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate.mimeType)) ?? candidates[candidates.length - 1]
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function getElevationRatio(value: number, scenario: DisasterScenario) {
  const domainSize = scenario.maxValue - scenario.minValue

  if (domainSize <= 0) {
    return 0
  }

  return clamp((value - scenario.minValue) / domainSize)
}

function getRainElevationValue(value: number, scenario: DisasterScenario) {
  const clampedValue = clamp(value, scenario.minValue, scenario.maxValue)
  const primaryDomain = RAIN_PRIMARY_ELEVATION_VALUE - scenario.minValue

  if (clampedValue <= RAIN_PRIMARY_ELEVATION_VALUE) {
    return primaryDomain <= 0
      ? 0
      : ((clampedValue - scenario.minValue) / primaryDomain) * RAIN_PRIMARY_ELEVATION_HEIGHT
  }

  const highDomain = scenario.maxValue - RAIN_PRIMARY_ELEVATION_VALUE

  if (highDomain <= 0) {
    return RAIN_PRIMARY_ELEVATION_HEIGHT
  }

  return (
    RAIN_PRIMARY_ELEVATION_HEIGHT +
    ((clampedValue - RAIN_PRIMARY_ELEVATION_VALUE) / highDomain) *
      (RAIN_MAX_ELEVATION - RAIN_PRIMARY_ELEVATION_HEIGHT)
  )
}

function getLinearElevationValue(value: number, scenario: DisasterScenario) {
  if (scenario.id === 'rain' || scenario.id === 'forecast_rain') {
    return getRainElevationValue(value, scenario)
  }

  return getElevationRatio(value, scenario) * DEFAULT_MAX_ELEVATION
}

function getColumnElevationValue(cell: GridCell, scenario: DisasterScenario) {
  return getLinearElevationValue(cell.value, scenario)
}



function buildGridGeoJson(cells: GridCell[], cellSizeMeters: number) {
  const R = cellSizeMeters * 0.38
  const D_lat = 111120

  const features = cells.map((cell) => {
    const cosLat = Math.cos((cell.lat * Math.PI) / 180)
    const dLat = R / D_lat
    const dLon = R / (D_lat * cosLat)

    return {
      type: 'Feature',
      properties: {
        id: cell.id,
        value: cell.value,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [cell.lon - dLon, cell.lat + dLat],
            [cell.lon + dLon, cell.lat + dLat],
            [cell.lon + dLon, cell.lat - dLat],
            [cell.lon - dLon, cell.lat - dLat],
            [cell.lon - dLon, cell.lat + dLat],
          ],
        ],
      },
    }
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

const addSvgImageToMap = (
  map: maplibregl.Map,
  id: string,
  svgString: string,
  options: { sdf?: boolean } = {}
): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      if (map.hasImage(id)) {
        map.removeImage(id)
      }
      map.addImage(id, img, options)
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    img.src = url
  })
}

function getRegionalElevationValue(value: number, scenario: DisasterScenario) {
  return getLinearElevationValue(value, scenario)
}

function removeVietnameseTones(str: string) {
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  return result.replace(/[^a-z0-9]/g, "");
}

function toMultiPolygonCoordinates(feature: VietnamGeoJson['features'][number]): MultiPolygonCoordinates {
  if (feature.geometry.type === 'Polygon') {
    return [feature.geometry.coordinates as PolygonCoordinates]
  }

  return feature.geometry.coordinates as MultiPolygonCoordinates
}

function getRegionValue(points: DisasterPoint[], pointIds: string[]) {
  const regionPoints = points.filter((point) => pointIds.includes(point.id))

  if (regionPoints.length === 0) {
    return 0
  }

  return Math.round((regionPoints.reduce((sum, point) => sum + point.value, 0) / regionPoints.length) * 10) / 10
}

function buildRegionalFeatures(geoJson: VietnamGeoJson | null, scenario: DisasterScenario): RegionalFeature[] {
  if (!geoJson) {
    return []
  }

  return traditionalRegions
    .map((region) => {
      const coordinates = geoJson.features
        .filter((feature) => {
          const name = feature.properties?.shapeName || feature.properties?.name || feature.properties?.name_eng || feature.properties?.Name || '';
          const hcKey = feature.properties?.['hc-key'] || '';
          const cleanedName = removeVietnameseTones(name);
          const cleanedHcKey = hcKey.replace('vn-', '').toLowerCase();
          return region.namesEng.includes(cleanedName) || region.namesEng.includes(cleanedHcKey);
        })
        .flatMap((feature) => toMultiPolygonCoordinates(feature))

      if (coordinates.length === 0) {
        return null
      }

      return {
        type: 'Feature',
        properties: {
          id: region.id,
          label: region.label,
          value: getRegionValue(scenario.points, region.pointIds),
          lon: region.center[0],
          lat: region.center[1],
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates,
        },
      } satisfies RegionalFeature
    })
    .filter(Boolean) as RegionalFeature[]
}

function escapeSvgText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatPointValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(Math.round(value * 10) / 10)
}

function createLegendTicks(scenario: DisasterScenario) {
  const tickCount = 6
  const range = scenario.maxValue - scenario.minValue

  return Array.from({ length: tickCount }, (_, index) => {
    const position = index / (tickCount - 1)
    const value = scenario.minValue + range * position
    const roundedValue = Math.round(value * 10) / 10
    const label = `${formatPointValue(roundedValue)}${index === tickCount - 1 ? scenario.unit : ''}`

    return {
      label,
      position: position * 100,
    }
  })
}

function translateLiveText(text: string | undefined, lang: Language): string {
  if (!text) return ''
  let processed = text.normalize('NFC')
  
  // Open-Meteo를 CF-VHWIS로 치환
  processed = processed.replace(/Open-Meteo/gi, 'CF-VHWIS')
  
  // 실황 -> Thực tế (vi), Observed (en)
  if (processed.includes('실황')) {
    if (lang === 'vi') {
      processed = processed.replace(/실황/g, 'Thực tế')
    } else if (lang === 'en') {
      processed = processed.replace(/실황/g, 'Observed')
    }
  }
  // 예보 -> Dự báo (vi), Forecast (en)
  if (processed.includes('예보')) {
    if (lang === 'vi') {
      processed = processed.replace(/예보/g, 'Dự báo')
    } else if (lang === 'en') {
      processed = processed.replace(/예보/g, 'Forecast')
    }
  }
  // 누적 -> Lũy kế (vi), Accum (en)
  if (processed.includes('누적')) {
    if (lang === 'vi') {
      processed = processed.replace(/누적/g, 'Lũy kế')
    } else if (lang === 'en') {
      processed = processed.replace(/누적/g, 'Accum')
    }
  }
  return processed
}

function formatTimebarLabel(updatedAt: string | undefined): { local: string; utc: string } {
  if (!updatedAt) return { local: '', utc: '' }

  const formatSingle = (timeStr: string) => {
    const normalized = timeStr.trim().replace(/\./g, '-').replace(' ', 'T')
    const iso = normalized.includes('+') || normalized.endsWith('Z') ? normalized : `${normalized}+07:00`
    const date = new Date(iso)
    if (isNaN(date.getTime())) {
      return { local: timeStr, utc: '' }
    }

    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    const localYear = vnDate.getUTCFullYear()
    const localMonth = String(vnDate.getUTCMonth() + 1).padStart(2, '0')
    const localDay = String(vnDate.getUTCDate()).padStart(2, '0')
    const localHour = String(vnDate.getUTCHours()).padStart(2, '0')
    const localMin = String(vnDate.getUTCMinutes()).padStart(2, '0')
    const localStr = `${localYear}.${localMonth}.${localDay} ${localHour}:${localMin} (ICT)`

    const utcHour = String(date.getUTCHours()).padStart(2, '0')
    const utcMin = String(date.getUTCMinutes()).padStart(2, '0')
    const utcStr = `${utcHour}:${utcMin} (UTC)`

    return { local: localStr, utc: utcStr }
  }

  if (updatedAt.includes(' ~ ')) {
    const parts = updatedAt.split(' ~ ')
    const start = formatSingle(parts[0])
    const end = formatSingle(parts[1])
    return {
      local: `${parts[0]} ~ ${parts[1]} (ICT)`,
      utc: `${start.utc.replace(' (UTC)', '')} ~ ${end.utc}`
    }
  }

  return formatSingle(updatedAt)
}

function estimateTextWidth(value: string, size: number) {
  return [...value].reduce((sum, char) => {
    const isKoreanOrVietnamese = /[가-힣]/.test(char) || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(char)
    if (isKoreanOrVietnamese) return sum + size * 1.05
    if (char === ' ') return sum + size * 0.5
    return sum + size * 0.7
  }, 0)
}


function createCalloutIcon(point: DisasterPoint, scenario: DisasterScenario, lang: Language) {
  const value = formatPointValue(point.value)
  const displayName = point.names?.[lang] || point.name
  const nameFontSize = lang === 'vi' ? 9.5 : 10.5

  const hasArrow = point.direction !== undefined
  const directionAngle = point.direction !== undefined ? (point.direction + 180) % 360 : 0

  if (scenario.id === 'wind' || scenario.id === 'forecast_wind' || scenario.id === 'gust' || scenario.id === 'typhoon') {
    const speedColor = rgbaToCss(valueToSteppedColor(point.value, scenario.palette, 255))
    const arrowColor = speedColor
    
    const arrowSvg = hasArrow ? `
    <g transform="translate(30, 40) rotate(${directionAngle})">
      <path d="M0 -21 L5 -10 L1.5 -11.5 L1.5 17 L-1.5 17 L-1.5 -11.5 L-5 -10 Z" fill="${arrowColor}" stroke="#ffffff" stroke-width="1.0" stroke-linejoin="round"/>
    </g>
    ` : ''

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="70" viewBox="0 0 60 70">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <!-- Connector Stems -->
    <line x1="30" y1="17" x2="30" y2="27" stroke="#ffffff" stroke-width="1" opacity="0.5"/>
    <line x1="30" y1="53" x2="30" y2="68" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2 2" opacity="0.8"/>
    <!-- Pin Dot -->
    <circle cx="30" cy="68" r="2" fill="#ffffff" stroke="#0b131e" stroke-width="1"/>
    <!-- Station Name Banner -->
    <g filter="url(#shadow)">
      <rect x="2" y="2" width="56" height="15" rx="3" fill="#0b131e" fill-opacity="0.88" stroke="#ffffff" stroke-width="0.5"/>
      <text x="30" y="12.5" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-size="8.5" font-weight="800" fill="#ffffff">${escapeSvgText(displayName)}</text>
    </g>
    <!-- Wind Dial Outer Circle & Arrow -->
    <g filter="url(#shadow)">
      ${arrowSvg}
      <!-- Inner Dial Circle -->
      <circle cx="30" cy="40" r="13" fill="#0b131e" fill-opacity="0.95" stroke="${speedColor}" stroke-width="2.5" />
      <!-- Wind Speed Text -->
      <text x="30" y="44" text-anchor="middle" font-family="Noto Sans KR, sans-serif" font-size="11.5" font-weight="900" fill="#ffffff">${escapeSvgText(value)}</text>
    </g>
  </svg>`

    const iconId = hasArrow ? `${point.id}-${point.value}-${point.direction}` : `${point.id}-${point.value}`

    return {
      iconId,
      iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      iconWidth: 60,
      iconHeight: 70,
    }
  }

  const nameWidth = estimateTextWidth(displayName, nameFontSize)
  const valueWidth = estimateTextWidth(value, 13)
  const maxWidth = lang === 'vi' ? 160 : 200
  const arrowWidth = hasArrow ? 16 : 0
  const iconWidth = Math.ceil(Math.max(80, Math.min(maxWidth, nameWidth + valueWidth + 28 + arrowWidth)))
  const iconHeight = 30
  const cardHeight = 19

  const arrowSvg = hasArrow ? `
  <g transform="translate(${iconWidth - 20}, 5.5) rotate(${directionAngle}, 6, 6)">
    <circle cx="6" cy="6" r="5.5" fill="#f8fbff" stroke="#111820" stroke-width="0.8" />
    <path d="M6 2 L8.5 9 L6 7.5 L3.5 9 Z" fill="#1a75ff" stroke="#111820" stroke-width="0.5" stroke-linejoin="round"/>
  </g>
  ` : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconWidth}" height="${iconHeight}" viewBox="0 0 ${iconWidth} ${iconHeight}">
  <defs>
    <filter id="shadow" x="-20%" y="-30%" width="140%" height="170%">
      <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.36"/>
    </filter>
  </defs>
  <rect x="3" y="2" width="${iconWidth - 6}" height="${cardHeight}" fill="#f7f9fc" fill-opacity="0.97" filter="url(#shadow)"/>
  <rect x="3" y="2" width="3.5" height="${cardHeight}" fill="#111820"/>
  <path d="M${iconWidth / 2} ${cardHeight + 1} L${iconWidth / 2} 25" stroke="#111820" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="${iconWidth / 2}" cy="26" r="2.5" fill="#f8fbff" stroke="#111820" stroke-width="1.5"/>
  <text x="10" y="15.5" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="${nameFontSize}" font-weight="700" fill="#1f2933">${escapeSvgText(displayName)}</text>
  <text x="${iconWidth - 7 - arrowWidth}" y="16" text-anchor="end" font-family="Noto Sans KR, Noto Sans CJK KR, sans-serif" font-size="13" font-weight="900" fill="#111820">${escapeSvgText(value)}</text>
  ${arrowSvg}
</svg>`

  const iconId = hasArrow ? `${point.id}-${point.value}-${point.direction}` : `${point.id}-${point.value}`

  return {
    iconId,
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconWidth,
    iconHeight,
  }
}

const CALLOUT_LAYOUTS: Record<string, CalloutLayout> = {
  hanoi: { nudgeX: 6, stemHeight: 38 },
  haiphong: { nudgeX: 20, stemHeight: 40 },
  quangninh: { nudgeX: 26, stemHeight: 44 },
  langson: { nudgeX: -16, stemHeight: 42 },
  laocai: { nudgeX: -26, stemHeight: 46 },
  dienbien: { nudgeX: -32, stemHeight: 48 },
  sonla: { nudgeX: -20, stemHeight: 44 },
  hoabinh: { nudgeX: -18, stemHeight: 44 },
  thainguyen: { nudgeX: 12, stemHeight: 42 },
  vinhphuc: { nudgeX: -12, stemHeight: 40 },
  hanam: { nudgeX: -16, stemHeight: 44 },
  namdinh: { nudgeX: 18, stemHeight: 46 },
  ninhbinh: { nudgeX: -18, stemHeight: 48 },
  thanhhoa: { nudgeX: -24, stemHeight: 50 },
  nghean: { nudgeX: -26, stemHeight: 52 },
  hue: { nudgeX: 24, stemHeight: 44 },
  danang: { nudgeX: 28, stemHeight: 46 },
  quangnam: { nudgeX: -20, stemHeight: 48 },
  quynhon: { nudgeX: 24, stemHeight: 44 },
  nhatrang: { nudgeX: 26, stemHeight: 42 },
  dalat: { nudgeX: -28, stemHeight: 46 },
  phanthiet: { nudgeX: 20, stemHeight: 44 },
  hochiminh: { nudgeX: 24, stemHeight: 40 },
  vungtau: { nudgeX: 28, stemHeight: 44 },
  tayninh: { nudgeX: -28, stemHeight: 46 },
  dongnai: { nudgeX: 16, stemHeight: 46 },
  cantho: { nudgeX: -24, stemHeight: 52 },
  phuquoc: { nudgeX: -32, stemHeight: 54 },
  camau: { nudgeX: -18, stemHeight: 56 },
}

const mapThemeIcon = {
  dark: Layers,
  admin: MapIcon,
  satellite: Satellite,
}

const regionLayers: Array<{ id: RegionLayerId; label: string }> = [
  { id: 'stations', label: '측정지점' },
  { id: 'regions', label: '광역지역' },
]

const traditionalRegions = [
  {
    id: 'north_mountain',
    label: '북부 산악',
    namesEng: ['hagiang', 'caobang', 'backan', 'tuyenquang', 'laocai', 'dienbien', 'laichau', 'sonla', 'yenbai', 'hoabinh', 'thainguyen', 'langson', 'bacgiang', 'phutho'],
    pointIds: ['laocai', 'dienbien', 'sonla', 'hoabinh', 'thainguyen', 'langson'],
    center: [104.5, 21.8] as [number, number],
  },
  {
    id: 'red_river',
    label: '홍강 삼각주',
    namesEng: ['hanoi', 'vinhphuc', 'bacninh', 'quangninh', 'haiduong', 'haiphong', 'hungyen', 'thaibinh', 'hanam', 'namdinh', 'ninhbinh'],
    pointIds: ['hanoi', 'haiphong', 'quangninh', 'vinhphuc', 'hanam', 'namdinh', 'ninhbinh'],
    center: [106.0, 20.8] as [number, number],
  },
  {
    id: 'north_central',
    label: '북중부',
    namesEng: ['thanhhoa', 'nghean', 'hatinh', 'quangbinh', 'quangtri', 'thuathienhue', 'thuathien - hue'],
    pointIds: ['thanhhoa', 'nghean', 'hue'],
    center: [106.0, 18.0] as [number, number],
  },
  {
    id: 'south_central',
    label: '남중부 & 고원',
    namesEng: ['danang', 'quangnam', 'quangngai', 'binhdinh', 'phuyen', 'khanhhoa', 'ninhthuan', 'binhthuan', 'kontum', 'gialai', 'daklak', 'daknong', 'lamdong'],
    pointIds: ['danang', 'quangnam', 'quynhon', 'nhatrang', 'dalat', 'phanthiet'],
    center: [108.5, 13.5] as [number, number],
  },
  {
    id: 'southeast',
    label: '동남부',
    namesEng: ['hochiminh', 'binhphuoc', 'tayninh', 'binhduong', 'dongnai', 'bariavungtau'],
    pointIds: ['hochiminh', 'vungtau', 'tayninh', 'dongnai'],
    center: [106.8, 11.0] as [number, number],
  },
  {
    id: 'mekong',
    label: '메콩 삼각주',
    namesEng: ['cantho', 'longan', 'tiengiang', 'bentre', 'travinh', 'vinhlong', 'dongthap', 'angiang', 'kiengiang', 'haugiang', 'soctrang', 'baclieu', 'camau'],
    pointIds: ['cantho', 'phuquoc', 'camau'],
    center: [105.5, 9.8] as [number, number],
  },
]

type Language = 'vi' | 'en' | 'ko'

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Categories
    observation: 'Thông tin quan trắc',
    forecast: 'Thông tin dự báo',
    danger: 'Chỉ số nguy cơ',
    marine: 'Hải dương & Giám sát',
    // Scenarios
    temperature: 'Nhiệt độ',
    humidity: 'Độ ẩm',
    wind: 'Tốc độ gió',
    gust: 'Gió giật',
    pressure: 'Áp suất',
    rain: 'Lượng mưa',
    solar: 'Bức xạ mặt trời',
    forecast_temp: 'Dự báo nhiệt độ',
    forecast_rain: 'Dự báo lượng mưa',
    forecast_wind: 'Dự báo gió',
    forecast_humidity: 'Dự báo độ ẩm',
    cloud: 'Độ che phủ mây',
    heat: 'Nhiệt độ cảm nhận',
    wildfire: 'Nguy cơ cháy rừng',
    uv: 'Chỉ số UV',
    aqi: 'Chất lượng không khí',
    landslide: 'Nguy cơ sạt lở',
    flood: 'Ngập lụt đô thị',
    drought: 'Hạn hán & Độ ẩm đất',
    typhoon: 'Theo dõi bão',
    sst: 'Nhiệt độ biển (SST)',
    wave: 'Chiều cao sóng',
    // UI labels
    refresh: 'Làm mới dữ liệu',
    trend: 'Xu hướng',
    cells: 'ô dữ liệu',
    rank: 'Bảng xếp hạng',
    station: 'Trạm đo',
    stations: 'Điểm đo',
    regions: 'Khu vực lớn',
    view3d: 'Góc nhìn 3D',
    view2d: 'Góc nhìn 2D',
    styleSatellite: 'Vệ tinh',
    styleAdmin: 'Hành chính',
    styleDark: 'Tối',
    timelinePlay: 'Phát dòng thời gian',
    timelinePause: 'Tạm dừng dòng thời gian',
    rainStart: 'Bắt đầu',
    rainEnd: 'Kết thúc',
    rainApply: 'Áp dụng',
    rainHours: 'giờ tích lũy',
    forecastModel: 'Dự báo mô hình AI',
    simulation: 'Dự báo mô phỏng AI',
    statusChecking: 'Đang kiểm tra...',
    statusCheckingLive: 'Đang tải thời tiết...',
    statusUpdated: 'Cập nhật trạm đo',
    sampleData: 'Dữ liệu mẫu',
    trendTitle: 'Xu hướng thời gian thực',
    languageLabel: 'Ngôn ngữ',
    demo: 'Trình diễn',
    texts: 'Văn bản',
    settings: 'Cài đặt',
    // UI Settings
    settings_title: 'Thiết lập hiển thị',
    settings_reset: 'Hiển thị tất cả',
    settings_close: 'Đóng',
    // UI Options
    opt_title: 'Tiêu đề phía trên bên trái',
    opt_status: 'Băng rôn trạng thái phía trên bên phải',
    opt_rank: 'Bảng xếp hạng bên phải',
    opt_legend: 'Chú giải phía dưới bên trái',
    opt_timeline: 'Thanh thời gian/Nhập khoảng thời gian',
    opt_controls: 'Menu phía dưới',
    opt_callouts: 'Băng rôn khu vực',
    opt_provinceLabels: 'Lớp nhãn địa phương',
    opt_cameraPanel: 'Bảng điều khiển camera',
    opt_panelToggle: 'Nút bảng điều khiển vận hành',
    // Live strip
    live_template: 'Bản mẫu trực tiếp',
    status_loading: 'Đang tải thời tiết...',
    status_ai_forecast: 'Dự báo mô phỏng AI',
    status_rain_range: 'Hiển thị lượng mưa tích lũy',
    status_cache_hit: 'Giữ nguyên dữ liệu ({0} điểm)',
    status_cache_update: 'Cập nhật dữ liệu ({0} điểm)',
    status_api_fail: 'API thất bại, hiển thị mô phỏng',
    status_checking: 'Đang kiểm tra...',
    status_sample: 'Dữ liệu mẫu',
    status_rain_apply: 'Áp dụng lượng mưa',
    // Regions
    north_mountain: 'Miền núi phía Bắc',
    red_river: 'Đồng bằng sông Hồng',
    north_central: 'Bắc Trung Bộ',
    south_central: 'Nam Trung Bộ & Tây Nguyên',
    southeast: 'Đông Nam Bộ',
    mekong: 'Đồng bằng sông Cửu Long',
    // Headlines and Subtitles
    temperature_headline: 'Bản đồ nhiệt độ thực tế',
    temperature_subtitle: 'Sản xuất thông tin thời tiết độ phân giải cao CF-VHWIS',
    humidity_headline: 'Bản đồ độ ẩm thời gian thực',
    humidity_subtitle: 'Sản xuất thông tin thời tiết độ phân giải cao CF-VHWIS',
    wind_headline: 'Bản đồ tốc độ gió thời gian thực',
    wind_subtitle: 'Sản xuất thông tin thời tiết độ phân giải cao CF-VHWIS (m/s)',
    gust_headline: 'Bản đồ gió giật thời gian thực',
    gust_subtitle: 'Đo lường gió giật tức thời và lốc xoáy vùng ven biển',
    pressure_headline: 'Bản đồ áp suất khí quyển',
    pressure_subtitle: 'Giám sát áp suất không khí và các vùng áp thấp',
    rain_headline: 'Thông tin lượng mưa thực tế',
    rain_subtitle: 'Sản xuất thông tin thời tiết độ phân giải cao CF-VHWIS',
    solar_headline: 'Bản đồ bức xạ mặt trời',
    solar_subtitle: 'Đo lường năng lượng ánh sáng mặt trời theo W/m²',
    forecast_temp_headline: 'Dự báo phân bố nhiệt độ ngày mai',
    forecast_temp_subtitle: 'Sản xuất thông tin thời tiết độ phân giải cao CF-VHWIS',
    forecast_rain_headline: 'Dự báo phân bố lượng mưa ngày mai',
    forecast_rain_subtitle: 'Sản xuất thông tin thời tiết độ phân giải cao CF-VHWIS (24h)',
    forecast_wind_headline: 'Dự báo tốc độ gió ngày mai',
    forecast_wind_subtitle: 'Dự báo gió bề mặt và hướng gió di chuyển',
    forecast_humidity_headline: 'Dự báo phân bố độ ẩm ngày mai',
    forecast_humidity_subtitle: 'Phân tích dự báo độ ẩm tương đối của khí quyển',
    cloud_headline: 'Dự báo độ che phủ mây',
    cloud_subtitle: 'Mô hình phân tích tỷ lệ che phủ mây trên bầu trời',
    heat_headline: 'Chỉ số nhiệt độ cảm nhận',
    heat_subtitle: 'Áp lực nhiệt tính đến yếu tố độ ẩm và gió',
    wildfire_headline: 'Nguy cơ cháy rừng thời gian thực',
    wildfire_subtitle: 'Chỉ số dựa trên nhiệt độ, độ ẩm và tốc độ gió',
    uv_headline: 'Chỉ số tia cực tím UV thời gian thực',
    uv_subtitle: 'Cường độ bức xạ tia cực tím mặt trời',
    aqi_headline: 'Bản đồ chất lượng không khí thực tế (AQI)',
    aqi_subtitle: 'Chỉ số chất lượng không khí tổng hợp theo tiêu chuẩn US EPA',
    landslide_headline: 'Nguy cơ sạt lở đất sườn dốc',
    landslide_subtitle: 'Phân tích sạt lở tại các vùng núi phía Bắc và Tây Nguyên',
    flood_headline: 'Bản đồ nguy cơ ngập lụt đô thị',
    flood_subtitle: 'Phân tích rủi ro ngập úng tại các đô thị lớn hạ lưu sông',
    drought_headline: 'Hạn hán & Độ ẩm đất',
    drought_subtitle: 'Giám sát độ khô hạn của đất trồng trọt và nguy cơ xâm nhập mặn vùng đồng bằng sông Cửu Long',
    typhoon_headline: 'Theo dõi bão thời gian thực',
    typhoon_subtitle: 'Đường đi bão thực tế, vùng nguy hiểm và vùng dự báo sai số',
    sst_headline: 'Nhiệt độ mặt nước biển (SST)',
    sst_subtitle: 'Giám sát năng lượng nhiệt đại dương quanh thềm lục địa Việt Nam',
    wave_headline: 'Bản đồ chiều cao sóng biển',
    wave_subtitle: 'Theo dõi sóng biển có ý nghĩa phục vụ đánh bắt và cứu hộ',
    hoangsa: 'Quần đảo Hoàng Sa',
    truongsa: 'Quần đảo Trường Sa',
  },
  en: {
    // Categories
    observation: 'Observations',
    forecast: 'AI Forecasts',
    danger: 'Risk Indices',
    marine: 'Marine & Specialty',
    // Scenarios
    temperature: 'Temperature',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    gust: 'Wind Gust',
    pressure: 'Pressure',
    rain: 'Rainfall',
    solar: 'Solar Radiation',
    forecast_temp: 'Forecast Temp',
    forecast_rain: 'Forecast Rain',
    forecast_wind: 'Forecast Wind',
    forecast_humidity: 'Forecast Humidity',
    cloud: 'Cloud Cover',
    heat: 'Feels Like Temp',
    wildfire: 'Wildfire Risk',
    uv: 'UV Index',
    aqi: 'Air Quality (AQI)',
    landslide: 'Landslide Risk',
    flood: 'Urban Flood Risk',
    drought: 'Drought Index',
    typhoon: 'Typhoon Tracker',
    sst: 'Sea Temp (SST)',
    wave: 'Wave Height',
    // UI labels
    refresh: 'Refresh weather data',
    trend: 'Trend',
    cells: 'cells',
    rank: 'Top Locations',
    station: 'Station',
    stations: 'Stations',
    regions: 'Regions',
    view3d: '3D View',
    view2d: '2D View',
    styleSatellite: 'Satellite',
    styleAdmin: 'Admin Map',
    styleDark: 'Dark Map',
    timelinePlay: 'Play Timeline',
    timelinePause: 'Pause Timeline',
    rainStart: 'Start',
    rainEnd: 'End',
    rainApply: 'Apply',
    rainHours: 'hours accumulated',
    forecastModel: 'AI Forecast Model',
    simulation: 'AI Simulation Forecast',
    statusChecking: 'Checking data...',
    statusCheckingLive: 'Loading weather...',
    statusUpdated: 'Updated stations',
    sampleData: 'Sample Data',
    trendTitle: 'Realtime Trend',
    languageLabel: 'Language',
    demo: 'Demo',
    texts: 'Texts',
    settings: 'Settings',
    // UI Settings
    settings_title: 'Display Settings',
    settings_reset: 'Reset All',
    settings_close: 'Close',
    // UI Options
    opt_title: 'Top Left Title',
    opt_status: 'Top Right Status Banner',
    opt_rank: 'Right Sidebar Ranking',
    opt_legend: 'Bottom Left Legend',
    opt_timeline: 'Bottom Play Timeline/Range',
    opt_controls: 'Bottom Control Panel',
    opt_callouts: 'Map Location Banners',
    opt_provinceLabels: 'Province Label Overlay',
    opt_cameraPanel: 'Camera Auto-Orbit Panel',
    opt_panelToggle: 'Dashboard Control Buttons',
    // Live strip
    live_template: 'LIVE TEMPLATE',
    status_loading: 'Loading weather...',
    status_ai_forecast: 'AI Simulation Forecast',
    status_rain_range: 'Accumulated Rainfall Range',
    status_cache_hit: 'Data cached ({0} stations)',
    status_cache_update: 'Data updated ({0} stations)',
    status_api_fail: 'API failed, showing simulation',
    status_checking: 'Checking data...',
    status_sample: 'Sample Data',
    status_rain_apply: 'Rainfall range applied',
    // Regions
    north_mountain: 'Northern Mountains',
    red_river: 'Red River Delta',
    north_central: 'North Central',
    south_central: 'South Central & Highlands',
    southeast: 'Southeast',
    mekong: 'Mekong Delta',
    // Headlines and Subtitles
    temperature_headline: 'Realtime Temperature Distribution',
    temperature_subtitle: 'CF-VHWIS High-Resolution Weather Data Production',
    humidity_headline: 'Realtime Humidity Distribution',
    humidity_subtitle: 'CF-VHWIS High-Resolution Weather Data Production',
    wind_headline: 'Realtime Wind Speed Distribution',
    wind_subtitle: 'CF-VHWIS High-Resolution Weather Data Production (m/s)',
    gust_headline: 'Realtime Wind Gust Distribution',
    gust_subtitle: 'Monitoring sudden maximum gust and gale risk',
    pressure_headline: 'Realtime Surface Pressure Map',
    pressure_subtitle: 'Monitoring atmospheric pressure systems in East Sea & Mainland',
    rain_headline: 'Realtime Precipitation Distribution',
    rain_subtitle: 'CF-VHWIS High-Resolution Weather Data Production',
    solar_headline: 'Realtime Solar Radiation Intensity',
    solar_subtitle: 'Monitoring solar energy production potential (W/m²)',
    forecast_temp_headline: 'Tomorrow Temperature Forecast',
    forecast_temp_subtitle: 'CF-VHWIS High-Resolution Weather Data Production',
    forecast_rain_headline: 'Tomorrow Rainfall Forecast',
    forecast_rain_subtitle: 'CF-VHWIS High-Resolution Weather Data Production (24h)',
    forecast_wind_headline: 'Tomorrow Wind Forecast',
    forecast_wind_subtitle: 'Forecasted surface wind speed and vector fields',
    forecast_humidity_headline: 'Tomorrow Humidity Forecast',
    forecast_humidity_subtitle: 'Forecasted relative humidity fields',
    cloud_headline: 'Forecasted Cloud Cover Distribution',
    cloud_subtitle: 'Forecast of low, middle, and high cloud coverage',
    heat_headline: 'Feels Like Temperature Index',
    heat_subtitle: 'Thermal stress taking into account humidity and wind',
    wildfire_headline: 'Realtime Wildfire Spread Danger',
    wildfire_subtitle: 'Realtime index based on temperature, humidity and wind',
    uv_headline: 'Realtime UV Index Distribution',
    uv_subtitle: 'Solar ultraviolet radiation intensity',
    aqi_headline: 'Realtime Air Quality Index (AQI)',
    aqi_subtitle: 'US EPA comprehensive air quality index based on PM2.5',
    landslide_headline: 'Mountain Landslide Danger Index',
    landslide_subtitle: 'Slope failure risk model based on cumulative rainfall and topography',
    flood_headline: 'Urban Inundation & Flood Risk',
    flood_subtitle: 'Tidal levels and cumulative rain correlation model',
    drought_headline: 'Drought and Soil Moisture Monitor',
    drought_subtitle: 'Soil water depletion index and salinity intrusion risk in Mekong',
    typhoon_headline: 'Live Typhoon Tracking Center',
    typhoon_subtitle: 'Forecast cone of uncertainty, storm path and radial wind fields',
    sst_headline: 'Sea Surface Temperature (SST)',
    sst_subtitle: 'Monitoring ocean heat content off Vietnam coastline',
    wave_headline: 'Significant Wave Height Map',
    wave_subtitle: 'Significant wave heights for maritime shipping and fishing safety',
    hoangsa: 'Hoang Sa Archipelago',
    truongsa: 'Truong Sa Archipelago',
  },
  ko: {
    // Categories
    observation: '기상관측 정보',
    forecast: '기상예보 정보',
    danger: '생활 및 재난 위험 지수',
    marine: '해양 및 재난 감시',
    // Scenarios
    temperature: '기온',
    humidity: '상대습도',
    wind: '풍속/풍향',
    gust: '돌풍',
    pressure: '기압',
    rain: '강수현황',
    solar: '일사량',
    forecast_temp: '기온 예보',
    forecast_rain: '강수 예보',
    forecast_wind: '풍속/풍향 예보',
    forecast_humidity: '습도 예보',
    cloud: '구름량',
    heat: '체감온도',
    wildfire: '산불 위험도',
    uv: 'UV 지수',
    aqi: '대기질 지수',
    landslide: '산사태 위험',
    flood: '도심 침수',
    drought: '가뭄/토양수분',
    typhoon: '태풍 트래킹',
    sst: '해수면 온도',
    wave: '유의 파고',
    // UI labels
    refresh: '날씨 데이터 새로고침',
    trend: '추이',
    cells: '개 격자',
    rank: '주요 지점',
    station: '지점',
    stations: '측정지점',
    regions: '광역지역',
    view3d: '3D 뷰',
    view2d: '2D 뷰',
    styleSatellite: '위성',
    styleAdmin: '행정',
    styleDark: '다크',
    timelinePlay: '타임라인 재생',
    timelinePause: '타임라인 정지',
    rainStart: '시작',
    rainEnd: '마감',
    rainApply: '적용',
    rainHours: '시간 누적',
    forecastModel: '기상 AI 예측 모델',
    simulation: 'AI 시뮬레이션 예보',
    statusChecking: '최신 데이터 확인 중',
    statusCheckingLive: '날씨 데이터 불러오는 중',
    statusUpdated: '데이터 갱신 완료',
    sampleData: '샘플 데이터',
    trendTitle: '실시간 추이',
    languageLabel: '언어',
    demo: '시연',
    texts: '문구',
    settings: '설정',
    // UI Settings
    settings_title: '화면 표시 설정',
    settings_reset: '전체 표시',
    settings_close: '닫기',
    // UI Options
    opt_title: '좌상단 제목',
    opt_status: '우상단 상태 배너',
    opt_rank: '우측 순위표',
    opt_legend: '좌하단 범례',
    opt_timeline: '타임바/기간 입력',
    opt_controls: '하단 메뉴',
    opt_callouts: '지역 배너',
    opt_provinceLabels: '지방명 레이어',
    opt_cameraPanel: '카메라 패널',
    opt_panelToggle: '운영 패널 버튼',
    // Live strip
    live_template: '실시간 템플릿',
    status_loading: '날씨 데이터 불러오는 중',
    status_ai_forecast: 'AI 시뮬레이션 예보',
    status_rain_range: '누적강수량 범위 표시',
    status_cache_hit: '데이터 유지 {0}지점',
    status_cache_update: '데이터 갱신 {0}지점',
    status_api_fail: '날씨 API 실패, 모의 추이 표시',
    status_checking: '최신 데이터 확인 중',
    status_sample: '샘플 데이터',
    status_rain_apply: '누적강수량 범위 적용',
    // Regions
    north_mountain: '북부 산악',
    red_river: '홍강 삼각주',
    north_central: '북중부',
    south_central: '남중부 & 고원',
    southeast: '동남부',
    mekong: '메콩 삼각주',
    // Headlines and Subtitles
    temperature_headline: '실시간 기온 분포',
    temperature_subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    humidity_headline: '실시간 상대습도 분포',
    humidity_subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    wind_headline: '실시간 풍속 분포 및 바람장 벡터',
    wind_subtitle: 'CF-VHWIS 고해상도 풍속/풍향 관측 정보 (m/s)',
    gust_headline: '실시간 돌풍(Wind Gust) 분포',
    gust_subtitle: '연안 및 강풍 취약 구역의 순간 최대 풍속 감시',
    pressure_headline: '실시간 기압 분포',
    pressure_subtitle: '동해 해역 고저기압 배치 및 대기 순환 모니터링',
    rain_headline: '실시간 강수량 정보',
    rain_subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    solar_headline: '실시간 태양 일사량 분포',
    solar_subtitle: '지역별 일조량 및 태양광 에너지 생산성 모니터링 (W/m²)',
    forecast_temp_headline: '내일 기온 예측 분포',
    forecast_temp_subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    forecast_rain_headline: '내일 강수량 예측 분포',
    forecast_rain_subtitle: 'CF-VHWIS 고해상도 기상정보 생산 (24h)',
    forecast_wind_headline: '내일 예측 바람장 및 풍속 분포',
    forecast_wind_subtitle: '단기 대기 수치 예측 모델 기반 바람 분석',
    forecast_humidity_headline: '내일 상대습도 예측 분포',
    forecast_humidity_subtitle: '대기 수치 예보 모델 단기 습도 시뮬레이션',
    cloud_headline: '예측 총 구름량 분포',
    cloud_subtitle: '전운량 시뮬레이션을 통한 가시성 및 기상 상태 예찰',
    heat_headline: '체감 온도 지수',
    heat_subtitle: '습도와 바람을 고려한 열 스트레스',
    wildfire_headline: '산불 발생 위험도',
    wildfire_subtitle: '온도, 습도, 풍속 기반 실시간 지수',
    uv_headline: '실시간 자외선 지수',
    uv_subtitle: '일사 및 태양 자외선 노출 강도',
    aqi_headline: '실시간 대기질 분포 (AQI)',
    aqi_subtitle: 'US EPA 기준 미세먼지 종합 대기질 지수',
    landslide_headline: '산사태 취약 및 경사면 위험지수',
    landslide_subtitle: '누적 강우 강도와 해발고도 분석을 연계한 산사태 모니터링',
    flood_headline: '도심 침수 및 하천 범람 위험도',
    flood_subtitle: '우기철 배수 불량 및 해수면 만조 연계 도시 범람 위험도 분석',
    drought_headline: '가뭄 및 메콩 삼각주 토양 수분 지수',
    drought_subtitle: '농경지 가뭄 모니터링 및 메콩 강 하구 해수(염수) 침입 감시',
    typhoon_headline: '실시간 태풍 이동 경로 및 반경',
    typhoon_subtitle: '동해상 발생 태풍의 현 위치, 강도, 예측 경로선 및 예보원 표출',
    sst_headline: '해수면 온도 (SST) 분포도',
    sst_subtitle: '해안 해류 순환 및 태풍 열량 공급원 해양 온도 모니터링',
    wave_headline: '유의 파고 및 해상 파랑 분석',
    wave_subtitle: '연안 선박 활동 및 도서 지역(황사/쯔엉사) 운항 안전 감시',
    hoangsa: '황사 군도',
    truongsa: '쯔엉사 군도',
  }
}


function getTyphoonPathData(epochHour: number) {
  const centerForEpoch = (ep: number) => {
    const cycle = ep % 48
    const lon = 116.0 - cycle * 0.28
    const lat = 15.0 + Math.sin(cycle * 0.1) * 2.0
    return [lon, lat]
  }

  const currentCenter = centerForEpoch(epochHour) as [number, number]

  const history: [number, number][] = []
  for (let i = -12; i <= 0; i++) {
    history.push(centerForEpoch(epochHour + i) as [number, number])
  }

  const forecast: [number, number][] = []
  const cones: { center: [number, number]; radiusKm: number }[] = []
  for (let i = 1; i <= 6; i++) {
    const pt = centerForEpoch(epochHour + i) as [number, number]
    forecast.push(pt)
    cones.push({
      center: pt,
      radiusKm: i * 40,
    })
  }

  return {
    currentCenter,
    history,
    forecast,
    cones,
  }
}

function createGeoJsonCircle(center: [number, number], radiusKm: number, points = 32) {
  const [lon, lat] = center
  const coordinates: [number, number][] = []
  const kmPerDegreeLat = 111.32
  const kmPerDegreeLon = 111.32 * Math.cos((lat * Math.PI) / 180)

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    const dx = Math.cos(angle) * radiusKm
    const dy = Math.sin(angle) * radiusKm
    const pointLon = lon + dx / kmPerDegreeLon
    const pointLat = lat + dy / kmPerDegreeLat
    coordinates.push([pointLon, pointLat])
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
    properties: {
      radius: radiusKm,
    },
  }
}

function App() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const requestSeqRef = useRef(0)
  const cameraRunIdRef = useRef(0)
  const revealFrameRef = useRef<number | null>(null)
  const zoomFrameRef = useRef<number | null>(null)
  const zoomDirectionRef = useRef(0)
  const isRightMouseDownRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const [scenarioId, setScenarioId] = useState<DisasterScenario['id']>('temperature')
  const [selectedStationId, setSelectedStationId] = useState<string>('hanoi')
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedTyphoonId, setSelectedTyphoonId] = useState<string>('live')
  const [overlayWind, setOverlayWind] = useState<boolean>(false)
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [lang, setLang] = useState<Language>('vi')
  const [mapTheme, setMapTheme] = useState<MapThemeId>('satellite')
  const [regionLayer, setRegionLayer] = useState<RegionLayerId>('stations')
  const [vietnamGeoJson, setVietnamGeoJson] = useState<VietnamGeoJson | null>(null)
  const [timeline, setTimeline] = useState<VhwisFrame[]>(() => {
    const defaultSec = scenarios.find((s) => s.id === 'temperature') || scenarios[0]
    return generateMockTimeline(defaultSec, 'vi')
  })
  const [frameIndex, setFrameIndex] = useState(0)
  const [dataStatus, setDataStatus] = useState<{ key: string; arg?: any }>(() => ({ key: 'status_loading' }))
  const [mapLayersInitialized, setMapLayersInitialized] = useState(false)
  const [isTimebarExpanded, setIsTimebarExpanded] = useState(true)
  const renderDataStatus = () => {
    const { key, arg } = dataStatus
    const template = translations[lang][key] || key
    if (arg !== undefined) {
      return template.replace('{0}', String(arg))
    }
    return template
  }
  const [scriptTexts, setScriptTexts] = useState<Record<DisasterScenario['id'], ScriptText>>(() =>
    scenarios.reduce(
      (texts, item) => ({
        ...texts,
        [item.id]: createScriptText(item),
      }),
      {} as Record<DisasterScenario['id'], ScriptText>,
    ),
  )

  // Sync script texts when selected language changes
  useEffect(() => {
    setScriptTexts(() => {
      return scenarios.reduce((texts, item) => {
        const id = item.id
        return {
          ...texts,
          [id]: {
            title: translations[lang][id] || item.title,
            headline: translations[lang][`${id}_headline`] || item.headline,
            subtitle: translations[lang][`${id}_subtitle`] || item.subtitle,
          }
        }
      }, {} as Record<DisasterScenario['id'], ScriptText>)
    })
  }, [lang])
  const [columnReveal, setColumnReveal] = useState(1)
  const [cameraPanelOpen, setCameraPanelOpen] = useState(false)
  const [cameraShots, setCameraShots] = useState<CameraShot[]>(() => createDefaultCameraShots())
  const [draggingShotId, setDraggingShotId] = useState<string | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingExtension, setRecordingExtension] = useState<RecordingFormat['extension']>('webm')
  const [recordingError, setRecordingError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>(defaultOverlayVisibility)
  const [shortcutChromeHidden, setShortcutChromeHidden] = useState(false)
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileBoardOpen, setMobileBoardOpen] = useState(false)
  const [mobileMapOptionsOpen, setMobileMapOptionsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showTimebarMetaPopup, setShowTimebarMetaPopup] = useState(false)
  const metaPopupTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (metaPopupTimeoutRef.current) {
        window.clearTimeout(metaPopupTimeoutRef.current)
      }
    }
  }, [])

  const handleMetaClick = () => {
    if (window.innerWidth > 768) return

    if (metaPopupTimeoutRef.current) {
      window.clearTimeout(metaPopupTimeoutRef.current)
      metaPopupTimeoutRef.current = null
    }

    if (showTimebarMetaPopup) {
      setShowTimebarMetaPopup(false)
    } else {
      setShowTimebarMetaPopup(true)
      metaPopupTimeoutRef.current = window.setTimeout(() => {
        setShowTimebarMetaPopup(false)
        metaPopupTimeoutRef.current = null
      }, 3000)
    }
  }

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    observation: true,
    forecast: false,
    danger: false,
    marine: false,
  })
  const [is3DMode, setIs3DMode] = useState(true)
  const is3DModeRef = useRef(is3DMode)
  const [mapStyleLoaded, setMapStyleLoaded] = useState(false)
  useEffect(() => {
    is3DModeRef.current = is3DMode
  }, [is3DMode])

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )
  const scenarioRef = useRef(scenario)
  useEffect(() => {
    scenarioRef.current = scenario
  }, [scenario])
  const scriptText = useMemo(() => {
    const base = scriptTexts[scenario.id] ?? createScriptText(scenario)
    if (scenario.id === 'typhoon' && selectedTyphoonId !== 'live') {
      const activeTyphoon = historicalTyphoons.find(t => t.id === selectedTyphoonId)
      if (activeTyphoon) {
        return {
          title: lang === 'ko' ? '과거 태풍 분석' : lang === 'vi' ? 'Phân tích bão lịch sử' : 'Historical Typhoon Analysis',
          headline: activeTyphoon.name[lang] || activeTyphoon.name.en,
          subtitle: lang === 'ko' ? '기상 역사 데이터 기반 경로 및 세기 정밀 분석' : lang === 'vi' ? 'Phân tích chính xác đường đi và cường độ dựa trên dữ liệu lịch sử' : 'Precise path and intensity analysis based on historical meteorological data'
        }
      }
    }
    return base
  }, [scriptTexts, scenario.id, selectedTyphoonId, lang])

  const activeFrameIndex = Math.min(frameIndex, Math.max(timeline.length - 1, 0))
  const activeFrame = timeline[activeFrameIndex]
  const activeScenario = useMemo(
    () => ({
      ...scenario,
      updatedAt: activeFrame?.updatedAt ?? scenario.updatedAt,
      source: activeFrame?.source ?? scenario.source,
      points: activeFrame?.points ?? scenario.points,
    }),
    [activeFrame, scenario],
  )
  const typhoonData = useMemo(() => {
    if (scenario.id === 'typhoon') {
      if (selectedTyphoonId === 'live') {
        return {
          lat: 0,
          lon: 0,
          wind: 0,
          pressure: 0,
          speedMovement: 0,
          dirMovement: { ko: '없음', vi: 'Không có', en: 'None' },
          windRadius: 0,
          pathData: {
            currentCenter: [0, 0] as [number, number],
            history: [] as [number, number][],
            forecast: [] as [number, number][],
            cones: [] as { center: [number, number]; radiusKm: number }[]
          }
        }
      }

      const typhoon = historicalTyphoons.find(t => t.id === selectedTyphoonId) || historicalTyphoons[0]
      const frameIdx = frameIndex < typhoon.points.length ? frameIndex : 0
      const currentPoint = typhoon.points[frameIdx]
      const pathData = getHistoricalTyphoonPathData(typhoon, frameIdx)
      
      return {
        lat: currentPoint.lat,
        lon: currentPoint.lon,
        wind: currentPoint.wind,
        pressure: currentPoint.pressure,
        speedMovement: currentPoint.speedMovement,
        dirMovement: currentPoint.dirMovement,
        windRadius: currentPoint.windRadius,
        pathData
      }
    }
    
    const dateStr = activeFrame?.updatedAt || activeScenario.updatedAt
    const cleanedDateStr = dateStr.replace(/\./g, '-').replace(' ', 'T')
    const date = new Date(cleanedDateStr + '+07:00')
    const epochHour = isNaN(date.getTime()) ? 494500 : Math.floor(date.getTime() / 3600000)
    const pathData = getTyphoonPathData(epochHour)
    const cycle = epochHour % 48
    const wind = Math.round((45 + Math.sin(cycle * 0.15) * 8) * 10) / 10
    const pressure = Math.round(960 - Math.sin(cycle * 0.15) * 15)
    
    return {
      lat: pathData.currentCenter[1],
      lon: pathData.currentCenter[0],
      wind,
      pressure,
      speedMovement: 15,
      dirMovement: { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
      windRadius: 200,
      pathData
    }
  }, [scenario, selectedTyphoonId, frameIndex, activeFrame, activeScenario])
  const legendTicks = useMemo(() => createLegendTicks(activeScenario), [activeScenario])

  useEffect(() => {
    console.log('[DEBUG-MAP-STATE]', {
      mapExists: !!mapRef.current,
      mapStyleLoaded,
      hasGeoJson: !!vietnamGeoJson,
      layersInitialized: mapLayersInitialized
    })
  }, [mapStyleLoaded, vietnamGeoJson, mapLayersInitialized])


  const gridCells = useMemo(() => {
    let cells: GridCell[] = []
    if (activeFrame?.gridPoints?.length) {
      cells = activeFrame.gridPoints
    } else {
      cells = buildVietnamGrid(activeScenario, vietnamGeoJson)
    }
    return cells
  }, [activeFrame, activeScenario, vietnamGeoJson])

  const regionalFeatures = useMemo(() => buildRegionalFeatures(vietnamGeoJson, activeScenario), [activeScenario, vietnamGeoJson])
  const visibleCellCount = regionLayer === 'regions' ? regionalFeatures.length : gridCells.length

  const topPoints = useMemo(
    () => {
      const points =
        regionLayer === 'regions'
          ? regionalFeatures.map((feature) => ({
              id: feature.properties.id,
              name: feature.properties.label,
              names: {
                vi: translations['vi'][feature.properties.id] || feature.properties.label,
                en: translations['en'][feature.properties.id] || feature.properties.label,
                ko: translations['ko'][feature.properties.id] || feature.properties.label,
              },
              value: feature.properties.value,
            }))
          : activeScenario.points

      return [...points]
        .filter(() => true)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    },
    [activeScenario, regionLayer, regionalFeatures],
  )

  const selectedTrendData = useMemo(() => {
    return timeline.map((frame, idx) => {
      const point = frame.points.find((p) => p.id === selectedStationId)
      return {
        value: point?.value ?? 0,
        label: frame.label,
        index: idx,
      }
    })
  }, [timeline, selectedStationId])

  const calloutPoints = useMemo<CalloutPoint[]>(
    () =>
      [...activeScenario.points]
        .filter(() => true)
        .sort((a, b) => b.lat - a.lat)
        .map((point, index) => {
          const layout = CALLOUT_LAYOUTS[point.id] ?? {
            nudgeX: index % 2 ? 16 : -16,
            stemHeight: 42,
          }

          return {
            ...point,
            z: 0,
            offset: [layout.nudgeX, 0],
            ...createCalloutIcon(point, activeScenario, lang),
          }
        }),
    [activeScenario, lang],
  )

  const gridGeoJson = useMemo(() => {
    const cells = regionLayer === 'stations' ? gridCells : []
    const rawGeo = buildGridGeoJson(cells, activeScenario.gridCellSizeMeters)
    
    return {
      ...rawGeo,
      features: rawGeo.features.map((f, index) => {
        const cell = cells[index]
        return {
          ...f,
          properties: {
            ...f.properties,
            direction: cell.direction !== undefined ? (cell.direction + 180) % 360 : undefined,
            elevation: getColumnElevationValue(cell, activeScenario),
            color: rgbaToCss(valueToSteppedColor(cell.value, activeScenario.palette, 238)),
          }
        }
      })
    }
  }, [regionLayer, gridCells, activeScenario])

  const regionalFeaturesGeoJson = useMemo(() => {
    const features = regionLayer === 'regions' ? [...regionalFeatures] : []

    if (regionLayer === 'regions') {
      const hoangsaPt = activeScenario.points.find((p) => p.id === 'hoangsa')
      const truongsaPt = activeScenario.points.find((p) => p.id === 'truongsa')

      const R = activeScenario.gridCellSizeMeters * 0.38
      const D_lat = 111120

      if (hoangsaPt) {
        const cosLat = Math.cos((hoangsaPt.lat * Math.PI) / 180)
        const dLat = R / D_lat
        const dLon = R / (D_lat * cosLat)
        const poly = [
          [hoangsaPt.lon - dLon, hoangsaPt.lat + dLat],
          [hoangsaPt.lon + dLon, hoangsaPt.lat + dLat],
          [hoangsaPt.lon + dLon, hoangsaPt.lat - dLat],
          [hoangsaPt.lon - dLon, hoangsaPt.lat - dLat],
          [hoangsaPt.lon - dLon, hoangsaPt.lat + dLat]
        ]
        features.push({
          type: 'Feature',
          properties: {
            id: 'hoangsa',
            label: 'Quần đảo Hoàng Sa',
            value: hoangsaPt.value,
            lon: hoangsaPt.lon,
            lat: hoangsaPt.lat,
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[poly as [number, number][]]]
          }
        } as any)
      }

      if (truongsaPt) {
        const cosLat = Math.cos((truongsaPt.lat * Math.PI) / 180)
        const dLat = R / D_lat
        const dLon = R / (D_lat * cosLat)
        const poly = [
          [truongsaPt.lon - dLon, truongsaPt.lat + dLat],
          [truongsaPt.lon + dLon, truongsaPt.lat + dLat],
          [truongsaPt.lon + dLon, truongsaPt.lat - dLat],
          [truongsaPt.lon - dLon, truongsaPt.lat - dLat],
          [truongsaPt.lon - dLon, truongsaPt.lat + dLat]
        ]
        features.push({
          type: 'Feature',
          properties: {
            id: 'truongsa',
            label: 'Quần đảo Trường Sa',
            value: truongsaPt.value,
            lon: truongsaPt.lon,
            lat: truongsaPt.lat,
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[poly as [number, number][]]]
          }
        } as any)
      }
    }

    return {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          elevation: getRegionalElevationValue(f.properties.value, activeScenario),
          color: rgbaToCss(valueToSteppedColor(f.properties.value, activeScenario.palette, 218)),
        },
      })),
    }
  }, [regionLayer, regionalFeatures, activeScenario])

  const regionalLabelsGeoJson = useMemo(() => {
    const features = overlayVisibility.provinceLabels && regionLayer === 'regions' ? [...regionalFeatures] : []

    if (regionLayer === 'regions') {
      const hoangsaPt = activeScenario.points.find((p) => p.id === 'hoangsa')
      const truongsaPt = activeScenario.points.find((p) => p.id === 'truongsa')

      if (hoangsaPt && !features.some((f) => f.properties.id === 'hoangsa')) {
        features.push({
          properties: {
            id: 'hoangsa',
            label: 'Hoàng Sa',
            value: hoangsaPt.value,
            lon: hoangsaPt.lon,
            lat: hoangsaPt.lat,
          },
        } as any)
      }
      if (truongsaPt && !features.some((f) => f.properties.id === 'truongsa')) {
        features.push({
          properties: {
            id: 'truongsa',
            label: 'Trường Sa',
            value: truongsaPt.value,
            lon: truongsaPt.lon,
            lat: truongsaPt.lat,
          },
        } as any)
      }
    }

    return {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [f.properties.lon, f.properties.lat, 0],
        },
        properties: {
          id: f.properties.id,
          text: `${translations[lang][f.properties.id] || f.properties.label} ${formatPointValue(f.properties.value)}${activeScenario.unit}`,
        },
      })),
    }
  }, [overlayVisibility.provinceLabels, regionLayer, regionalFeatures, activeScenario, lang])

  const initialTriggerRef = useRef(false)
  useEffect(() => {
    if (mapLayersInitialized && !initialTriggerRef.current) {
      initialTriggerRef.current = true
      setRefreshNonce((n) => n + 1)
    }
  }, [mapLayersInitialized])

  const typhoonGeoJson = useMemo(() => {
    if (scenarioId !== 'typhoon' || regionLayer !== 'stations' || selectedTyphoonId === 'live') {
      return {
        type: 'FeatureCollection',
        features: [],
      }
    }

    const data = typhoonData.pathData
    const features: any[] = []

    if (data.history && data.history.length > 1) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: data.history,
        },
        properties: {
          type: 'history-path',
        },
      })
    }

    if (data.forecast && data.forecast.length > 0) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [data.currentCenter, ...data.forecast],
        },
        properties: {
          type: 'forecast-path',
        },
      })
    }

    if (data.cones) {
      for (const cone of data.cones) {
        features.push({
          ...createGeoJsonCircle(cone.center, cone.radiusKm),
          properties: {
            type: 'error-cone',
          },
        })
      }
    }

    if (typhoonData.windRadius > 0) {
      features.push({
        ...createGeoJsonCircle(data.currentCenter, typhoonData.windRadius),
        properties: {
          type: 'wind-radius-circle',
        },
      })
    }

    const typhoon = historicalTyphoons.find(t => t.id === selectedTyphoonId) || historicalTyphoons[0]
    const frameIdx = frameIndex < typhoon.points.length ? frameIndex : 0

    const allPoints = [
      ...typhoon.points.slice(0, frameIdx + 1).map((p, idx) => ({ ...p, isForecast: false, index: idx })),
      ...typhoon.points.slice(frameIdx + 1).map((p, idx) => ({ ...p, isForecast: true, index: frameIdx + 1 + idx }))
    ]

    for (const pt of allPoints) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pt.lon, pt.lat]
        },
        properties: {
          type: 'track-point',
          isForecast: pt.isForecast,
          isCurrent: pt.index === frameIdx,
          wind: pt.wind,
          pressure: pt.pressure,
          timeLabel: pt.timeLabel,
          color: pt.wind < 17 ? '#4db6ac' : 
                 pt.wind < 25 ? '#ffd54f' : 
                 pt.wind < 33 ? '#ff9800' : 
                 pt.wind < 50 ? '#ff1744' : '#d500f9',
          label: `${pt.wind}m/s`
        }
      })
    }

    const typhoonNameTranslated = typhoon.name[lang] || typhoon.name.en
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: data.currentCenter,
      },
      properties: {
        type: 'eye-point',
        name: typhoonNameTranslated,
        details: `${typhoonData.wind} m/s | ${typhoonData.pressure} hPa`,
      },
    })

    return {
      type: 'FeatureCollection',
      features,
    }
  }, [scenarioId, typhoonData, regionLayer, lang, selectedTyphoonId, frameIndex])

  const calloutPinsGeoJson = useMemo(() => {
    const points = (overlayVisibility.callouts && regionLayer === 'stations') ? calloutPoints : []
    return {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lon, p.lat, 0],
        },
        properties: {
          id: p.id,
          name: p.name,
          value: p.value,
        },
      })),
    }
  }, [overlayVisibility.callouts, calloutPoints, regionLayer])

  useEffect(() => {
    fetch('/data/vietnam-provinces.geojson')
      .then((response) => response.json())
      .then((data: VietnamGeoJson) => setVietnamGeoJson(data))
      .catch(() => setVietnamGeoJson(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const requestId = (requestSeqRef.current += 1)

    if (scenario.id === 'typhoon') {
      setFrameIndex(0)
      setTimeline(generateTyphoonTimeline(selectedTyphoonId, lang))
      setDataStatus({ key: 'status_ai_forecast' })
      return
    }

    if (!scenario.vhwisCategory) {
      setFrameIndex(0)
      setTimeline(generateMockTimeline(scenario, lang))
      setDataStatus({ key: 'status_ai_forecast' })
      return
    }

    loadWeatherTimeline(scenario, controller.signal, {
      forceRefresh: refreshNonce > 0,
    })
      .then((payload) => {
        if (cancelled || requestId !== requestSeqRef.current || payload.scenarioId !== scenario.id) {
          return
        }

        setFrameIndex(0)
        setTimeline(payload.frames.length > 1 ? payload.frames : generateMockTimeline(scenario, lang))
        setColumnReveal(1)
        setDataStatus({
          key: payload.cacheHit ? 'status_cache_hit' : 'status_cache_update',
          arg: payload.successfulPoints,
        })
      })
      .catch(() => {
        if (cancelled || requestId !== requestSeqRef.current) {
          return
        }

        setTimeline(generateMockTimeline(scenario, lang))
        setColumnReveal(1)
        setDataStatus({ key: 'status_api_fail' })
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [scenario, refreshNonce, lang, selectedTyphoonId])

  // Global security listener: prevent right click, copy, cut, and track right mouse state
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDownRef.current = true
      }
    }
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDownRef.current = false
      }
    }
    const preventDefaultAction = (e: Event) => {
      e.preventDefault()
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('contextmenu', preventDefaultAction)
    window.addEventListener('copy', preventDefaultAction)
    window.addEventListener('cut', preventDefaultAction)
    window.addEventListener('dragstart', preventDefaultAction)
    window.addEventListener('selectstart', preventDefaultAction)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('contextmenu', preventDefaultAction)
      window.removeEventListener('copy', preventDefaultAction)
      window.removeEventListener('cut', preventDefaultAction)
      window.removeEventListener('dragstart', preventDefaultAction)
      window.removeEventListener('selectstart', preventDefaultAction)
    }
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createMapStyle('satellite'),
      center: window.innerWidth <= 768 ? [108.8, 16.0] : [109.5, 15.0],
      zoom: window.innerWidth <= 768 ? 4.1 : 4.8,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      projection: is3DModeRef.current ? { type: 'globe' } : { type: 'mercator' },
    } as any)

    // Smooth and gentle scroll wheel zoom speed
    map.scrollZoom.setWheelZoomRate(1 / 280)

    // setFog shim for MapLibre GL JS v5 (translates Mapbox setFog parameters to MapLibre setSky)
    ;(map as any).setFog = function (options: any) {
      if (!options) return
      const skyOptions: any = {}
      if (options.color) {
        skyOptions['horizon-color'] = options.color
        skyOptions['fog-color'] = options.color
      }
      if (options['high-color']) {
        skyOptions['sky-color'] = options['high-color']
      }
      if (options['horizon-blend'] !== undefined) {
        skyOptions['sky-horizon-blend'] = options['horizon-blend']
      }
      if (typeof map.setSky === 'function') {
        map.setSky(skyOptions)
      } else {
        const style = map.getStyle()
        if (style) {
          style.sky = { ...style.sky, ...skyOptions }
          map.setStyle(style)
        }
      }
    }

    // Re-apply projection, fog and trigger resize when style is loaded
    map.on('style.load', () => {
      try {
        map.setProjection(is3DModeRef.current ? { type: 'globe' } : { type: 'mercator' })
      } catch (e) {
        console.error('Failed to apply projection on style load:', e)
      }
      try {
        ;(map as any).setFog({
          'color': 'rgb(186, 210, 235)',      // 지구 경계선 안쪽 하부 대기
          'high-color': 'rgb(36, 92, 223)',   // 외부 상부 대기 광원 (Atmosphere Glow)
          'horizon-blend': 0.02,              // 대기 광 두께
          'space-color': 'rgb(5, 5, 12)',     // 우주 배경색
          'star-intensity': 0.8               // 배경 별빛 강도
        })
      } catch (e) {
        console.error('Failed to apply fog on style load:', e)
      }
      map.resize()
      setMapStyleLoaded(true)
    })

    map.on('load', () => {
      map.resize()
    })

    // ResizeObserver: 컨테이너 실제 크기 변화에 즉각 반응 (setTimeout보다 정확)
    const containerEl = mapContainerRef.current!
    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerEl)

    // 첫 렌더 프레임에 즉시 resize 적용 (마운트 직후 CSS 레이아웃 완료 시점)
    const rafId = requestAnimationFrame(() => {
      map.resize()
    })

    mapRef.current = map

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(rafId)
      map.remove()
      mapRef.current = null
      setMapStyleLoaded(false)
    }
  }, [])

  useEffect(
    () => () => {
      cameraRunIdRef.current += 1

      if (revealFrameRef.current) {
        cancelAnimationFrame(revealFrameRef.current)
      }

      if (zoomFrameRef.current) {
        cancelAnimationFrame(zoomFrameRef.current)
      }

      mediaRecorderRef.current?.stop()
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    },
    [],
  )

  useEffect(
    () => () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
    },
    [recordingUrl],
  )



  useEffect(() => {
    if (!isTimelinePlaying || timeline.length <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % timeline.length)
    }, 1500)

    return () => window.clearInterval(timer)
  }, [isTimelinePlaying, timeline.length])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    setMapStyleLoaded(false)
    map.setStyle(createMapStyle(mapTheme), { diff: false })
  }, [mapTheme])



  // selectedStationId에 따라 지도 핀 크기 및 색상 강조 적용
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded) return

    try {
      if (map.getLayer('callout-pins-native')) {
        map.setPaintProperty('callout-pins-native', 'circle-radius', [
          'case',
          ['==', ['get', 'id'], selectedStationId],
          6.5,
          3.8,
        ])
        map.setPaintProperty('callout-pins-native', 'circle-color', [
          'case',
          ['==', ['get', 'id'], selectedStationId],
          '#1a75ff',
          '#f8fbff',
        ])
      }
      if (map.getLayer('callout-labels-native')) {
        map.setFilter('callout-labels-native', ['!=', ['get', 'id'], selectedStationId])
      }
      if (map.getLayer('selected-callout-label-native')) {
        map.setFilter('selected-callout-label-native', ['==', ['get', 'id'], selectedStationId])
      }
    } catch (e) {
      console.warn('Failed to update properties for callout layers:', e)
    }
  }, [selectedStationId, mapStyleLoaded])

  // regionLayer 변경 시 차트 레이어 및 핀/말풍선 레이어 visibility 명시적 제어
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded || !mapLayersInitialized) return

    const isStations = regionLayer === 'stations'
    const isWindScenario = ['wind', 'forecast_wind', 'gust', 'typhoon'].includes(scenarioId)
    const calloutVis = (overlayVisibility.callouts && isStations) ? 'visible' : 'none'
    const pinsVis = (overlayVisibility.callouts && isStations && !isWindScenario) ? 'visible' : 'none'
    
    try {
      // 측정지점 격자 기둥: stations 모드에서만 표출
      if (map.getLayer('vhwis-grid-columns-native')) {
        map.setLayoutProperty('vhwis-grid-columns-native', 'visibility', (isStations && !isWindScenario) ? 'visible' : 'none')
      }
      // 광역지역 폴리곤: regions 모드에서만 표출
      if (map.getLayer('regional-polygons-native')) {
        map.setLayoutProperty('regional-polygons-native', 'visibility', isStations ? 'none' : 'visible')
      }
      // 측정지점 핀/말풍선: stations 모드 + callouts 활성화 시만 표출
      if (map.getLayer('callout-pins-native')) {
        map.setLayoutProperty('callout-pins-native', 'visibility', pinsVis)
      }
      if (map.getLayer('callout-labels-native')) {
        map.setLayoutProperty('callout-labels-native', 'visibility', calloutVis)
      }
      if (map.getLayer('selected-callout-label-native')) {
        map.setLayoutProperty('selected-callout-label-native', 'visibility', calloutVis)
      }
    } catch (e) {
      console.warn('Failed to update visibility for map layers:', e)
    }
  }, [regionLayer, overlayVisibility.callouts, mapStyleLoaded, mapLayersInitialized, scenarioId])

  // 지도 핀/배너 클릭 리스너 및 마우스 오버 커서 변경 처리
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded) return

    const handlePinClick = (e: any) => {
      if (e.features && e.features[0]) {
        const id = e.features[0].properties?.id
        if (id) {
          setSelectedStationId(id)
        }
      }
    }

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const resetCursor = () => {
      map.getCanvas().style.cursor = ''
    }

    try {
      map.on('click', 'callout-pins-native', handlePinClick)
      map.on('click', 'callout-labels-native', handlePinClick)
      map.on('click', 'selected-callout-label-native', handlePinClick)
      map.on('mouseenter', 'callout-pins-native', setPointerCursor)
      map.on('mouseleave', 'callout-pins-native', resetCursor)
      map.on('mouseenter', 'callout-labels-native', setPointerCursor)
      map.on('mouseleave', 'callout-labels-native', resetCursor)
      map.on('mouseenter', 'selected-callout-label-native', setPointerCursor)
      map.on('mouseleave', 'selected-callout-label-native', resetCursor)
    } catch (e) {
      console.warn('Failed to bind click/hover events to map layers:', e)
    }

    return () => {
      try {
        map.off('click', 'callout-pins-native', handlePinClick)
        map.off('click', 'callout-labels-native', handlePinClick)
        map.off('click', 'selected-callout-label-native', handlePinClick)
        map.off('mouseenter', 'callout-pins-native', setPointerCursor)
        map.off('mouseleave', 'callout-pins-native', resetCursor)
        map.off('mouseenter', 'callout-labels-native', setPointerCursor)
        map.off('mouseleave', 'callout-labels-native', resetCursor)
        map.off('mouseenter', 'selected-callout-label-native', setPointerCursor)
        map.off('mouseleave', 'selected-callout-label-native', resetCursor)
      } catch (e) {
        // Ignore style change teardown errors
      }
    }
  }, [mapStyleLoaded])

  // 1. MapLibre Native 소스 및 레이어 등록 관리
  // vietnamGeoJson이 null이면 buildVietnamGrid가 [] 반환 → 차트 데이터 없음→ 대기 후 실행
  useEffect(() => {
    const map = mapRef.current
    console.log('[DEBUG-INITMAPLAYERS] useEffect triggered. mapExists:', !!map, 'mapStyleLoaded:', mapStyleLoaded, 'hasGeoJson:', !!vietnamGeoJson)
    if (!map || !mapStyleLoaded || !vietnamGeoJson) {
      return
    }

    let retryCount = 0
    let cancelled = false

    setMapLayersInitialized(false)
    const initMapLayers = async () => {
      console.log('[DEBUG-INITMAPLAYERS] Inside initMapLayers async function')
      if (cancelled) return


      // SVG 이미지 사전 로딩 (실패해도 레이어 등록은 계속 진행)
      try {
        const arrowSvgSdf = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2 L20 18 L12 14 L4 18 Z" fill="#ffffff"/></svg>'
        await addSvgImageToMap(map, 'wind-arrow-sdf', arrowSvgSdf, { sdf: true })

        const points = overlayVisibility.callouts ? calloutPoints : []
        for (const point of points) {
          if (cancelled) return
          const imageId = `station-callout-${point.id}`
          const svgContent = decodeURIComponent(point.iconUrl.replace('data:image/svg+xml;charset=utf-8,', ''))
          await addSvgImageToMap(map, imageId, svgContent)
        }
      } catch (svgErr) {
        console.warn('SVG/SDF pre-load failed (non-fatal, continuing):', svgErr)
      }

      try {
        // 1-1. 소스 등록 - 이미 있으면 제거 후 재등록
        const sourcesToAdd = [
          { id: 'vietnam-regions-source', data: regionalFeaturesGeoJson },
          { id: 'vhwis-grid-source', data: gridGeoJson },
          { id: 'callout-pins-source', data: calloutPinsGeoJson },
          { id: 'regional-labels-source', data: regionalLabelsGeoJson },
          { id: 'typhoon-source', data: typhoonGeoJson },
        ]
        for (const { id, data } of sourcesToAdd) {
          if (map.getSource(id)) {
            (map.getSource(id) as maplibregl.GeoJSONSource).setData(data as any)
          } else {
            map.addSource(id, { type: 'geojson', data: data as any })
          }
        }

        // 1-2. 3D 폴리곤 레이어 (fill-extrusion) - regions 모드에서만 표출
        if (!map.getLayer('regional-polygons-native')) {
          map.addLayer({
            id: 'regional-polygons-native',
            type: 'fill-extrusion',
            source: 'vietnam-regions-source',
            layout: {
              'visibility': regionLayer === 'regions' ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-color-transition': { duration: 600, delay: 0 },
              'fill-extrusion-height': ['*', ['get', 'elevation'], columnReveal],
              'fill-extrusion-height-transition': { duration: 600, delay: 0 },
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 1.0,
              'fill-extrusion-vertical-gradient': true,
            },
          })
        }

        // 1-3. 격자 기둥 레이어 (fill-extrusion) - stations 모드에서만 표출
        if (!map.getLayer('vhwis-grid-columns-native')) {
          map.addLayer({
            id: 'vhwis-grid-columns-native',
            type: 'fill-extrusion',
            source: 'vhwis-grid-source',
            layout: {
              'visibility': (regionLayer === 'stations' && (!['wind', 'forecast_wind', 'gust', 'typhoon'].includes(scenarioId) || ['wind', 'forecast_wind', 'gust'].includes(scenarioId) || (scenarioId === 'typhoon' && overlayWind))) ? 'visible' : 'none',
            },
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-color-transition': { duration: 600, delay: 0 },
              'fill-extrusion-height': ['*', ['get', 'elevation'], columnReveal],
              'fill-extrusion-height-transition': { duration: 600, delay: 0 },
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.95,
              'fill-extrusion-vertical-gradient': true,
            },
          })
        }

        // 1-4. 측정지점 핀 레이어 (circle)
        if (!map.getLayer('callout-pins-native')) {
          map.addLayer({
            id: 'callout-pins-native',
            type: 'circle',
            source: 'callout-pins-source',
            paint: {
              'circle-radius': [
                'case',
                ['==', ['get', 'id'], selectedStationId],
                6.5,
                3.8,
              ],
              'circle-color': [
                'case',
                ['==', ['get', 'id'], selectedStationId],
                '#1a75ff',
                '#f8fbff',
              ],
              'circle-stroke-width': 1.8,
              'circle-stroke-color': '#111820',
            },
          })
        }

        // 1-5. 말풍선 아이콘 레이어 (symbol) - 선택되지 않은 지점들 (서로 겹치지 않게 처리)
        if (!map.getLayer('callout-labels-native')) {
          map.addLayer({
            id: 'callout-labels-native',
            type: 'symbol',
            source: 'callout-pins-source',
            filter: ['!=', ['get', 'id'], selectedStationId],
            layout: {
              'icon-image': ['concat', 'station-callout-', ['get', 'id']],
              'icon-size': window.innerWidth <= 768 ? 0.82 : 1.0,
              'icon-anchor': 'bottom',
              'icon-offset': [0, -4],
              'icon-allow-overlap': false,
              'icon-ignore-placement': false,
            },
          })
        }

        // 1-5-selected. 선택된 지점용 말풍선 레이어 (항상 맨 위에 표시 및 겹침 무조건 허용)
        if (!map.getLayer('selected-callout-label-native')) {
          map.addLayer({
            id: 'selected-callout-label-native',
            type: 'symbol',
            source: 'callout-pins-source',
            filter: ['==', ['get', 'id'], selectedStationId],
            layout: {
              'icon-image': ['concat', 'station-callout-', ['get', 'id']],
              'icon-size': window.innerWidth <= 768 ? 0.82 : 1.0,
              'icon-anchor': 'bottom',
              'icon-offset': [0, -4],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
          })
        }

        // 1-6. 광역지역 이름 라벨 레이어 (symbol)
        if (!map.getLayer('regional-labels-native')) {
          map.addLayer({
            id: 'regional-labels-native',
            type: 'symbol',
            source: 'regional-labels-source',
            layout: {
              'text-field': ['get', 'text'],
              'text-size': window.innerWidth <= 768 ? 10.5 : 13.5,
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#f8fbff',
              'text-halo-color': '#050e18',
              'text-halo-width': 1.8,
            },
          })
        }

        // 1-7. 태풍 예측 신뢰 구역(오차반경) 채우기 레이어 (fill)
        if (!map.getLayer('typhoon-cones-fill')) {
          map.addLayer({
            id: 'typhoon-cones-fill',
            type: 'fill',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'error-cone'],
            layout: {
              'visibility': scenarioId === 'typhoon' ? 'visible' : 'none',
            },
            paint: {
              'fill-color': '#ff1744',
              'fill-opacity': 0.12,
            },
          })
        }

        // 1-8. 태풍 예측 신뢰 구역 테두리 레이어 (line)
        if (!map.getLayer('typhoon-cones-outline')) {
          map.addLayer({
            id: 'typhoon-cones-outline',
            type: 'line',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'error-cone'],
            layout: {
              'visibility': scenarioId === 'typhoon' ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#ff1744',
              'line-width': 1.0,
              'line-dasharray': [3, 3],
            },
          })
        }

        // 1-9. 태풍 지나온 경로 레이어 (line)
        if (!map.getLayer('typhoon-history-line')) {
          map.addLayer({
            id: 'typhoon-history-line',
            type: 'line',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'history-path'],
            layout: {
              'visibility': scenarioId === 'typhoon' ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#cfd8dc',
              'line-width': 2.0,
              'line-dasharray': [2, 2],
            },
          })
        }

        // 1-10. 태풍 예상 경로 레이어 (line)
        if (!map.getLayer('typhoon-forecast-line')) {
          map.addLayer({
            id: 'typhoon-forecast-line',
            type: 'line',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'forecast-path'],
            layout: {
              'visibility': scenarioId === 'typhoon' ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#ff1744',
              'line-width': 3.0,
            },
          })
        }

        // 1-11. 태풍 중심(눈) 레이어 (circle)
        if (!map.getLayer('typhoon-eye-circle')) {
          map.addLayer({
            id: 'typhoon-eye-circle',
            type: 'circle',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'eye-point'],
            layout: {
              'visibility': scenarioId === 'typhoon' ? 'visible' : 'none',
            },
            paint: {
              'circle-radius': 9,
              'circle-color': '#ff1744',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2.5,
            },
          })
        }

        // 1-12. 태풍 이름 라벨 레이어 (symbol)
        if (!map.getLayer('typhoon-eye-label')) {
          map.addLayer({
            id: 'typhoon-eye-label',
            type: 'symbol',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'eye-point'],
            layout: {
              'visibility': (scenarioId === 'typhoon' && selectedTyphoonId !== 'live') ? 'visible' : 'none',
              'text-field': ['concat', ['get', 'name'], '\n', ['get', 'details']],
              'text-size': 11.5,
              'text-offset': [0, 2.0],
              'text-anchor': 'top',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#07111b',
              'text-halo-width': 2.0,
            },
          })
        }

        // 1-13. 태풍 물리적 크기 영역 채우기 (fill)
        if (!map.getLayer('typhoon-wind-radius-fill')) {
          map.addLayer({
            id: 'typhoon-wind-radius-fill',
            type: 'fill',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'wind-radius-circle'],
            layout: {
              'visibility': (scenarioId === 'typhoon' && selectedTyphoonId !== 'live') ? 'visible' : 'none',
            },
            paint: {
              'fill-color': '#ff9100',
              'fill-opacity': 0.08,
            },
          })
        }

        // 1-14. 태풍 물리적 크기 테두리 (line)
        if (!map.getLayer('typhoon-wind-radius-outline')) {
          map.addLayer({
            id: 'typhoon-wind-radius-outline',
            type: 'line',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'wind-radius-circle'],
            layout: {
              'visibility': (scenarioId === 'typhoon' && selectedTyphoonId !== 'live') ? 'visible' : 'none',
            },
            paint: {
              'line-color': '#ff9100',
              'line-width': 1.5,
              'line-dasharray': [4, 2],
            },
          })
        }

        // 1-15. 태풍 이동 경로상 관측점들 (circle)
        if (!map.getLayer('typhoon-track-points')) {
          map.addLayer({
            id: 'typhoon-track-points',
            type: 'circle',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'track-point'],
            layout: {
              'visibility': (scenarioId === 'typhoon' && selectedTyphoonId !== 'live') ? 'visible' : 'none',
            },
            paint: {
              'circle-radius': [
                'case',
                ['get', 'isCurrent'], 8,
                4.5
              ],
              'circle-color': ['get', 'color'],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.2,
              'circle-opacity': [
                'case',
                ['get', 'isForecast'], 0.6,
                1.0
              ]
            }
          })
        }

        // 1-16. 태풍 이동 경로상 관측점 세기 라벨 (symbol)
        if (!map.getLayer('typhoon-track-labels')) {
          map.addLayer({
            id: 'typhoon-track-labels',
            type: 'symbol',
            source: 'typhoon-source',
            filter: ['==', ['get', 'type'], 'track-point'],
            layout: {
              'visibility': (scenarioId === 'typhoon' && selectedTyphoonId !== 'live') ? 'visible' : 'none',
              'text-field': ['get', 'label'],
              'text-size': 9,
              'text-offset': [0, -1.2],
              'text-anchor': 'bottom',
              'text-allow-overlap': false,
              'text-ignore-placement': false,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1.5,
            }
          })
        }

        // [CRITICAL FIX] 레이어 등록 직후 최신 GeoJSON 데이터 연속 재주입 (setData 중복 호출이지만 유일한 확실한 방법)
        const gridSourceFinal = map.getSource('vhwis-grid-source') as maplibregl.GeoJSONSource
        if (gridSourceFinal) gridSourceFinal.setData(gridGeoJson as any)

        const regionSourceFinal = map.getSource('vietnam-regions-source') as maplibregl.GeoJSONSource
        if (regionSourceFinal) regionSourceFinal.setData(regionalFeaturesGeoJson as any)

        const typhoonSourceFinal = map.getSource('typhoon-source') as maplibregl.GeoJSONSource
        if (typhoonSourceFinal) typhoonSourceFinal.setData(typhoonGeoJson as any)

        map.triggerRepaint()
        setMapLayersInitialized(true)
        console.log('[Map] Layers initialized successfully.')
      } catch (err) {
        console.error('[Map] Failed to initialize layers, retrying in 200ms...', err)
        if (!cancelled && retryCount < 5) {
          retryCount++
          setTimeout(initMapLayers, 200)
        }
      }
    }

    console.log('[DEBUG-INITMAPLAYERS] Running initMapLayers() immediately (mapStyleLoaded is true)')
    void initMapLayers()

    return () => {
      cancelled = true
    }
  }, [mapStyleLoaded, mapTheme, vietnamGeoJson])


  // 2. GeoJSON 소스 데이터 동적 업데이트 및 말풍선 SVG 갱신
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded || !mapLayersInitialized) {
      return
    }

    const updateSources = () => {
      const regionSource = map.getSource('vietnam-regions-source') as maplibregl.GeoJSONSource
      if (regionSource) {
        regionSource.setData(regionalFeaturesGeoJson as any)
      }

      const gridSource = map.getSource('vhwis-grid-source') as maplibregl.GeoJSONSource
      if (gridSource) {
        gridSource.setData(gridGeoJson as any)
      }

      const pinsSource = map.getSource('callout-pins-source') as maplibregl.GeoJSONSource
      if (pinsSource) {
        pinsSource.setData(calloutPinsGeoJson as any)
      }

      const labelsSource = map.getSource('regional-labels-source') as maplibregl.GeoJSONSource
      if (labelsSource) {
        labelsSource.setData(regionalLabelsGeoJson as any)
      }

      const typhoonSource = map.getSource('typhoon-source') as maplibregl.GeoJSONSource
      if (typhoonSource) {
        typhoonSource.setData(typhoonGeoJson as any)
      }

      const typhoonVisibility = (scenarioId === 'typhoon' && selectedTyphoonId !== 'live') ? 'visible' : 'none'
      const typhoonLayers = [
        'typhoon-cones-fill',
        'typhoon-cones-outline',
        'typhoon-history-line',
        'typhoon-forecast-line',
        'typhoon-eye-circle',
        'typhoon-eye-label',
        'typhoon-wind-radius-fill',
        'typhoon-wind-radius-outline',
        'typhoon-track-points',
        'typhoon-track-labels'
      ]
      for (const layerId of typhoonLayers) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', typhoonVisibility)
        }
      }

      map.triggerRepaint()
    }

    // 2-1. 즉시 데이터 주입
    updateSources()

    // 2-2. 맵 스타일 로딩 직후 타이밍 씹힘 방지를 위한 지연 재확인 주입
    const timer = setTimeout(updateSources, 120)

    // 말풍선 SVG 이미지 업데이트
    const updateImages = async () => {
      const points = overlayVisibility.callouts ? calloutPoints : []
      for (const point of points) {
        const imageId = `station-callout-${point.id}`
        const svgContent = decodeURIComponent(point.iconUrl.replace('data:image/svg+xml;charset=utf-8,', ''))
        await addSvgImageToMap(map, imageId, svgContent)
      }
    }

    updateImages().catch((err) => console.error('Failed to update map station images:', err))

    return () => clearTimeout(timer)
  }, [
    mapStyleLoaded,
    mapLayersInitialized,
    vietnamGeoJson,
    gridGeoJson,
    regionalFeaturesGeoJson,
    regionalLabelsGeoJson,
    calloutPinsGeoJson,
    calloutPoints,
    overlayVisibility.callouts,
    regionLayer,
    typhoonGeoJson,
    scenarioId,
  ])


  const activeScenarioPointsRef = useRef(activeScenario.points)
  const activeScenarioMaxValRef = useRef(activeScenario.maxValue)
  const gridCellsRef = useRef(gridCells)

  useEffect(() => {
    activeScenarioPointsRef.current = activeScenario.points
    activeScenarioMaxValRef.current = activeScenario.maxValue
  }, [activeScenario.points, activeScenario.maxValue])

  useEffect(() => {
    gridCellsRef.current = gridCells
  }, [gridCells])

  // Windy-style particle flow animation loop
  useEffect(() => {
    const canvas = particleCanvasRef.current
    const map = mapRef.current
    if (!canvas || !map) return

    const isWind = ['wind', 'forecast_wind', 'gust'].includes(scenarioId)
    const isTyphoonWind = scenarioId === 'typhoon' && overlayWind
    
    if (!isWind && !isTyphoonWind) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let running = true

    const particleCount = 60
    const particles: Array<{
      lon: number
      lat: number
      life: number
      age: number
      trail: Array<{ lon: number; lat: number }>
      lengthScale: number // 각 입자별 고유 길이/속도 배율 (0.5 ~ 1.3)
    }> = []

    const resizeCanvas = () => {
      const rect = map.getContainer().getBoundingClientRect()
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }
    resizeCanvas()

    const getRandomGridPos = () => {
      const currentGrid = gridCellsRef.current
      if (currentGrid && currentGrid.length > 0) {
        const cell = currentGrid[Math.floor(Math.random() * currentGrid.length)]
        // Small jitter so they spawn smoothly in the administrative area
        const jitterLon = (Math.random() - 0.5) * 0.4
        const jitterLat = (Math.random() - 0.5) * 0.4
        return {
          lon: cell.lon + jitterLon,
          lat: cell.lat + jitterLat
        }
      }
      // Fallback within Vietnam bounds
      return {
        lon: 102 + Math.random() * 8,
        lat: 8 + Math.random() * 15
      }
    }

    const estimateValueLocal = (lon: number, lat: number, points: DisasterPoint[]) => {
      let sumVal = 0
      let sumWeight = 0
      for (const p of points) {
        const dLon = (lon - p.lon) * Math.cos((lat * Math.PI) / 180) * 111
        const dLat = (lat - p.lat) * 111
        const dist = Math.sqrt(dLon * dLon + dLat * dLat)
        const weight = 1 / Math.max(dist, 10.0) ** 2
        sumVal += p.value * weight
        sumWeight += weight
      }
      return sumWeight === 0 ? 0 : sumVal / sumWeight
    }

    const estimateDirectionLocal = (lon: number, lat: number, points: DisasterPoint[]) => {
      let sinSum = 0
      let cosSum = 0
      let weightSum = 0
      for (const p of points) {
        if (p.direction === undefined) continue
        const rad = (p.direction * Math.PI) / 180
        const dLon = (lon - p.lon) * Math.cos((lat * Math.PI) / 180) * 111
        const dLat = (lat - p.lat) * 111
        const dist = Math.sqrt(dLon * dLon + dLat * dLat)
        const weight = 1 / Math.max(dist, 10.0) ** 2
        sinSum += Math.sin(rad) * weight
        cosSum += Math.cos(rad) * weight
        weightSum += weight
      }
      if (weightSum === 0) return 0
      return Math.round((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360
    }

    // Initialize particles in geographic positions inside Vietnam's territory
    for (let i = 0; i < particleCount; i++) {
      const pos = getRandomGridPos()
      const life = 300 + Math.random() * 100
      const lengthScale = 1.0 + Math.random() * 0.2 // 1.0배에서 1.2배 사이의 무작위 배율
      particles.push({
        lon: pos.lon,
        lat: pos.lat,
        life: life,
        age: Math.floor(Math.random() * life), // 초기 나이를 분산하여 주기적 재생성 깜빡임 방지
        trail: [{ lon: pos.lon, lat: pos.lat }],
        lengthScale: lengthScale
      })
    }

    const drawFrame = () => {
      if (!running) return

      try {
        // Clear the canvas completely to redraw all 3D projected trails in real-time
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const points = activeScenarioPointsRef.current
        const maxVal = activeScenarioMaxValRef.current || 25
        const width = canvas.width
        const height = canvas.height
        const zoom = map.getZoom()

        // Calculate degrees per pixel at equator/zoom level to scale geographic speed
        const degPerPixel = 600 / (Math.pow(2, zoom) * 256)

        // Calculate screen-space height offset for 3D altitude effect (18,000m)
        const pitchRad = (map.getPitch() * Math.PI) / 180
        const pixelsPerMeter = (256 * Math.pow(2, zoom)) / 40075000
        const heightOffset = 18000 * pixelsPerMeter * Math.sin(pitchRad)

        // 줌레벨 스케일 보정 계수 (줌 6보다 확대될 시 점진적으로 커지게 함)
        const zoomScale = zoom > 6 ? 1.0 + (zoom - 6) * 0.45 : 1.0

        for (let i = 0; i < particleCount; i++) {
          const p = particles[i]

          // Project particle coordinates to screen space for boundaries checking
          let posScreen = map.project([p.lon, p.lat])

          // Respawn if expired, or went outside the viewport bounds
          if (
            p.age >= p.life ||
            posScreen.x < 0 || posScreen.x > width ||
            posScreen.y < 0 || posScreen.y > height
          ) {
            const newPos = getRandomGridPos()
            p.lon = newPos.lon
            p.lat = newPos.lat
            p.life = 300 + Math.random() * 100
            p.age = 0
            p.trail = [{ lon: p.lon, lat: p.lat }]
            p.lengthScale = 0.5 + Math.random() * 0.8
            posScreen = map.project([p.lon, p.lat])
          }

          const speed = estimateValueLocal(p.lon, p.lat, points)
          const direction = estimateDirectionLocal(p.lon, p.lat, points)

          // Meteorological direction + 180 = Vector direction of movement (wind blows TO)
          const travelAngleRad = ((direction + 180) * Math.PI) / 180
          const cosLat = Math.cos((p.lat * Math.PI) / 180)
          
          // Adjust longitude step for latitude scale
          const dLon = Math.sin(travelAngleRad) / (cosLat > 0.1 ? cosLat : 1)
          const dLat = Math.cos(travelAngleRad)

          // Proportional speed: low wind = 0.08px/frame, high wind = 0.32px/frame
          // 고유 배율(lengthScale)과 줌인 보정 배율(zoomScale)을 결합
          const S = (0.08 + (speed / maxVal) * 0.32) * p.lengthScale * zoomScale
          // Limit step size in degrees per frame to prevent zigzagging at low zoom
          const stepSize = Math.min(0.065, S * degPerPixel)

          p.lon += dLon * stepSize
          p.lat += dLat * stepSize
          p.age++

          p.trail.push({ lon: p.lon, lat: p.lat })
          
          // 각 파티클 개별 길이 배율에 맞춰 꼬리 길이 지정 (기본 40 기준)
          const maxTrailLength = Math.round(40 * p.lengthScale)
          if (p.trail.length > maxTrailLength) {
            p.trail.shift()
          }

          // Draw particle trail projected in 3D using standard map.project and altitude offset
          const points2D: Array<{ x: number, y: number }> = []
          for (let j = 0; j < p.trail.length; j++) {
            const pt = p.trail[j]
            const basePos = map.project([pt.lon, pt.lat])
            points2D.push({
              x: basePos.x,
              y: basePos.y - heightOffset
            })
          }

          // Render the trail as tapered lines
          if (points2D.length > 1) {
            for (let j = 1; j < points2D.length; j++) {
              ctx.beginPath()
              ctx.moveTo(points2D[j - 1].x, points2D[j - 1].y)
              ctx.lineTo(points2D[j].x, points2D[j].y)
              
              const ratio = j / points2D.length
              // Tapered opacity and stroke width for the flowing trail (1/4 of the thick 22.5px size)
              ctx.strokeStyle = `rgba(245, 248, 255, ${ratio * (0.75 + (speed / maxVal) * 0.95)})`
              
              // 줌에 따른 선 굵기 보정 추가
              const zoomWidthScale = zoom > 6 ? 1.0 + (zoom - 6) * 0.1 : 1.0
              ctx.lineWidth = (0.8 + ratio * 3.0) * (0.8 + (speed / maxVal) * 1.2) * zoomWidthScale
              ctx.stroke()
            }
          }
        }
      } catch (err) {
        console.error('Error in wind particle drawing loop:', err)
        running = false
      }

      animationId = requestAnimationFrame(drawFrame)
    }

    const handleMapChange = () => {
      resizeCanvas()
    }

    map.on('move', handleMapChange)
    map.on('zoom', handleMapChange)
    map.on('resize', handleMapChange)

    drawFrame()

    return () => {
      running = false
      cancelAnimationFrame(animationId)
      map.off('move', handleMapChange)
      map.off('zoom', handleMapChange)
      map.off('resize', handleMapChange)
    }
  }, [scenarioId, overlayWind, mapStyleLoaded, mapLayersInitialized])

  // 3. 3D 모드 전환 및 투영법 연동 + 애니메이션(columnReveal) 연동
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded) {
      return
    }

    // 3-1. 프로젝션 전환
    try {
      map.setProjection(is3DMode ? { type: 'globe' } : { type: 'mercator' })
    } catch (e) {
      console.error('Failed to update map projection:', e)
    }

    // 3-2. 레이어의 fill-extrusion-height 갱신
    if (map.getLayer('vhwis-grid-columns-native')) {
      map.setPaintProperty(
        'vhwis-grid-columns-native',
        'fill-extrusion-height',
        ['*', ['get', 'elevation'], columnReveal]
      )
    }

    if (map.getLayer('regional-polygons-native')) {
      map.setPaintProperty(
        'regional-polygons-native',
        'fill-extrusion-height',
        ['*', ['get', 'elevation'], columnReveal]
      )
    }
  }, [mapStyleLoaded, is3DMode, columnReveal])

  const startColumnReveal = () => {
    if (revealFrameRef.current) {
      cancelAnimationFrame(revealFrameRef.current)
    }

    const startedAt = performance.now()
    const duration = 850
    setColumnReveal(0.02)

    const tick = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / duration)
      const eased = progress * progress * (3 - 2 * progress)
      setColumnReveal(eased)

      if (progress < 1) {
        revealFrameRef.current = requestAnimationFrame(tick)
      } else {
        revealFrameRef.current = null
      }
    }

    revealFrameRef.current = requestAnimationFrame(tick)
    window.setTimeout(() => {
      setColumnReveal((value) => (value < 0.98 ? 1 : value))
    }, duration + 180)
  }

  const captureMapThumbnail = (view: Pick<CameraShot, 'center' | 'zoom' | 'pitch' | 'bearing'>, index: number) => {
    const map = mapRef.current

    if (!map) {
      return createCameraThumbnail(view, index)
    }

    try {
      return map.getCanvas().toDataURL('image/jpeg', 0.58)
    } catch {
      return createCameraThumbnail(view, index)
    }
  }

  const addCameraShot = () => {
    const map = mapRef.current

    setCameraShots((items) => {
      if (items.length >= 10) {
        return items
      }

      const center = map?.getCenter()
      const view = {
        center: center ? ([center.lng, center.lat] as [number, number]) : scenario.center,
        zoom: map?.getZoom() ?? scenario.zoom,
        pitch: map?.getPitch() ?? scenario.pitch,
        bearing: map?.getBearing() ?? scenario.bearing,
      }
      const index = items.length

      return [
        ...items,
        {
          id: `camera-${Date.now()}`,
          name: `${index + 1}번`,
          ...view,
          holdSeconds: 1,
          moveSeconds: 1,
          thumbnail: captureMapThumbnail(view, index),
        },
      ]
    })
  }

  const updateCameraShot = (id: string, patch: Partial<CameraShot>) => {
    setCameraShots((items) =>
      items.map((item, index) => {
        if (item.id !== id) {
          return item
        }

        const next = { ...item, ...patch }
        const shouldRefreshThumbnail = 'center' in patch || 'zoom' in patch || 'pitch' in patch || 'bearing' in patch

        return shouldRefreshThumbnail
          ? {
              ...next,
              thumbnail: createCameraThumbnail(next, index),
            }
          : next
      }),
    )
  }

  const updateCameraShotNumber = (id: string, patch: Partial<Pick<CameraShot, 'zoom' | 'pitch' | 'bearing'>>) => {
    setCameraShots((items) =>
      items.map((item, index) => {
        if (item.id !== id) {
          return item
        }

        const next = { ...item, ...patch }

        return {
          ...next,
          thumbnail: createCameraThumbnail(next, index),
        }
      }),
    )
  }

  const updateCameraShotCenter = (id: string, axis: 0 | 1, value: number) => {
    setCameraShots((items) =>
      items.map((item, index) => {
        if (item.id !== id) {
          return item
        }

        const center: [number, number] = [...item.center]
        center[axis] = value
        const next = { ...item, center }

        return {
          ...next,
          thumbnail: createCameraThumbnail(next, index),
        }
      }),
    )
  }

  const moveCameraShot = (dragId: string, targetId: string) => {
    if (dragId === targetId) {
      return
    }

    setCameraShots((items) => {
      const dragIndex = items.findIndex((item) => item.id === dragId)
      const targetIndex = items.findIndex((item) => item.id === targetId)

      if (dragIndex < 0 || targetIndex < 0) {
        return items
      }

      const next = [...items]
      const [dragged] = next.splice(dragIndex, 1)
      next.splice(targetIndex, 0, dragged)
      return next
    })
  }

  const removeCameraShot = (id: string) => {
    setCameraShots((items) => (items.length <= 1 ? items : items.filter((item) => item.id !== id)))
  }

  const goToCameraShot = (shot: CameraShot, duration = 1400) => {
    const map = mapRef.current

    if (!map) {
      return
    }

    map.easeTo({
      center: shot.center,
      zoom: shot.zoom,
      pitch: shot.pitch,
      bearing: shot.bearing,
      duration,
      easing: (t) => t * t * (3 - 2 * t),
    })
  }

  const playCamera = async () => {
    const map = mapRef.current

    setCameraPanelOpen(true)

    if (!map || cameraShots.length === 0) {
      return
    }

    const runId = (cameraRunIdRef.current += 1)

    for (const shot of cameraShots) {
      if (runId !== cameraRunIdRef.current) {
        return
      }

      const moveMs = Math.max(0.4, shot.moveSeconds) * 1000
      goToCameraShot(shot, moveMs)
      await wait(moveMs + 80)

      if (runId !== cameraRunIdRef.current) {
        return
      }

      await wait(Math.max(0, shot.holdSeconds) * 1000)
    }
  }

  const startRecording = async () => {
    setRecordingError('')

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setRecordingError('이 브라우저에서는 화면 녹화를 지원하지 않습니다.')
      return
    }

    try {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
        setRecordingUrl(null)
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30,
        },
        audio: false,
      })
      const recordingFormat = getPreferredRecordingFormat()
      const recorder = new MediaRecorder(stream, { mimeType: recordingFormat.mimeType })

      recordingChunksRef.current = []
      recordingStreamRef.current = stream
      mediaRecorderRef.current = recorder
      setRecordingExtension(recordingFormat.extension)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recordingFormat.mimeType })
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
        setRecordingState('ready')
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
        recordingStreamRef.current = null
        mediaRecorderRef.current = null
      }

      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopRecording()
      })

      recorder.start(250)
      setRecordingState('recording')
    } catch (error) {
      setRecordingState(recordingUrl ? 'ready' : 'idle')
      setRecordingError(error instanceof Error ? error.message : '녹화를 시작하지 못했습니다.')
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      return
    }

    recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    recordingStreamRef.current = null
    setRecordingState(recordingUrl ? 'ready' : 'idle')
  }

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null
      const tagName = element?.tagName?.toLowerCase()

      return tagName === 'input' || tagName === 'textarea' || element?.isContentEditable
    }

    const stopZoom = () => {
      zoomDirectionRef.current = 0

      if (zoomFrameRef.current) {
        cancelAnimationFrame(zoomFrameRef.current)
        zoomFrameRef.current = null
      }
    }

    const startZoom = (direction: number) => {
      const map = mapRef.current

      if (!map) {
        return
      }

      zoomDirectionRef.current = direction

      if (zoomFrameRef.current) {
        return
      }

      let previousTime = performance.now()
      const zoomSpeed = 1.9

      const tick = (time: number) => {
        const activeMap = mapRef.current

        if (!activeMap || zoomDirectionRef.current === 0) {
          zoomFrameRef.current = null
          return
        }

        const deltaSeconds = Math.min(48, time - previousTime) / 1000
        previousTime = time
        activeMap.zoomTo(
          clamp(activeMap.getZoom() + zoomDirectionRef.current * zoomSpeed * deltaSeconds, 3.4, 9.4),
          { duration: 0 },
        )
        zoomFrameRef.current = requestAnimationFrame(tick)
      }

      zoomFrameRef.current = requestAnimationFrame(tick)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S, Ctrl+P, and macOS Cmd+Option+I/J/C/K
      const key = event.key.toLowerCase()
      const ctrlOrCmd = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const alt = event.altKey

      if (event.key === 'F12') {
        event.preventDefault()
        return
      }
      if (ctrlOrCmd && shift && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
        event.preventDefault()
        return
      }
      if (ctrlOrCmd && alt && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
        event.preventDefault()
        return
      }
      if (ctrlOrCmd && key === 'u') {
        event.preventDefault()
        return
      }
      if (ctrlOrCmd && key === 's') {
        event.preventDefault()
        return
      }
      if (ctrlOrCmd && key === 'p') {
        event.preventDefault()
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      const map = mapRef.current

      if (isRightMouseDownRef.current && (key === 'w' || key === 's')) {
        event.preventDefault()
        if (key === 'w') startZoom(1)
        if (key === 's') startZoom(-1)
        return
      }

      if (key === '+' || key === '=') {
        event.preventDefault()
        startZoom(1)
        return
      }

      if (key === '-' || key === '_') {
        event.preventDefault()
        startZoom(-1)
        return
      }

      if (key === 'r') {
        event.preventDefault()

        if (!event.repeat) {
          if (recordingState === 'recording') {
            stopRecording()
          } else {
            void startRecording()
          }
        }

        return
      }

      if (key === 'm') {
        event.preventDefault()

        if (!event.repeat) {
          setShortcutChromeHidden((value) => !value)
        }

        return
      }

      if (event.code === 'Space') {
        event.preventDefault()

        if (!event.repeat && showControls && overlayVisibility.timeline && timeline.length > 1) {
          setIsTimelinePlaying((value) => !value)
        }

        return
      }

      const distance = event.shiftKey ? 50 : 25
      const moves: Record<string, [number, number]> = {
        w: [0, -distance],
        a: [-distance, 0],
        s: [0, distance],
        d: [distance, 0],
      }
      const move = moves[key]

      if (!map || !move) {
        return
      }

      event.preventDefault()
      // globe 모드에서는 panBy+duration이 'Easing around a point is not supported' 경고를 발생시킴
      if (is3DModeRef.current) {
        map.panBy(move)
      } else {
        map.panBy(move, { duration: 160 })
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (
        (zoomDirectionRef.current > 0 && (key === '+' || key === '=' || key === 'w')) ||
        (zoomDirectionRef.current < 0 && (key === '-' || key === '_' || key === 's'))
      ) {
        stopZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      stopZoom()
    }
  }, [overlayVisibility.timeline, recordingState, recordingUrl, scenario.id, showControls, timeline.length])

  const toggleOverlay = (key: OverlayKey) => {
    setOverlayVisibility((value) => ({
      ...value,
      [key]: !value[key],
    }))
  }


  const categories = [
    {
      id: 'observation',
      title: '기상관측정보',
      scenarioIds: ['temperature', 'humidity', 'wind', 'gust', 'pressure', 'rain', 'solar'],
    },
    {
      id: 'forecast',
      title: '기상예측정보',
      scenarioIds: ['forecast_temp', 'forecast_rain', 'forecast_wind', 'forecast_humidity', 'cloud'],
    },
    {
      id: 'danger',
      title: '위험지수정보',
      scenarioIds: ['heat', 'wildfire', 'uv', 'aqi', 'landslide', 'flood', 'drought'],
    },
    {
      id: 'marine',
      title: '해양및재난감시',
      scenarioIds: ['typhoon'],
    },
  ]

  const scenarioIcon = {
    temperature: Thermometer,
    humidity: Droplet,
    wind: Wind,
    gust: Wind,
    pressure: Gauge,
    rain: CloudRain,
    solar: Sun,
    forecast_temp: TrendingUp,
    forecast_rain: CloudRain,
    forecast_wind: Wind,
    forecast_humidity: Droplet,
    cloud: Cloud,
    heat: Thermometer,
    wildfire: Flame,
    uv: SunDim,
    aqi: Activity,
    landslide: AlertTriangle,
    flood: AlertTriangle,
    drought: Flame,
    typhoon: RotateCw,
  }

  // Automatically expand the category containing the active scenario
  useEffect(() => {
    const activeCat = categories.find((cat) => cat.scenarioIds.includes(scenarioId))
    if (activeCat) {
      setExpandedCategories((prev) => ({
        ...prev,
        [activeCat.id]: true,
      }))
    }
  }, [scenarioId])

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  const selectScenario = (nextScenarioId: typeof scenarioId) => {
    if (nextScenarioId === scenarioId) {
      setMobileMenuOpen(false)
      return
    }
    const nextScenario = scenarios.find((item) => item.id === nextScenarioId) ?? scenarios[0]

    setScenarioId(nextScenario.id)
    setFrameIndex(0)
    startColumnReveal()
    setIsTimelinePlaying(false)
    setMobileMenuOpen(false)
    setDataStatus({ key: nextScenario.vhwisCategory ? 'status_checking' : 'status_sample' })
    setTimeline(generateMockTimeline(nextScenario, lang))

    if (!nextScenario.vhwisCategory) {
      return
    }
  }




  return (
    <main className={`broadcast-shell scenario-${scenario.id} map-${mapTheme} lang-${lang} ${!showControls ? 'controls-hidden' : ''}`}>
      <section className="stage" aria-label="재난 시각화 방송 화면">
        <div ref={mapContainerRef} className="map-canvas" />
        <canvas ref={particleCanvasRef} className="wind-particle-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
        <div className="map-vignette" />
        <div className="scanline" />

        {/* Mobile Unified Header */}
        {!shortcutChromeHidden && (
          <header className="mobile-header">
            <button
              type="button"
              className="mobile-header-menu-btn"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
                setMobileBoardOpen(false)
                setMobileMapOptionsOpen(false)
              }}
              title={translations[lang]['scenario_title'] || 'Menu'}
            >
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2H22M2 8H22M2 14H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="mobile-header-center">
              <img src="/vhwis_logo.svg" alt="VHWIS logo" className="mobile-header-logo" />
              <span className="brand-mark mobile-brand-text">VHWIS</span>
            </div>
            <button
              type="button"
              className={`mobile-header-layers-btn ${mobileMapOptionsOpen ? 'active' : ''}`}
              onClick={() => {
                setMobileMapOptionsOpen(!mobileMapOptionsOpen)
                setMobileMenuOpen(false)
                setMobileBoardOpen(false)
              }}
              title={lang === 'ko' ? '레이어' : lang === 'vi' ? 'Lớp bản đồ' : 'Layers'}
            >
              <Layers size={20} />
            </button>
          </header>
        )}

        {overlayVisibility.title && (
          <header className="title-lockup">
            <div className="brand-row">
              <span className="brand-mark">VHWIS</span>
              <span className="brand-sub">WEATHER AI</span>
            </div>
            <div className="headline-row">
              <span className="topic">{scriptText.title}</span>
              <h1>{scriptText.headline}</h1>
            </div>
            <p>{scriptText.subtitle}</p>
          </header>
        )}

        {showControls && !shortcutChromeHidden && (
          <aside className={`scenario-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="기상 시나리오 선택">
            <div className="mobile-drawer-header">
              <h3>{translations[lang]['scenario_title'] || (lang === 'ko' ? '기상 시나리오' : lang === 'vi' ? 'Kịch bản thời tiết' : 'Weather Scenarios')}</h3>
              <button type="button" className="mobile-drawer-close" onClick={() => setMobileMenuOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {categories.map((cat) => {
              const isExpanded = !!expandedCategories[cat.id]
              return (
                <div className="category-group" key={cat.id}>
                  <h3 
                    className="category-title" 
                    onClick={() => toggleCategory(cat.id)}
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      userSelect: 'none'
                    }}
                  >
                    <span>{translations[lang][cat.id] || cat.title}</span>
                    <ChevronDown 
                      size={12} 
                      style={{ 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        opacity: 0.7
                      }} 
                    />
                  </h3>
                  {isExpanded && (
                    <div className="category-tabs">
                      {cat.scenarioIds.map((id) => {
                        const item = scenarios.find((s) => s.id === id)
                        if (!item) return null
                        const Icon = scenarioIcon[id as keyof typeof scenarioIcon]
                        const isActive = id === scenario.id

                        return (
                          <button
                            type="button"
                            className={`scenario-btn ${isActive ? 'active' : ''}`}
                            key={id}
                            onClick={() => selectScenario(id as any)}
                          >
                            <Icon size={13} />
                            <span>{translations[lang][id] || item.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </aside>
        )}

        {overlayVisibility.status && !shortcutChromeHidden && (
          <div className="status-strip">
            <button
              type="button"
              className="status-refresh"
              onClick={() => {
                setIsTimelinePlaying(false)
                setFrameIndex(0)
                setColumnReveal(1)
                setDataStatus({ key: 'status_checking' })
                setRefreshNonce((value) => value + 1)
              }}
              title={translations[lang]['refresh'] || 'Refresh'}
            >
              <RotateCw size={14} />
            </button>
            <div className="language-selector">
              <button
                type="button"
                className={`lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => setLang('vi')}
              >
                VI
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === 'ko' ? 'active' : ''}`}
                onClick={() => setLang('ko')}
              >
                KO
              </button>
            </div>
            <span>{translations[lang]['live_template'] || 'LIVE TEMPLATE'}</span>
            <span>{translateLiveText(activeFrame?.label ?? activeScenario.updatedAt, lang)}</span>
            <span aria-label={lang === 'vi' ? `Trạng thái dữ liệu: ${renderDataStatus()}` : lang === 'en' ? `Data Status: ${renderDataStatus()}` : `데이터 상태: ${renderDataStatus()}`}>{translateLiveText(activeScenario.source, lang)}</span>
            <span>{visibleCellCount.toLocaleString()} {translations[lang]['cells'] || 'cells'}</span>
          </div>
        )}

        {overlayVisibility.rank && !shortcutChromeHidden && (
          activeScenario.id === 'typhoon' ? (
            <aside className={`typhoon-board-panel ${mobileBoardOpen ? 'mobile-open' : ''}`} aria-label={lang === 'ko' ? '태풍 정보 보드' : lang === 'vi' ? 'Thông tin bão' : 'Typhoon Status Board'}>
              <div className="mobile-sheet-drag-handle" />
              <div className="panel-heading">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCw size={15} className="spin-icon" style={{ animation: 'spin 4s linear infinite' }} />
                  <span>
                    {selectedTyphoonId === 'live'
                      ? (lang === 'ko' ? '실시간 태풍 감시' : lang === 'vi' ? 'GIÁM SÁT BÃO LIVE' : 'LIVE TYPHOON MONITORING')
                      : (lang === 'ko' ? '과거 태풍 분석' : lang === 'vi' ? 'PHÂN TÍCH BÃO LỊCH SỬ' : 'HISTORICAL TYPHOON ANALYSIS')}
                  </span>
                </div>
              </div>
              <div className="typhoon-board-body">
                <div className="typhoon-search-board" style={{ borderBottom: '1px solid rgba(255, 23, 68, 0.25)', paddingBottom: '8px', marginBottom: '4px' }}>
                  <div className="typhoon-select-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div className="select-field" style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', fontWeight: 'bold' }}>
                        {lang === 'ko' ? '연도' : lang === 'vi' ? 'Năm' : 'Year'}
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => {
                          const year = Number(e.target.value)
                          setSelectedYear(year)
                          const ofYear = historicalTyphoons.filter(t => t.year === year)
                          if (ofYear.length > 0) {
                            setSelectedTyphoonId(ofYear[0].id)
                            setIsTimelinePlaying(false)
                          }
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.18)',
                          color: '#ffffff',
                          borderRadius: '3px',
                          fontSize: '11px',
                          padding: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={2024} style={{ background: '#0b131e', color: '#fff' }}>2024</option>
                        <option value={2022} style={{ background: '#0b131e', color: '#fff' }}>2022</option>
                        <option value={2020} style={{ background: '#0b131e', color: '#fff' }}>2020</option>
                      </select>
                    </div>

                    <div className="select-field" style={{ flex: 2 }}>
                      <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', fontWeight: 'bold' }}>
                        {lang === 'ko' ? '과거 기록 검색' : lang === 'vi' ? 'Cơ sở dữ liệu bão' : 'Historical Archive'}
                      </label>
                      <select
                        value={selectedTyphoonId === 'live' ? '' : selectedTyphoonId}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedTyphoonId(e.target.value)
                            setIsTimelinePlaying(false)
                          }
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.18)',
                          color: '#ffffff',
                          borderRadius: '3px',
                          fontSize: '11px',
                          padding: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="" disabled style={{ background: '#0b131e', color: '#888' }}>
                          {lang === 'ko' ? '-- 태풍 선택 --' : lang === 'vi' ? '-- Chọn cơn bão --' : '-- Select Typhoon --'}
                        </option>
                        {historicalTyphoons
                          .filter(t => t.year === selectedYear)
                          .map(t => (
                            <option key={t.id} value={t.id} style={{ background: '#0b131e', color: '#fff' }}>
                              {t.name[lang] || t.name.en}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="wind-overlay-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0' }}>
                    <input
                      type="checkbox"
                      id="overlay-wind-checkbox"
                      checked={overlayWind}
                      onChange={(e) => setOverlayWind(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="overlay-wind-checkbox" style={{ fontSize: '11px', color: '#f7f9fc', cursor: 'pointer', fontWeight: 800 }}>
                      {lang === 'ko' ? '바람장 레이어 중첩 표시' : lang === 'vi' ? 'Chồng lớp trường gió' : 'Overlay Wind Layer'}
                    </label>
                  </div>
                </div>

                {selectedTyphoonId === 'live' ? (
                  <div className="typhoon-status-msg" style={{ 
                    background: 'rgba(100, 255, 180, 0.04)', 
                    border: '1px dashed rgba(100, 255, 180, 0.25)', 
                    padding: '12px 10px', 
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginTop: '5px'
                  }}>
                    <div style={{ fontSize: '12.5px', color: '#a3f3d2', fontWeight: 900, marginBottom: '6px' }}>
                      ✔ {lang === 'ko' ? '기상 안정 상태' : lang === 'vi' ? 'Trạng thái thời tiết ổn định' : 'Weather Stable'}
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,248,255,0.78)', lineHeight: 1.45 }}>
                      {lang === 'ko' 
                        ? '현재 베트남 및 감시 해역 내에 활동 중인 실시간 태풍이 없습니다. 분석하고 싶은 과거 기록을 검색해 조회할 수 있습니다.' 
                        : lang === 'vi' 
                        ? 'Hiện tại không có cơn bão nào hoạt động trong vùng biển Việt Nam. Bạn có thể tra cứu bão lịch sử từ thanh tìm kiếm.' 
                        : 'No active typhoons in the monitoring area. You can look up past storm records using the search filter above.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="typhoon-name-row">
                      <h3>{historicalTyphoons.find(t => t.id === selectedTyphoonId)?.name[lang]}</h3>
                      <span className="danger-badge">{historicalTyphoons.find(t => t.id === selectedTyphoonId)?.category[lang]}</span>
                    </div>
                    <div className="typhoon-stats-grid">
                      <div className="typhoon-stat-item">
                        <span className="stat-label">{lang === 'ko' ? '현재 위치' : lang === 'vi' ? 'Vị trí hiện tại' : 'Position'}</span>
                        <span className="stat-value">{typhoonData.lat.toFixed(1)}°N, {typhoonData.lon.toFixed(1)}°E</span>
                      </div>
                      <div className="typhoon-stat-item">
                        <span className="stat-label">{lang === 'ko' ? '중심 기압' : lang === 'vi' ? 'Khí áp trung tâm' : 'Min Pressure'}</span>
                        <span className="stat-value">{typhoonData.pressure} hPa</span>
                      </div>
                      <div className="typhoon-stat-item">
                        <span className="stat-label">{lang === 'ko' ? '최대 풍속' : lang === 'vi' ? 'Gió mạnh nhất' : 'Max Wind'}</span>
                        <span className="stat-value">{typhoonData.wind} m/s</span>
                      </div>
                      <div className="typhoon-stat-item">
                        <span className="stat-label">{lang === 'ko' ? '폭풍 반경' : lang === 'vi' ? 'Bán kính bão' : 'Storm Radius'}</span>
                        <span className="stat-value">{typhoonData.windRadius} km</span>
                      </div>
                      <div className="typhoon-stat-item" style={{ gridColumn: 'span 2' }}>
                        <span className="stat-label">{lang === 'ko' ? '이동 방향 및 속도' : lang === 'vi' ? 'Tốc độ & Hướng di chuyển' : 'Movement'}</span>
                        <span className="stat-value">{typhoonData.dirMovement[lang] || typhoonData.dirMovement.en} {typhoonData.speedMovement} km/h</span>
                      </div>
                    </div>
                    <div className="typhoon-warning-box">
                      <strong>{lang === 'ko' ? '태풍 정보 요약:' : lang === 'vi' ? 'Thông tin tóm tắt:' : 'Typhoon Summary:'}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '10.5px', lineHeight: '1.4', color: 'rgba(244,248,255,0.85)' }}>
                        {historicalTyphoons.find(t => t.id === selectedTyphoonId)?.details[lang]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTyphoonId('live')
                        setIsTimelinePlaying(false)
                      }}
                      style={{
                        width: '100%',
                        background: '#ff1744',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginTop: '4px',
                        textAlign: 'center',
                        transition: 'background 0.2s',
                        boxShadow: '0 4px 10px rgba(255,23,68,0.2)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#d50000')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ff1744')}
                    >
                      ◀ {lang === 'ko' ? '실시간 감시 모드로 복귀' : lang === 'vi' ? 'Trở về giám sát trực tiếp' : 'Return to Live Monitoring'}
                    </button>
                  </>
                )}
              </div>
            </aside>
          ) : (
            <aside className={`rank-panel ${mobileBoardOpen ? 'mobile-open' : ''}`} aria-label={translations[lang]['rank'] || '주요 지점'}>
              <div className="mobile-sheet-drag-handle" />
              <div className="panel-heading">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={15} />
                  <span>{translations[lang][activeScenario.id] || activeScenario.metric}</span>
                </div>
              </div>
              {topPoints.map((point, index) => {
                const valueColor = rgbaToCss(valueToSteppedColor(point.value, activeScenario.palette, 255));
                const valueRange = activeScenario.maxValue - activeScenario.minValue;
                const percent = valueRange > 0 ? ((point.value - activeScenario.minValue) / valueRange) * 100 : 50;
                const clPercent = Math.max(2, Math.min(100, percent));

                const isActive = selectedStationId === point.id;

                return (
                  <div 
                    className={`rank-row-container ${isActive ? 'active' : ''}`} 
                    key={point.id}
                    onClick={() => setSelectedStationId(point.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="rank-row">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <b>{point.names?.[lang] || point.name}</b>
                      <strong style={{ color: valueColor }}>
                        {point.value}
                        <small>{activeScenario.unit}</small>
                      </strong>
                    </div>
                    <div className="rank-bar-bg">
                      <div className="rank-bar-fill" style={{ width: `${clPercent}%`, backgroundColor: valueColor }} />
                    </div>
                  </div>
                );
              })}
            </aside>
          )
        )}

        {showControls && cameraPanelOpen && overlayVisibility.cameraPanel && !shortcutChromeHidden && (
          <aside className="camera-panel" aria-label="카메라 워크 설정">
            <header>
              <div>
                <Camera size={15} />
                <strong>카메라 워크</strong>
              </div>
              <button type="button" onClick={addCameraShot} disabled={cameraShots.length >= 10} title="현재 뷰 저장">
                <Plus size={15} />
              </button>
            </header>
            <p>{cameraShots.length}/10 views</p>
            <div className="camera-shot-list">
              {cameraShots.map((shot, index) => (
                <article
                  className={`camera-shot ${draggingShotId === shot.id ? 'dragging' : ''}`}
                  draggable
                  key={shot.id}
                  onDragStart={(event) => {
                    setDraggingShotId(shot.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', shot.id)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const dragId = event.dataTransfer.getData('text/plain') || draggingShotId

                    if (dragId) {
                      moveCameraShot(dragId, shot.id)
                    }

                    setDraggingShotId(null)
                  }}
                  onDragEnd={() => setDraggingShotId(null)}
                >
                  <button
                    type="button"
                    className="camera-thumb"
                    onClick={() => goToCameraShot(shot)}
                    title={`${shot.name} 위치로 이동`}
                  >
                    <img src={shot.thumbnail} alt="" draggable={false} />
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </button>
                  <div className="camera-shot-fields">
                    <input
                      aria-label="카메라 이름"
                      value={shot.name}
                      onChange={(event) => updateCameraShot(shot.id, { name: event.target.value })}
                    />
                    <label>
                      <span>정지</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={shot.holdSeconds}
                        onChange={(event) => updateCameraShot(shot.id, { holdSeconds: Number(event.target.value) })}
                      />
                      <span>초</span>
                    </label>
                    <label>
                      <span>이동</span>
                      <input
                        type="number"
                        min="0.4"
                        max="12"
                        step="0.1"
                        value={shot.moveSeconds}
                        onChange={(event) => updateCameraShot(shot.id, { moveSeconds: Number(event.target.value) })}
                      />
                      <span>초</span>
                    </label>
                  </div>
                  <div className="camera-shot-settings" aria-label={`${shot.name} camera values`}>
                    <label>
                      <span>경도</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={Number(shot.center[0].toFixed(4))}
                        onChange={(event) => updateCameraShotCenter(shot.id, 0, Number(event.target.value))}
                      />
                    </label>
                    <label>
                      <span>위도</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={Number(shot.center[1].toFixed(4))}
                        onChange={(event) => updateCameraShotCenter(shot.id, 1, Number(event.target.value))}
                      />
                    </label>
                    <label>
                      <span>줌</span>
                      <input
                        type="number"
                        step="0.01"
                        value={Number(shot.zoom.toFixed(2))}
                        onChange={(event) => updateCameraShotNumber(shot.id, { zoom: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>피치</span>
                      <input
                        type="number"
                        step="1"
                        value={Number(shot.pitch.toFixed(1))}
                        onChange={(event) => updateCameraShotNumber(shot.id, { pitch: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>회전</span>
                      <input
                        type="number"
                        step="1"
                        value={Number(shot.bearing.toFixed(1))}
                        onChange={(event) => updateCameraShotNumber(shot.id, { bearing: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                  <button type="button" className="camera-delete" onClick={() => removeCameraShot(shot.id)} title="카메라 삭제">
                    <Minus size={13} />
                  </button>
                </article>
              ))}
            </div>
            <button type="button" className="camera-run" onClick={playCamera}>
              <Play size={13} fill="currentColor" />
              전체 시연
            </button>
            <div className="record-controls" aria-label="녹화 컨트롤">
              <button type="button" onClick={startRecording} disabled={recordingState === 'recording'}>
                <Video size={13} />
                녹화
              </button>
              <button type="button" onClick={stopRecording} disabled={recordingState !== 'recording'}>
                <Square size={12} fill="currentColor" />
                정지
              </button>
              {recordingUrl ? (
                <a href={recordingUrl} download={`kbs-demo-${Date.now()}.${recordingExtension}`}>
                  <Download size={13} />
                  다운로드
                </a>
              ) : (
                <button type="button" disabled>
                  <Download size={13} />
                  다운로드
                </button>
              )}
            </div>
            {recordingError && <small className="recording-error">{recordingError}</small>}
          </aside>
        )}

        {overlayVisibility.legend && (
          <div className={`legend ${isMobile ? 'mobile-vertical' : ''}`} aria-label="범례">
            <div className="legend-labels">
              {legendTicks.map((tick, index) => (
                <span
                  key={`${tick.position}-${tick.label}`}
                  style={
                    isMobile
                      ? {
                          bottom: index === legendTicks.length - 1
                            ? 'calc(100% - 10px)'
                            : `${tick.position}%`,
                          transform:
                            index === 0
                              ? 'translateY(0%)'
                              : index === legendTicks.length - 1
                                ? 'translateY(0%)'
                                : 'translateY(-50%)',
                        }
                      : {
                          left: `${tick.position}%`,
                          transform:
                            index === 0
                              ? 'translateX(0)'
                              : index === legendTicks.length - 1
                                ? 'translateX(-100%)'
                                : 'translateX(-50%)',
                        }
                  }
                >
                  {tick.label}
                </span>
              ))}
            </div>
            <div
              className="legend-ramp"
              style={
                isMobile
                  ? { gridTemplateRows: `repeat(${activeScenario.palette.length}, minmax(0, 1fr))` }
                  : { gridTemplateColumns: `repeat(${activeScenario.palette.length}, minmax(0, 1fr))` }
              }
            >
              {activeScenario.palette.map(([stop, color]) => (
                <i key={stop} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        )}

        {overlayVisibility.panelToggle && !shortcutChromeHidden && !isMobile && (
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setShowControls((value) => !value)}
            title="운영 패널"
          >
            <PanelsTopLeft size={16} />
          </button>
        )}

        {overlayVisibility.rank && !shortcutChromeHidden && !isMobile && (
          <button
            type="button"
            className={`desktop-rank-toggle-btn ${mobileBoardOpen ? 'active' : ''}`}
            onClick={() => setMobileBoardOpen(!mobileBoardOpen)}
            title={
              activeScenario.id === 'typhoon'
                ? (lang === 'ko' ? '태풍 정보' : lang === 'vi' ? 'Thông tin bão' : 'Typhoon Info')
                : (lang === 'ko' ? '순위표' : lang === 'vi' ? 'Bảng xếp hạng' : 'Ranks')
            }
          >
            {activeScenario.id === 'typhoon' ? <Sliders size={14} /> : <BarChart3 size={14} />}
          </button>
        )}

        {(mobileMenuOpen || mobileMapOptionsOpen) && (
          <div 
            className="mobile-drawer-backdrop show" 
            onClick={() => {
              setMobileMenuOpen(false)
              setMobileBoardOpen(false)
              setMobileMapOptionsOpen(false)
            }} 
          />
        )}

        {!shortcutChromeHidden && isMobile && (
          <button 
            type="button" 
            className={`mobile-rank-toggle-btn ${mobileBoardOpen ? 'active' : ''}`}
            onClick={() => {
              setMobileBoardOpen(!mobileBoardOpen)
              setMobileMenuOpen(false)
              setMobileMapOptionsOpen(false)
            }}
            title={
              activeScenario.id === 'typhoon' 
                ? (lang === 'ko' ? '태풍' : lang === 'vi' ? 'Bão' : 'Typhoon')
                : (lang === 'ko' ? '순위' : lang === 'vi' ? 'Bảng xếp hạng' : 'Ranks')
            }
          >
            {activeScenario.id === 'typhoon' ? <Sliders size={14} /> : <BarChart3 size={14} />}
          </button>
        )}

        {/* Mobile Map Options Sheet */}
        {!shortcutChromeHidden && (
          <aside className={`mobile-map-options-sheet ${mobileMapOptionsOpen ? 'mobile-open' : ''}`}>
            <div className="mobile-sheet-drag-handle" />
            <div className="panel-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} />
                <span>{lang === 'ko' ? '지도 및 표시 설정' : lang === 'vi' ? 'Cài đặt bản đồ & hiển thị' : 'Map & Display Options'}</span>
              </div>
              <button type="button" className="mobile-sheet-close" onClick={() => setMobileMapOptionsOpen(false)}>
                <X size={15} />
              </button>
            </div>
            
            <div className="mobile-sheet-body">
              {/* 0. Language Selection */}
              <div className="mobile-option-group">
                <h4>{translations[lang]['languageLabel'] || (lang === 'ko' ? '언어 설정' : lang === 'vi' ? 'Cài đặt ngôn ngữ' : 'Language')}</h4>
                <div className="mobile-capsule-row">
                  <button
                    type="button"
                    className={`mobile-capsule-btn ${lang === 'vi' ? 'active' : ''}`}
                    onClick={() => setLang('vi')}
                  >
                    Tiếng Việt (VI)
                  </button>
                  <button
                    type="button"
                    className={`mobile-capsule-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => setLang('en')}
                  >
                    English (EN)
                  </button>
                  <button
                    type="button"
                    className={`mobile-capsule-btn ${lang === 'ko' ? 'active' : ''}`}
                    onClick={() => setLang('ko')}
                  >
                    한국어 (KO)
                  </button>
                </div>
              </div>
              
              {/* 1. Map Theme Selection */}
              <div className="mobile-option-group">
                <h4>{lang === 'ko' ? '지도 스타일' : lang === 'vi' ? 'Kiểu bản đồ' : 'Map Style'}</h4>
                <div className="mobile-capsule-row">
                  {mapThemes.map((item) => {
                    const transKey = 'style' + item.id.charAt(0).toUpperCase() + item.id.slice(1)
                    const isActive = item.id === mapTheme
                    return (
                      <button
                        type="button"
                        className={`mobile-capsule-btn ${isActive ? 'active' : ''}`}
                        key={item.id}
                        onClick={() => setMapTheme(item.id)}
                      >
                        {translations[lang][transKey] || item.shortLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. 3D Mode Toggle */}
              <div className="mobile-option-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>{lang === 'ko' ? '3D 입체 뷰' : lang === 'vi' ? 'Chế độ 3D' : '3D View Mode'}</h4>
                  <button
                    type="button"
                    className={`mobile-switch-btn ${is3DMode ? 'active' : ''}`}
                    onClick={() => setIs3DMode((v) => !v)}
                  >
                    {is3DMode ? (translations[lang]['view3d'] || 'ON') : (translations[lang]['view2d'] || 'OFF')}
                  </button>
                </div>
              </div>

              {/* 3. Region Zoom Shortcuts */}
              <div className="mobile-option-group">
                <h4>{lang === 'ko' ? '화면 데이터 방식' : lang === 'vi' ? 'Phương thức dữ liệu' : 'Data View'}</h4>
                <div className="mobile-capsule-row">
                  {regionLayers.map((item) => {
                    const isActive = item.id === regionLayer
                    return (
                      <button
                        type="button"
                        className={`mobile-capsule-btn ${isActive ? 'active' : ''}`}
                        key={item.id}
                        onClick={() => setRegionLayer(item.id)}
                      >
                        {translations[lang][item.id] || item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4. Display Overlays Checkboxes */}
              <div className="mobile-option-group">
                <h4>{lang === 'ko' ? '화면 표시 항목' : lang === 'vi' ? 'Lớp hiển thị' : 'Display Overlays'}</h4>
                <div className="mobile-checkbox-list">
                  {overlayOptions.map((item) => (
                    <label className="mobile-checkbox-label" key={item.key}>
                      <span>{translations[lang]['opt_' + item.key] || item.label}</span>
                      <input
                        type="checkbox"
                        checked={overlayVisibility[item.key]}
                        onChange={() => toggleOverlay(item.key)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {showControls && (
          <>
            {overlayVisibility.timeline && timeline.length >= 1 && (
              <div className={`timebar-panel ${isTimebarExpanded ? '' : 'collapsed'}`} aria-label="기상 정보 시간 선택">
                {isMobile && (
                  <button
                    type="button"
                    className="timebar-mobile-refresh"
                    onClick={() => {
                      setIsTimelinePlaying(false)
                      setFrameIndex(0)
                      setColumnReveal(1)
                      setDataStatus({ key: 'status_checking' })
                      setRefreshNonce((value) => value + 1)
                    }}
                    title={translations[lang]['refresh'] || 'Refresh'}
                  >
                    <RotateCw size={13} />
                  </button>
                )}
                {(() => {
                  const totalSteps = timeline.length > 1 ? timeline.length - 1 : 1;
                  const maxInTrend = Math.max(...selectedTrendData.map((d) => d.value), 0);
                  const chartMin = activeScenario.minValue;
                  // Auto-scale vertical axis of the chart if all values are very small (e.g., precipitation < 5mm)
                  // but keep the ceiling capped at the scenario's native maxValue.
                  const chartMax = maxInTrend > chartMin
                    ? Math.min(activeScenario.maxValue, Math.max(maxInTrend * 1.15, chartMin + 1.0))
                    : activeScenario.maxValue;
                  const valRange = chartMax - chartMin;
                  const selectedStation = activeScenario.points.find((p) => p.id === selectedStationId) || activeScenario.points[0];
                  // Top bound 9px, bottom bound 36px, vertical range 27px inside the 42px viewBox
                  const linePath = selectedTrendData
                    .map((item, idx) => {
                      const x = 2 + (idx / totalSteps) * 96;
                      const y = 80 - (valRange > 0 ? (item.value - chartMin) / valRange : 0.5) * 65;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ');
                  const areaPath = linePath ? `${linePath} L 98 100 L 2 100 Z` : '';
                  const activePct = 2 + (activeFrameIndex / totalSteps) * 96;
                  const activeValColor = rgbaToCss(valueToSteppedColor(selectedStation?.value ?? activeScenario.minValue, activeScenario.palette, 255));

                  return (
                    <>
                      <div className="timebar-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 10px', marginBottom: '0px' }}>
                        <span className="selected-station-badge" style={{ 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          color: '#ffffff', 
                          backgroundColor: activeValColor, 
                          padding: '1px 6px', 
                          borderRadius: '3px',
                          border: `1px solid ${activeValColor}`,
                          boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>
                          {selectedStation?.names?.[lang] || selectedStation?.name || (lang === 'vi' ? 'Trạm' : lang === 'en' ? 'Station' : '지점')} {translations[lang]['trendTitle'] || '실시간 추이'}
                        </span>
                      </div>
                      
                      {/* Responsive trend chart wrapper containing background & border */}
                      <div className="trend-chart-wrapper">
                        {/* SVG rendered with preserveAspectRatio="none" to stretch perfectly to 100% width */}
                        <svg className="trend-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={activeValColor} stopOpacity="0.4" />
                              <stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {areaPath && <path d={areaPath} fill="url(#chart-area-grad)" />}
                          {linePath && <path d={linePath} fill="none" stroke={activeValColor} strokeWidth="2" />}
                        </svg>
                        
                        {/* Active vertical dashed line */}
                        <div style={{
                          position: 'absolute',
                          left: `${activePct}%`,
                          top: 0,
                          bottom: 0,
                          width: 0,
                          borderLeft: '1px dashed rgba(255, 255, 255, 0.35)',
                          pointerEvents: 'none',
                          zIndex: 1
                        }} />
                        
                        {/* HTML overlay for dots and value labels to prevent text distortion */}
                        {selectedTrendData.map((item, idx) => {
                          const pctX = 2 + (idx / totalSteps) * 96;
                          const pctY = 80 - (valRange > 0 ? (item.value - chartMin) / valRange : 0.5) * 65;
                          const isActive = idx === activeFrameIndex;
                          
                          return (
                            <div key={idx} style={{
                              position: 'absolute',
                              left: `${pctX}%`,
                              top: `${pctY}%`,
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              zIndex: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}>
                              {/* Value text placed above the dot, with font size matched to time labels */}
                              <span style={{
                                position: 'absolute',
                                bottom: '7px',
                                fontSize: '10px',
                                fontWeight: '800',
                                color: '#ffffff',
                                textShadow: '0 1px 2px #0a121e, -1px -1px 0 #0a121e, 1px -1px 0 #0a121e, -1px 1px 0 #0a121e, 1px 1px 0 #0a121e',
                                whiteSpace: 'nowrap'
                              }}>
                                {item.value}
                              </span>
                              
                              {/* Dot */}
                              <div style={{
                                width: isActive ? '7px' : '4px',
                                height: isActive ? '7px' : '4px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#ffffff' : rgbaToCss(valueToSteppedColor(item.value, activeScenario.palette, 255)),
                                border: '1.5px solid #111820',
                                boxShadow: isActive ? '0 0 6px #ffffff' : 'none'
                              }} />
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Timeline horizontal axis time labels row - aligned outside the chart box */}
                      <div className="timebar-axis-row">
                        {selectedTrendData.map((item, idx) => {
                          const timePart = item.label.match(/\d{2}:\d{2}/)?.[0] || (item.label.includes('누적') ? (lang === 'ko' ? '누적' : lang === 'vi' ? 'Lũy kế' : 'Accum') : item.label);
                          return (
                            <span key={idx} style={{ left: `${2 + (idx / totalSteps) * 96}%` }}>
                              {timePart}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
                <div className="timebar-controls-row">
                  <button
                    type="button"
                    className="timeline-play"
                    disabled={timeline.length <= 1}
                    onClick={() => setIsTimelinePlaying((value) => !value)}
                    title={isTimelinePlaying ? (translations[lang]['timelinePause'] || '타임라인 정지') : (translations[lang]['timelinePlay'] || '타임라인 재생')}
                  >
                    {isTimelinePlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  {(() => {
                    const { local, utc } = formatTimebarLabel(activeFrame?.updatedAt ?? activeScenario.updatedAt);
                    return (
                      <div className="timeline-meta" onClick={handleMetaClick} style={{ cursor: isMobile ? 'pointer' : 'default' }}>
                        <strong>{translateLiveText(activeFrame?.label ?? '샘플', lang)}</strong>
                        {!isMobile && <span>{local} {utc && `| ${utc}`}</span>}
                        {isMobile && showTimebarMetaPopup && (
                          <div className="timeline-meta-popup">
                            <span>{local} {utc && `| ${utc}`}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <input
                    type="range"
                    min={0}
                    max={Math.max(timeline.length - 1, 0)}
                    value={activeFrameIndex}
                    disabled={timeline.length <= 1}
                    onChange={(event) => {
                      setFrameIndex(Number(event.target.value))
                      setColumnReveal(1)
                      setIsTimelinePlaying(false)
                    }}
                  />
                  {!isMobile && <span className="timeline-source">{translateLiveText(activeScenario.source, lang)}</span>}
                  <button
                    type="button"
                    className="timebar-toggle"
                    onClick={() => setIsTimebarExpanded((prev) => !prev)}
                    title={isTimebarExpanded ? "차트 접기" : "차트 펼치기"}
                  >
                    {isTimebarExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>
            )}





            {overlayVisibility.controls && !shortcutChromeHidden && (
            <nav className="control-dock" aria-label="시연 컨트롤">
              <button type="button" className="edit-button" onClick={() => setShowSettings(true)}>
                <Settings size={14} />
                <span>{translations[lang]['settings'] || '설정'}</span>
              </button>
              <button
                type="button"
                className={`edit-button ${is3DMode ? 'active' : ''}`}
                onClick={() => setIs3DMode((value) => !value)}
                title="2D / 3D 입체 지도 전환"
              >
                <Layers size={14} />
                <span>{is3DMode ? (translations[lang]['view3d'] || '3D 뷰') : (translations[lang]['view2d'] || '2D 뷰')}</span>
              </button>
              <div className="dock-divider" />
              <div className="region-tabs">
                {regionLayers.map((item) => (
                  <button
                    type="button"
                    className={item.id === regionLayer ? 'active' : ''}
                    key={item.id}
                    onClick={() => setRegionLayer(item.id)}
                  >
                    <MapPin size={14} />
                    <span>{translations[lang][item.id] || item.label}</span>
                  </button>
                ))}
              </div>
              <div className="dock-divider" />
              <div className="map-style-tabs">
                {mapThemes.map((item) => {
                  const Icon = mapThemeIcon[item.id]
                  const transKey = 'style' + item.id.charAt(0).toUpperCase() + item.id.slice(1)

                  return (
                    <button
                      type="button"
                      className={item.id === mapTheme ? 'active' : ''}
                      key={item.id}
                      onClick={() => setMapTheme(item.id)}
                      title={item.label}
                    >
                      <Icon size={14} />
                      <span>{translations[lang][transKey] || item.shortLabel}</span>
                    </button>
                  )
                })}
              </div>
            </nav>
            )}
          </>
        )}

        {showSettings && (
          <div className="settings-backdrop" role="presentation" onMouseDown={() => setShowSettings(false)}>
            <section
              className="settings-modal"
              aria-label={translations[lang]['settings_title'] || '화면 표시 설정'}
              role="dialog"
              aria-modal="true"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <Settings size={17} />
                  <strong>{translations[lang]['settings_title'] || '화면 표시 설정'}</strong>
                </div>
                <button type="button" onClick={() => setShowSettings(false)} title={translations[lang]['settings_close'] || '닫기'}>
                  <X size={16} />
                </button>
              </header>
              <div className="settings-list">
                {overlayOptions.map((item) => (
                  <label key={item.key}>
                    <span>{translations[lang]['opt_' + item.key] || item.label}</span>
                    <input
                      type="checkbox"
                      checked={overlayVisibility[item.key]}
                      onChange={() => toggleOverlay(item.key)}
                    />
                  </label>
                ))}
              </div>
              <button type="button" className="settings-reset" onClick={() => setOverlayVisibility(defaultOverlayVisibility)}>
                {translations[lang]['settings_reset'] || '전체 표시'}
              </button>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
