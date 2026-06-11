import { standardStations } from '../data/scenarios'
import type { DisasterPoint, DisasterScenario } from '../data/scenarios'
import { historicalTyphoons } from '../data/typhoons'
import type { HistoricalTyphoon } from '../data/typhoons'
import type { VhwisFrame } from '../services/kma'
import type { Language, CameraShot, ScriptText, OverlayVisibility, OverlayKey, RegionalFeature, MultiPolygonCoordinates, PolygonCoordinates, RecordingFormat } from '../types'
import type { VietnamGeoJson, GridCell } from './vietnamGrid'
import { rgbaToCss, valueToSteppedColor } from './color'
import {
  Thermometer,
  Droplet,
  Wind,
  Gauge,
  CloudRain,
  Sun,
  TrendingUp,
  Cloud,
  Flame,
  SunDim,
  Activity,
  AlertTriangle,
  RotateCw
} from 'lucide-react'


export const DEFAULT_MAX_ELEVATION = 80_000
export const RAIN_MAX_ELEVATION = 120_000
export const RAIN_PRIMARY_ELEVATION_VALUE = 40
export const RAIN_PRIMARY_ELEVATION_HEIGHT = 80_000

export type RegionLayerId = 'stations' | 'regions'

export const overlayOptions: Array<{ key: OverlayKey; label: string }> = [
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

export const defaultOverlayVisibility: OverlayVisibility = {
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

export const CALLOUT_LAYOUTS: Record<string, { nudgeX: number; stemHeight: number }> = {
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

export const traditionalRegions = [
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

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getHistoricalTyphoonPathData(typhoon: HistoricalTyphoon, frameIdx: number) {
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

export function generateTyphoonTimeline(typhoonId: string, lang: Language): VhwisFrame[] {
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

export function generateMockTimeline(scenario: DisasterScenario, lang: Language = 'vi'): VhwisFrame[] {
  const now = new Date()
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const timeNow = new Date(utcTime + 7 * 60 * 60 * 1000)
  
  const frames: VhwisFrame[] = []
  
  const hourNow = timeNow.getHours()
  const monthNow = String(timeNow.getMonth() + 1).padStart(2, '0')
  const dayNow = String(timeNow.getDate()).padStart(2, '0')
  
  const hourEpochNow = Math.floor(timeNow.getTime() / 3600000)
  const pointsNow = scenario.points.map((point) => {
    const range = (scenario.maxValue - scenario.minValue) * 0.15
    const stationHash = point.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const scenarioHash = scenario.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const seed = hourEpochNow + stationHash + scenarioHash
    const prngVal = seededRandom(seed) - 0.5
    
    const t = (hourNow - 5) / 24
    const cycle = Math.sin(t * 2 * Math.PI - Math.PI / 2)
    let val = point.value + cycle * range
    val += prngVal * (range * 0.1)
    val = Math.max(scenario.minValue, Math.min(scenario.maxValue, val))
    val = Math.round(val * 10) / 10
    
    let direction = undefined
    if (scenario.id === 'wind' || scenario.id === 'forecast_wind' || scenario.id === 'gust' || scenario.id === 'typhoon') {
      if (point.lat > 19) direction = Math.round((230 + prngVal * 20 + 360) % 360)
      else if (point.lat > 14) direction = Math.round((250 + prngVal * 20 + 360) % 360)
      else direction = Math.round((270 + prngVal * 20 + 360) % 360)
    }
    
    return {
      ...point,
      value: val,
      direction
    }
  })
  
  frames.push({
    id: `mock-now-${hourEpochNow}`,
    label: lang === 'ko' ? `실황 ${String(hourNow).padStart(2, '0')}:00` : lang === 'vi' ? `Thực tế ${String(hourNow).padStart(2, '0')}:00` : `Live ${String(hourNow).padStart(2, '0')}:00`,
    updatedAt: `${timeNow.getFullYear()}.${monthNow}.${dayNow} ${String(hourNow).padStart(2, '0')}:00`,
    source: lang === 'ko' ? '기상 AI 시뮬레이션' : lang === 'vi' ? 'Mô phỏng khí tượng AI' : 'AI Meteorological Simulation',
    points: pointsNow
  })
  
  for (let offset = 1; offset <= 6; offset++) {
    const timeForecast = new Date(timeNow.getTime() + offset * 60 * 60 * 1000)
    const hourFcst = timeForecast.getHours()
    const monthFcst = String(timeForecast.getMonth() + 1).padStart(2, '0')
    const dayFcst = String(timeForecast.getDate()).padStart(2, '0')
    const hourEpochFcst = Math.floor(timeForecast.getTime() / 3600000)
    
    const pointsFcst = scenario.points.map((point) => {
      const range = (scenario.maxValue - scenario.minValue) * 0.15
      const stationHash = point.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const scenarioHash = scenario.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const seed = hourEpochFcst + stationHash + scenarioHash
      const prngVal = seededRandom(seed) - 0.5
      
      const t = (hourFcst - 5) / 24
      const cycle = Math.sin(t * 2 * Math.PI - Math.PI / 2)
      let val = point.value + cycle * range
      val += prngVal * (range * 0.15)
      val = Math.max(scenario.minValue, Math.min(scenario.maxValue, val))
      val = Math.round(val * 10) / 10
      
      let direction = undefined
      if (scenario.id === 'wind' || scenario.id === 'forecast_wind' || scenario.id === 'gust' || scenario.id === 'typhoon') {
        if (point.lat > 19) direction = Math.round((230 + prngVal * 30 + 360) % 360)
        else if (point.lat > 14) direction = Math.round((250 + prngVal * 30 + 360) % 360)
        else direction = Math.round((270 + prngVal * 30 + 360) % 360)
      }
      
      return {
        ...point,
        value: val,
        direction
      }
    })
    
    frames.push({
      id: `mock-fcst-${hourEpochFcst}`,
      label: lang === 'ko' ? `예보 +${offset}h` : lang === 'vi' ? `Dự báo +${offset}h` : `Fcst +${offset}h`,
      updatedAt: `${timeForecast.getFullYear()}.${monthFcst}.${dayFcst} ${String(hourFcst).padStart(2, '0')}:00`,
      source: lang === 'ko' ? '기상 AI 시뮬레이션' : lang === 'vi' ? 'Mô phỏng khí tượng AI' : 'AI Meteorological Simulation',
      points: pointsFcst
    })
  }
  
  return frames
}

export function translateLiveText(text: string | undefined, lang: Language): string {
  if (!text) return ''
  let processed = text.normalize('NFC')
  
  processed = processed.replace(/Open-Meteo/gi, 'CF-VHWIS')
  
  if (processed.includes('실황')) {
    if (lang === 'vi') {
      processed = processed.replace(/실황/g, 'Thực tế')
    } else if (lang === 'en') {
      processed = processed.replace(/실황/g, 'Observed')
    }
  }
  if (processed.includes('예보')) {
    if (lang === 'vi') {
      processed = processed.replace(/예보/g, 'Dự báo')
    } else if (lang === 'en') {
      processed = processed.replace(/예보/g, 'Forecast')
    }
  }
  if (processed.includes('누적')) {
    if (lang === 'vi') {
      processed = processed.replace(/누적/g, 'Lũy kế')
    } else if (lang === 'en') {
      processed = processed.replace(/누적/g, 'Accum')
    }
  }
  return processed
}

export function formatTimebarLabel(updatedAt: string | undefined): { local: string; utc: string } {
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

export function estimateTextWidth(value: string, size: number) {
  return [...value].reduce((sum, char) => {
    const isKoreanOrVietnamese = /[가-힣]/.test(char) || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(char)
    if (isKoreanOrVietnamese) return sum + size * 1.05
    if (char === ' ') return sum + size * 0.5
    return sum + size * 0.7
  }, 0)
}

export function escapeSvgText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function formatPointValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }
  return String(Math.round(value * 10) / 10)
}

export function createLegendTicks(scenario: DisasterScenario) {
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

export function createScriptText(scenario: DisasterScenario): ScriptText {
  return {
    title: scenario.title,
    headline: scenario.headline,
    subtitle: scenario.subtitle,
  }
}

export function createCameraThumbnail(view: Pick<CameraShot, 'center' | 'zoom' | 'pitch' | 'bearing'>, index: number) {
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

export function createDefaultCameraShots(): CameraShot[] {
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

export function createCalloutIcon(point: DisasterPoint, scenario: DisasterScenario, lang: Language) {
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

export const categories = [
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

export const scenarioIcon = {
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

export function removeVietnameseTones(str: string) {
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

export function toMultiPolygonCoordinates(feature: VietnamGeoJson['features'][number]): MultiPolygonCoordinates {
  if (feature.geometry.type === 'Polygon') {
    return [feature.geometry.coordinates as PolygonCoordinates]
  }

  return feature.geometry.coordinates as MultiPolygonCoordinates
}

export function getRegionValue(points: DisasterPoint[], pointIds: string[]) {
  const regionPoints = points.filter((point) => pointIds.includes(point.id))

  if (regionPoints.length === 0) {
    return 0
  }

  return Math.round((regionPoints.reduce((sum, point) => sum + point.value, 0) / regionPoints.length) * 10) / 10
}

export function buildRegionalFeatures(geoJson: VietnamGeoJson | null, scenario: DisasterScenario): RegionalFeature[] {
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

export const addSvgImageToMap = (
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

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

export function getElevationRatio(value: number, scenario: DisasterScenario) {
  const domainSize = scenario.maxValue - scenario.minValue

  if (domainSize <= 0) {
    return 0
  }

  return clamp((value - scenario.minValue) / domainSize)
}

export function getRainElevationValue(value: number, scenario: DisasterScenario) {
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

export function getLinearElevationValue(value: number, scenario: DisasterScenario) {
  if (scenario.id === 'rain' || scenario.id === 'forecast_rain') {
    return getRainElevationValue(value, scenario)
  }

  return getElevationRatio(value, scenario) * DEFAULT_MAX_ELEVATION
}

export function getColumnElevationValue(cell: GridCell, scenario: DisasterScenario) {
  return getLinearElevationValue(cell.value, scenario)
}

export function buildGridGeoJson(cells: GridCell[], cellSizeMeters: number) {
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

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function getPreferredRecordingFormat(): RecordingFormat {
  const candidates: RecordingFormat[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=h264', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ]

  return (
    candidates.find(
      (candidate) =>
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate.mimeType)
    ) ?? candidates[candidates.length - 1]
  )
}
