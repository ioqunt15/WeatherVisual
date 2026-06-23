import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Layers,
  Map as MapIcon,
  MapPin,
  PanelsTopLeft,
  RotateCw,
  Satellite,
  Settings,
  Sliders,
  X,
} from 'lucide-react'
import './App.css'
import { useAppStore } from './store/useAppStore'
import { scenarios } from './data/scenarios'
import { historicalTyphoons } from './data/typhoons'
import { mapThemes } from './data/mapThemes'
import { translations } from './data/translations'
import { loadWeatherTimeline } from './services/kma'
import type { CameraShot, ScriptText, OverlayKey } from './types'
import {
  translateLiveText,
  createCameraThumbnail,
  generateTyphoonTimeline,
  wait,
  clamp,
  getPreferredRecordingFormat,
  buildRegionalFeatures,
  defaultOverlayVisibility,
  overlayOptions
} from './utils/helpers'

// Sub-components
import { Sidebar } from './components/Sidebar'
import { RankPanel } from './components/RankPanel'
import { CameraPanel } from './components/CameraPanel'
import { Legend } from './components/Legend'
import { MobileMapOptions } from './components/MobileMapOptions'
import { Timeline } from './components/Timeline'
import { MapContainer } from './components/MapContainer'

const mapThemeIcon = {
  dark: Layers,
  admin: MapIcon,
  satellite: Satellite,
}

const regionLayers = [
  { id: 'stations' as const, label: '측정지점' },
  { id: 'regions' as const, label: '광역지역' },
]

