import React, { useEffect, useMemo, useRef } from 'react'
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useAppStore } from '../store/useAppStore'
import { scenarios } from '../data/scenarios'
import type { DisasterPoint } from '../data/scenarios'
import { historicalTyphoons } from '../data/typhoons'
import { createMapStyle } from '../data/mapThemes'
import { buildVietnamGrid } from '../utils/vietnamGrid'
import type { GridCell } from '../utils/vietnamGrid'
import { rgbaToCss, valueToSteppedColor } from '../utils/color'
import { translations } from '../data/translations'
import {
  buildRegionalFeatures,
  getHistoricalTyphoonPathData,
  buildGridGeoJson,
  addSvgImageToMap,
  getColumnElevationValue,
  getLinearElevationValue,
  formatPointValue,
  createCalloutIcon,
  CALLOUT_LAYOUTS
} from '../utils/helpers'

type CalloutPoint = DisasterPoint & {
  z: number
  offset: [number, number]
  iconId: string
  iconUrl: string
  iconWidth: number
  iconHeight: number
}

// Local helper functions for typhoon simulation
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

export const MapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Zustand Store values
  const scenarioId = useAppStore((state) => state.scenarioId)
  const selectedStationId = useAppStore((state) => state.selectedStationId)
  const selectedTyphoonId = useAppStore((state) => state.selectedTyphoonId)
  const overlayWind = useAppStore((state) => state.overlayWind)
  const lang = useAppStore((state) => state.lang)
  const mapTheme = useAppStore((state) => state.mapTheme)
  const regionLayer = useAppStore((state) => state.regionLayer)
  const vietnamGeoJson = useAppStore((state) => state.vietnamGeoJson)
  const timeline = useAppStore((state) => state.timeline)
  const frameIndex = useAppStore((state) => state.frameIndex)
  const columnReveal = useAppStore((state) => state.columnReveal)
  const overlayVisibility = useAppStore((state) => state.overlayVisibility)
  const is3DMode = useAppStore((state) => state.is3DMode)
  const mapStyleLoaded = useAppStore((state) => state.mapStyleLoaded)
  const mapLayersInitialized = useAppStore((state) => state.mapLayersInitialized)
  const refreshNonce = useAppStore((state) => state.refreshNonce)

  // Zustand Store actions
  const setMap = useAppStore((state) => state.setMap)
  const setMapStyleLoaded = useAppStore((state) => state.setMapStyleLoaded)
  const setMapLayersInitialized = useAppStore((state) => state.setMapLayersInitialized)
  const setSelectedStationId = useAppStore((state) => state.setSelectedStationId)
  const setRefreshNonce = useAppStore((state) => state.setRefreshNonce)

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )

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

  const activeScenarioPointsRef = useRef(activeScenario.points)
  const activeScenarioMaxValRef = useRef(activeScenario.maxValue)

  useEffect(() => {
    activeScenarioPointsRef.current = activeScenario.points
    activeScenarioMaxValRef.current = activeScenario.maxValue
  }, [activeScenario.points, activeScenario.maxValue])

  const gridCells = useMemo(() => {
    let cells: GridCell[] = []
    if (activeFrame?.gridPoints?.length) {
      cells = activeFrame.gridPoints
    } else {
      cells = buildVietnamGrid(activeScenario, vietnamGeoJson)
    }
    return cells
  }, [activeFrame, activeScenario, vietnamGeoJson])

  const gridCellsRef = useRef(gridCells)
  useEffect(() => {
    gridCellsRef.current = gridCells
  }, [gridCells])

  const regionalFeatures = useMemo(
    () => buildRegionalFeatures(vietnamGeoJson, activeScenario),
    [activeScenario, vietnamGeoJson]
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
        speedMovement: currentPoint.speedMovement || 15,
        dirMovement: currentPoint.dirMovement || { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        windRadius: currentPoint.windRadius || 200,
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

  const calloutPoints = useMemo<CalloutPoint[]>(
    () =>
      [...activeScenario.points]
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
          elevation: getLinearElevationValue(f.properties.value, activeScenario),
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

  // Sync refreshNonce on mount once layers init
  const initialTriggerRef = useRef(false)
  useEffect(() => {
    if (mapLayersInitialized && !initialTriggerRef.current) {
      initialTriggerRef.current = true
      setRefreshNonce(refreshNonce + 1)
    }
  }, [mapLayersInitialized])

  // 1. Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const is3DModeDefault = useAppStore.getState().is3DMode

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createMapStyle('satellite'),
      center: window.innerWidth <= 768 ? [108.8, 16.0] : [109.5, 15.0],
      zoom: window.innerWidth <= 768 ? 4.1 : 4.8,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      projection: is3DModeDefault ? { type: 'globe' } : { type: 'mercator' },
    } as any)

    // Smooth scroll wheel zoom
    map.scrollZoom.setWheelZoomRate(1 / 280)

    // Reduce drag rotation sensitivity (pitch and bearing) to 1/3 of default
    const dragRotate = map.dragRotate as any
    if (dragRotate && dragRotate._mouseRotate) {
      const originalDragMove = dragRotate._mouseRotate.dragMove
      dragRotate._mouseRotate.dragMove = function (e: any, point: any) {
        const result = originalDragMove.call(this, e, point)
        if (result && result.bearingDelta !== undefined) {
          result.bearingDelta /= 3.0
        }
        return result
      }
    }
    if (dragRotate && dragRotate._mousePitch) {
      const originalPitchMove = dragRotate._mousePitch.dragMove
      dragRotate._mousePitch.dragMove = function (e: any, point: any) {
        const result = originalPitchMove.call(this, e, point)
        if (result && result.pitchDelta !== undefined) {
          result.pitchDelta /= 3.0
        }
        return result
      }
    }

    // setFog shim
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

    map.on('style.load', () => {
      const current3D = useAppStore.getState().is3DMode
      try {
        map.setProjection(current3D ? { type: 'globe' } : { type: 'mercator' })
      } catch (e) {
        console.error('Failed to set projection on style load:', e)
      }
      try {
        ;(map as any).setFog({
          'color': 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(5, 5, 12)',
          'star-intensity': 0.8
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

    // ResizeObserver
    const containerEl = mapContainerRef.current!
    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(containerEl)

    const rafId = requestAnimationFrame(() => {
      map.resize()
    })

    mapRef.current = map
    setMap(map)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(rafId)
      map.remove()
      mapRef.current = null
      setMap(null)
      setMapStyleLoaded(false)
    }
  }, [setMap, setMapStyleLoaded])

  // Style change trigger
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    setMapStyleLoaded(false)
    map.setStyle(createMapStyle(mapTheme), { diff: false })
  }, [mapTheme, setMapStyleLoaded])

  // selectedStationId paint styles update
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
      console.warn('Failed to update paint/filter properties for callout layers:', e)
    }
  }, [selectedStationId, mapStyleLoaded])

  // regionLayer / scenarioId visibility updates
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded || !mapLayersInitialized) return

    const isStations = regionLayer === 'stations'
    const isWindScenario = ['wind', 'forecast_wind', 'gust', 'typhoon'].includes(scenarioId)
    const calloutVis = (overlayVisibility.callouts && isStations) ? 'visible' : 'none'
    const pinsVis = (overlayVisibility.callouts && isStations && !isWindScenario) ? 'visible' : 'none'

    try {
      if (map.getLayer('vhwis-grid-columns-native')) {
        map.setLayoutProperty('vhwis-grid-columns-native', 'visibility', (isStations && !isWindScenario) ? 'visible' : 'none')
      }
      if (map.getLayer('regional-polygons-native')) {
        map.setLayoutProperty('regional-polygons-native', 'visibility', isStations ? 'none' : 'visible')
      }
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
      console.warn('Failed to update visibility layout properties for layers:', e)
    }
  }, [regionLayer, overlayVisibility.callouts, mapStyleLoaded, mapLayersInitialized, scenarioId])

  // Click / Hover listener on map station features
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
      console.warn('Failed to bind map interaction events:', e)
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
        // Ignore style teardown errors
      }
    }
  }, [mapStyleLoaded, setSelectedStationId])

  // Sources and Layers registration
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded || !vietnamGeoJson) {
      return
    }

    let retryCount = 0
    let cancelled = false

    setMapLayersInitialized(false)

    const initMapLayers = async () => {
      if (cancelled) return

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
        console.warn('SVG/SDF pre-load failed:', svgErr)
      }

      try {
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

        // regional 3D extrusion layer
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

        // grid column 3D extrusion layer
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

        // pins layer
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

        // callout icons - standard unselected
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

        // callout icons - selected
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

        // regional labels
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

        // typhoon cones fill
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

        // typhoon cones outline
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

        // typhoon history track
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

        // typhoon forecast line
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

        // typhoon center eye
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

        // typhoon center eye labels
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

        // typhoon wind radius circle fill
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

        // typhoon wind radius circle outline
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

        // typhoon points
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

        // typhoon point labels
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

        // Force final update for sources
        const gridSource = map.getSource('vhwis-grid-source') as maplibregl.GeoJSONSource
        if (gridSource) gridSource.setData(gridGeoJson as any)

        const regionSource = map.getSource('vietnam-regions-source') as maplibregl.GeoJSONSource
        if (regionSource) regionSource.setData(regionalFeaturesGeoJson as any)

        const typhoonSource = map.getSource('typhoon-source') as maplibregl.GeoJSONSource
        if (typhoonSource) typhoonSource.setData(typhoonGeoJson as any)

        map.triggerRepaint()
        setMapLayersInitialized(true)
      } catch (err) {
        console.error('Failed to initialize layers, retrying in 200ms...', err)
        if (!cancelled && retryCount < 5) {
          retryCount++
          setTimeout(initMapLayers, 200)
        }
      }
    }

    void initMapLayers()

    return () => {
      cancelled = true
    }
  }, [mapStyleLoaded, mapTheme, vietnamGeoJson, setMapLayersInitialized])

  // Dynamically update GeoJSON data when state changes
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

    updateSources()
    const timer = setTimeout(updateSources, 120)

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
    selectedTyphoonId
  ])

  // 3D Projection toggle and height updates
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyleLoaded) return

    try {
      map.setProjection(is3DMode ? { type: 'globe' } : { type: 'mercator' })
      const isMobile = useAppStore.getState().isMobile
      if (isMobile) {
        map.easeTo({
          pitch: is3DMode ? 45 : 0,
          duration: 800
        })
      }
    } catch (e) {
      console.error('Failed to update projection:', e)
    }

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

  // Windy Particle Flow Loop
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
      lengthScale: number
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
        const jitterLon = (Math.random() - 0.5) * 0.4
        const jitterLat = (Math.random() - 0.5) * 0.4
        return {
          lon: cell.lon + jitterLon,
          lat: cell.lat + jitterLat
        }
      }
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

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const pos = getRandomGridPos()
      const life = 300 + Math.random() * 100
      const lengthScale = 1.0 + Math.random() * 0.2
      particles.push({
        lon: pos.lon,
        lat: pos.lat,
        life: life,
        age: Math.floor(Math.random() * life),
        trail: [{ lon: pos.lon, lat: pos.lat }],
        lengthScale: lengthScale
      })
    }

    const drawFrame = () => {
      if (!running) return

      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const points = activeScenarioPointsRef.current
        const maxVal = activeScenarioMaxValRef.current || 25
        const width = canvas.width
        const height = canvas.height
        const zoom = map.getZoom()

        const degPerPixel = 600 / (Math.pow(2, zoom) * 256)
        const pitchRad = (map.getPitch() * Math.PI) / 180
        const pixelsPerMeter = (256 * Math.pow(2, zoom)) / 40075000
        const heightOffset = 18000 * pixelsPerMeter * Math.sin(pitchRad)
        const zoomScale = zoom > 6 ? 1.0 + (zoom - 6) * 0.45 : 1.0

        for (let i = 0; i < particleCount; i++) {
          const p = particles[i]
          let posScreen = map.project([p.lon, p.lat])

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

          const travelAngleRad = ((direction + 180) * Math.PI) / 180
          const cosLat = Math.cos((p.lat * Math.PI) / 180)

          const dLon = Math.sin(travelAngleRad) / (cosLat > 0.1 ? cosLat : 1)
          const dLat = Math.cos(travelAngleRad)

          const S = (0.08 + (speed / maxVal) * 0.32) * p.lengthScale * zoomScale
          const stepSize = Math.min(0.065, S * degPerPixel)

          p.lon += dLon * stepSize
          p.lat += dLat * stepSize
          p.age++

          p.trail.push({ lon: p.lon, lat: p.lat })

          const maxTrailLength = Math.round(40 * p.lengthScale)
          if (p.trail.length > maxTrailLength) {
            p.trail.shift()
          }

          const points2D: Array<{ x: number, y: number }> = []
          for (let j = 0; j < p.trail.length; j++) {
            const pt = p.trail[j]
            const basePos = map.project([pt.lon, pt.lat])
            points2D.push({
              x: basePos.x,
              y: basePos.y - heightOffset
            })
          }

          if (points2D.length > 1) {
            for (let j = 1; j < points2D.length; j++) {
              ctx.beginPath()
              ctx.moveTo(points2D[j - 1].x, points2D[j - 1].y)
              ctx.lineTo(points2D[j].x, points2D[j].y)

              const ratio = j / points2D.length
              ctx.strokeStyle = `rgba(245, 248, 255, ${ratio * (0.75 + (speed / maxVal) * 0.95)})`

              const zoomWidthScale = zoom > 6 ? 1.0 + (zoom - 6) * 0.1 : 1.0
              ctx.lineWidth = (0.8 + ratio * 3.0) * (0.8 + (speed / maxVal) * 1.2) * zoomWidthScale
              ctx.stroke()
            }
          }
        }
      } catch (err) {
        console.error('Error drawing particles:', err)
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

  return (
    <>
      <div ref={mapContainerRef} className="map-canvas" />
      <canvas
        ref={particleCanvasRef}
        className="wind-particle-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
    </>
  )
}