function App() {
  const requestSeqRef = useRef(0)
  const cameraRunIdRef = useRef(0)
  const zoomFrameRef = useRef<number | null>(null)
  const zoomDirectionRef = useRef(0)
  const isRightMouseDownRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])

  // Zustand Store values
  const scenarioId = useAppStore((state) => state.scenarioId)
  const selectedTyphoonId = useAppStore((state) => state.selectedTyphoonId)
  const lang = useAppStore((state) => state.lang)
  const mapTheme = useAppStore((state) => state.mapTheme)
  const regionLayer = useAppStore((state) => state.regionLayer)
  const vietnamGeoJson = useAppStore((state) => state.vietnamGeoJson)
  const timeline = useAppStore((state) => state.timeline)
  const frameIndex = useAppStore((state) => state.frameIndex)
  const dataStatus = useAppStore((state) => state.dataStatus)
  const cameraShots = useAppStore((state) => state.cameraShots)
  const recordingState = useAppStore((state) => state.recordingState)
  const recordingUrl = useAppStore((state) => state.recordingUrl)
  const showSettings = useAppStore((state) => state.showSettings)
  const overlayVisibility = useAppStore((state) => state.overlayVisibility)
  const shortcutChromeHidden = useAppStore((state) => state.shortcutChromeHidden)
  const isTimelinePlaying = useAppStore((state) => state.isTimelinePlaying)
  const refreshNonce = useAppStore((state) => state.refreshNonce)
  const showControls = useAppStore((state) => state.showControls)
  const mobileMenuOpen = useAppStore((state) => state.mobileMenuOpen)
  const mobileBoardOpen = useAppStore((state) => state.mobileBoardOpen)
  const mobileMapOptionsOpen = useAppStore((state) => state.mobileMapOptionsOpen)
  const isMobile = useAppStore((state) => state.isMobile)
  const is3DMode = useAppStore((state) => state.is3DMode)
  const map = useAppStore((state) => state.map)

  // Zustand Store actions
  const setLang = useAppStore((state) => state.setLang)
  const setMapTheme = useAppStore((state) => state.setMapTheme)
  const setRegionLayer = useAppStore((state) => state.setRegionLayer)
  const setVietnamGeoJson = useAppStore((state) => state.setVietnamGeoJson)
  const setTimeline = useAppStore((state) => state.setTimeline)
  const setFrameIndex = useAppStore((state) => state.setFrameIndex)
  const setDataStatus = useAppStore((state) => state.setDataStatus)
  const setColumnReveal = useAppStore((state) => state.setColumnReveal)
  const setCameraPanelOpen = useAppStore((state) => state.setCameraPanelOpen)
  const setCameraShots = useAppStore((state) => state.setCameraShots)
  const setRecordingState = useAppStore((state) => state.setRecordingState)
  const setRecordingUrl = useAppStore((state) => state.setRecordingUrl)
  const setRecordingExtension = useAppStore((state) => state.setRecordingExtension)
  const setRecordingError = useAppStore((state) => state.setRecordingError)
  const setShowSettings = useAppStore((state) => state.setShowSettings)
  const setOverlayVisibility = useAppStore((state) => state.setOverlayVisibility)
  const setShortcutChromeHidden = useAppStore((state) => state.setShortcutChromeHidden)
  const setIsTimelinePlaying = useAppStore((state) => state.setIsTimelinePlaying)
  const setRefreshNonce = useAppStore((state) => state.setRefreshNonce)
  const setShowControls = useAppStore((state) => state.setShowControls)
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen)
  const setMobileBoardOpen = useAppStore((state) => state.setMobileBoardOpen)
  const setMobileMapOptionsOpen = useAppStore((state) => state.setMobileMapOptionsOpen)
  const setIsMobile = useAppStore((state) => state.setIsMobile)
  const setIs3DMode = useAppStore((state) => state.setIs3DMode)

  const renderDataStatus = () => {
    const { key, arg } = dataStatus
    const template = translations[lang][key] || key
    if (arg !== undefined) {
      return template.replace('{0}', String(arg))
    }
    return template
  }

  const [scriptTexts, setScriptTexts] = useState<Record<string, ScriptText>>(() =>
    scenarios.reduce(
      (texts, item) => ({
        ...texts,
        [item.id]: {
          title: item.title,
          headline: item.headline,
          subtitle: item.subtitle
        },
      }),
      {} as Record<string, ScriptText>,
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
      }, {} as Record<string, ScriptText>)
    })
  }, [lang])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [setIsMobile])

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )

  const scriptText = useMemo(() => {
    const base = scriptTexts[scenario.id] || {
      title: scenario.title,
      headline: scenario.headline,
      subtitle: scenario.subtitle
    }
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
  const hasTimelineData = timeline.length > 0
  const activeScenario = useMemo(
    () => ({
      ...scenario,
      updatedAt: activeFrame?.updatedAt ?? scenario.updatedAt,
      source: activeFrame?.source ?? scenario.source,
      points: hasTimelineData ? (activeFrame?.points ?? scenario.points) : [],
    }),
    [activeFrame, hasTimelineData, scenario],
  )

  const regionalFeatures = useMemo(
    () => buildRegionalFeatures(vietnamGeoJson, activeScenario),
    [activeScenario, vietnamGeoJson]
  )

  const visibleCellCount = hasTimelineData
    ? (regionLayer === 'regions' ? regionalFeatures.length : (activeFrame?.gridPoints?.length || activeScenario.points.length))
    : 0

  // Fetch vietnam GeoJSON on mount
  useEffect(() => {
    fetch('/data/vietnam-provinces.geojson')
      .then((response) => response.json())
      .then((data) => setVietnamGeoJson(data))
      .catch(() => setVietnamGeoJson(null))
  }, [setVietnamGeoJson])

  // Data Loading Trigger
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const requestId = (requestSeqRef.current += 1)

    if (scenario.id === 'typhoon' && selectedTyphoonId !== 'live') {
      setFrameIndex(0)
      setTimeline(generateTyphoonTimeline(selectedTyphoonId, lang))
      setDataStatus({ key: 'status_ai_forecast' })
      return
    }

    const targetScenario = (scenario.id === 'typhoon' && selectedTyphoonId === 'live')
      ? (scenarios.find(s => s.id === 'gust') || scenario)
      : scenario


    loadWeatherTimeline(targetScenario, controller.signal, {
      forceRefresh: refreshNonce > 0,
    })
      .then((payload) => {
        const isScenarioMatch = payload.scenarioId === targetScenario.id
        if (cancelled || requestId !== requestSeqRef.current || !isScenarioMatch) {
          return
        }

        const mappedFrames = payload.frames.map(frame => {
          let source = frame.source
          if (scenario.id === 'typhoon') {
            const isForecast = frame.label.includes('예보') || frame.label.includes('Dự báo') || frame.label.includes('Fcst')
            if (isForecast) {
              source = lang === 'ko' ? 'VHWIS 태풍예측' : lang === 'vi' ? 'Dự báo Bão VHWIS' : 'VHWIS Typhoon Forecast'
            } else {
              source = lang === 'ko' ? 'VHWIS 태풍센터' : lang === 'vi' ? 'Trung tâm Bão VHWIS' : 'VHWIS Typhoon Center'
            }
          }
          return {
            ...frame,
            source
          }
        })

        const isObs = ['temperature', 'humidity', 'wind', 'gust', 'pressure', 'rain', 'solar', 'sst', 'wave'].includes(targetScenario.id)
        const nextTimeline = mappedFrames
        setTimeline(nextTimeline)
        setFrameIndex(isObs && nextTimeline.length > 0 ? nextTimeline.length - 1 : 0)
        setColumnReveal(1)
        setDataStatus(nextTimeline.length > 0
          ? {
              key: payload.cacheHit ? 'status_cache_hit' : 'status_cache_update',
              arg: payload.successfulPoints,
            }
          : { key: 'status_loading' })
      })
      .catch(() => {
        if (cancelled || requestId !== requestSeqRef.current) {
          return
        }

        setTimeline([])
        setFrameIndex(0)
        setColumnReveal(1)
        setDataStatus({ key: 'status_loading' })
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [scenario, refreshNonce, lang, selectedTyphoonId, setFrameIndex, setTimeline, setColumnReveal, setDataStatus])

  // Global security listener
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

  // Camera settings actions and callbacks passed as props to CameraPanel
  const captureMapThumbnail = (view: Pick<CameraShot, 'center' | 'zoom' | 'pitch' | 'bearing'>, index: number) => {
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
    if (!map) return

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
    return () => {
      cameraRunIdRef.current += 1
      if (zoomFrameRef.current) {
        cancelAnimationFrame(zoomFrameRef.current)
      }
      mediaRecorderRef.current?.stop()
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
    }
  }, [recordingUrl])

  // Keyboard Shortcuts Setup
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
      if (!map) return

      zoomDirectionRef.current = direction

      if (zoomFrameRef.current) {
        return
      }

      let previousTime = performance.now()
      const zoomSpeed = 1.9

      const tick = (time: number) => {
        if (!map || zoomDirectionRef.current === 0) {
          zoomFrameRef.current = null
          return
        }

        const deltaSeconds = Math.min(48, time - previousTime) / 1000
        previousTime = time
        map.zoomTo(
          clamp(map.getZoom() + zoomDirectionRef.current * zoomSpeed * deltaSeconds, 3.4, 9.4),
          { duration: 0 },
        )
        zoomFrameRef.current = requestAnimationFrame(tick)
      }

      zoomFrameRef.current = requestAnimationFrame(tick)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
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
          setShortcutChromeHidden(!shortcutChromeHidden)
        }
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        if (!event.repeat && showControls && overlayVisibility.timeline && timeline.length > 1) {
          setIsTimelinePlaying(!isTimelinePlaying)
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
      if (is3DMode) {
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
  }, [map, recordingState, recordingUrl, shortcutChromeHidden, isTimelinePlaying, timeline, showControls, overlayVisibility.timeline, is3DMode])

  const toggleOverlay = (key: OverlayKey) => {
    setOverlayVisibility({
      ...overlayVisibility,
      [key]: !overlayVisibility[key],
    })
  }

  // Automatically expand correct accordion category
  useEffect(() => {
    const categories = [
      { id: 'observation', scenarioIds: ['temperature', 'humidity', 'wind', 'gust', 'pressure', 'rain', 'solar'] },
      { id: 'forecast', scenarioIds: ['forecast_temp', 'forecast_rain', 'forecast_wind', 'forecast_humidity', 'cloud'] },
      { id: 'danger', scenarioIds: ['heat', 'wildfire', 'uv', 'aqi', 'landslide', 'flood', 'drought'] },
      { id: 'marine', scenarioIds: ['typhoon'] },
    ]
    const activeCat = categories.find((cat) => cat.scenarioIds.includes(scenarioId))
    if (activeCat) {
      // Accordion is now component-level local state inside Sidebar
    }
  }, [scenarioId])

  return (
    <main className={`broadcast-shell scenario-${scenario.id} map-${mapTheme} lang-${lang} ${!showControls ? 'controls-hidden' : ''}`}>
      <section className="stage" aria-label="재난 시각화 방송 화면">
        <MapContainer />
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

        <Sidebar />

        {overlayVisibility.status && !shortcutChromeHidden && (
          <div className="status-strip">
            <button
              type="button"
              className="status-refresh"
              onClick={() => {
                setIsTimelinePlaying(false)
                const isObs = ['temperature', 'humidity', 'wind', 'gust', 'pressure', 'rain', 'solar', 'sst', 'wave'].includes(scenario.id)
                setFrameIndex(isObs ? timeline.length - 1 : 0)
                setColumnReveal(1)
                setDataStatus({ key: 'status_checking' })
                setRefreshNonce(refreshNonce + 1)
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

        <RankPanel />

        <CameraPanel
          addCameraShot={addCameraShot}
          goToCameraShot={goToCameraShot}
          updateCameraShot={updateCameraShot}
          updateCameraShotCenter={updateCameraShotCenter}
          updateCameraShotNumber={updateCameraShotNumber}
          removeCameraShot={removeCameraShot}
          moveCameraShot={moveCameraShot}
          playCamera={playCamera}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />

        <Legend />

        {overlayVisibility.panelToggle && !shortcutChromeHidden && !isMobile && (
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setShowControls(!showControls)}
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

        <MobileMapOptions />

        <Timeline />

        {showControls && (
          <>
            {overlayVisibility.controls && !shortcutChromeHidden && (
            <nav className="control-dock" aria-label="시연 컨트롤">
              <button type="button" className="edit-button" onClick={() => setShowSettings(true)}>
                <Settings size={14} />
                <span>{translations[lang]['settings'] || '설정'}</span>
              </button>
              <button
                type="button"
                className={`edit-button ${is3DMode ? 'active' : ''}`}
                onClick={() => setIs3DMode(!is3DMode)}
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
