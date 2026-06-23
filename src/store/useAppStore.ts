import { create } from 'zustand'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { DisasterScenario } from '../data/scenarios'
import type { MapThemeId } from '../data/mapThemes'
import type { VietnamGeoJson } from '../utils/vietnamGrid'
import type { VhwisFrame } from '../services/kma'
import type { Language, RegionLayerId, CameraShot, RecordingState, OverlayVisibility, RecordingFormat } from '../types'
import { defaultOverlayVisibility, createDefaultCameraShots } from '../utils/helpers'

let revealFrameId: number | null = null

interface AppState {
  // State variables
  scenarioId: DisasterScenario['id']
  selectedStationId: string
  selectedYear: number
  selectedTyphoonId: string
  overlayWind: boolean
  lang: Language
  mapTheme: MapThemeId
  regionLayer: RegionLayerId
  vietnamGeoJson: VietnamGeoJson | null
  timeline: VhwisFrame[]
  frameIndex: number
  dataStatus: { key: string; arg?: any }
  mapLayersInitialized: boolean
  isTimebarExpanded: boolean
  columnReveal: number
  cameraPanelOpen: boolean
  cameraShots: CameraShot[]
  draggingShotId: string | null
  recordingState: RecordingState
  recordingUrl: string | null
  recordingExtension: RecordingFormat['extension']
  recordingError: string
  showSettings: boolean
  overlayVisibility: OverlayVisibility
  shortcutChromeHidden: boolean
  isTimelinePlaying: boolean
  refreshNonce: number
  showControls: boolean
  mobileMenuOpen: boolean
  mobileBoardOpen: boolean
  mobileMapOptionsOpen: boolean
  isMobile: boolean
  showTimebarMetaPopup: boolean
  is3DMode: boolean
  mapStyleLoaded: boolean
  map: MapLibreMap | null

  // Actions
  setScenarioId: (id: DisasterScenario['id']) => void
  setSelectedStationId: (id: string) => void
  setSelectedYear: (year: number) => void
  setSelectedTyphoonId: (id: string) => void
  setOverlayWind: (val: boolean) => void
  setLang: (lang: Language) => void
  setMapTheme: (theme: MapThemeId) => void
  setRegionLayer: (layer: RegionLayerId) => void
  setVietnamGeoJson: (geo: VietnamGeoJson | null) => void
  setTimeline: (timeline: VhwisFrame[]) => void
  setFrameIndex: (idx: number | ((prev: number) => number)) => void
  setDataStatus: (status: { key: string; arg?: any }) => void
  setMapLayersInitialized: (val: boolean) => void
  setIsTimebarExpanded: (val: boolean) => void
  setColumnReveal: (val: number) => void
  setCameraPanelOpen: (val: boolean) => void
  setCameraShots: (shots: CameraShot[] | ((prev: CameraShot[]) => CameraShot[])) => void
  setDraggingShotId: (id: string | null) => void
  setRecordingState: (state: RecordingState) => void
  setRecordingUrl: (url: string | null) => void
  setRecordingExtension: (ext: RecordingFormat['extension']) => void
  setRecordingError: (err: string) => void
  setShowSettings: (val: boolean) => void
  setOverlayVisibility: (visibility: OverlayVisibility | ((prev: OverlayVisibility) => OverlayVisibility)) => void
  setShortcutChromeHidden: (val: boolean) => void
  setIsTimelinePlaying: (val: boolean) => void
  setRefreshNonce: (nonce: number) => void
  setShowControls: (val: boolean) => void
  setMobileMenuOpen: (val: boolean) => void
  setMobileBoardOpen: (val: boolean) => void
  setMobileMapOptionsOpen: (val: boolean) => void
  setIsMobile: (val: boolean) => void
  setShowTimebarMetaPopup: (val: boolean) => void
  setIs3DMode: (val: boolean | ((prev: boolean) => boolean)) => void
  setMapStyleLoaded: (val: boolean) => void
  setMap: (map: MapLibreMap | null) => void
  startColumnReveal: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Default values
  scenarioId: 'temperature',
  selectedStationId: 'hanoi',
  selectedYear: 2024,
  selectedTyphoonId: 'live',
  overlayWind: false,
  lang: 'vi',
  mapTheme: 'satellite',
  regionLayer: 'stations',
  vietnamGeoJson: null,
  timeline: [],
  frameIndex: 0,
  dataStatus: { key: 'status_loading' },
  mapLayersInitialized: false,
  isTimebarExpanded: true,
  columnReveal: 1,
  cameraPanelOpen: false,
  cameraShots: createDefaultCameraShots(),
  draggingShotId: null,
  recordingState: 'idle',
  recordingUrl: null,
  recordingExtension: 'webm',
  recordingError: '',
  showSettings: false,
  overlayVisibility: defaultOverlayVisibility,
  shortcutChromeHidden: false,
  isTimelinePlaying: false,
  refreshNonce: 0,
  showControls: true,
  mobileMenuOpen: false,
  mobileBoardOpen: false,
  mobileMapOptionsOpen: false,
  isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  showTimebarMetaPopup: false,
  is3DMode: true,
  mapStyleLoaded: false,
  map: null,

  // Setters
  setScenarioId: (scenarioId) => set({ scenarioId }),
  setSelectedStationId: (selectedStationId) => set({ selectedStationId }),
  setSelectedYear: (selectedYear) => set({ selectedYear }),
  setSelectedTyphoonId: (selectedTyphoonId) => set({ selectedTyphoonId }),
  setOverlayWind: (overlayWind) => set({ overlayWind }),
  setLang: (lang) => set({ lang }),
  setMapTheme: (mapTheme) => set({ mapTheme }),
  setRegionLayer: (regionLayer) => set({ regionLayer }),
  setVietnamGeoJson: (vietnamGeoJson) => set({ vietnamGeoJson }),
  setTimeline: (timeline) => set({ timeline }),
  setFrameIndex: (idx) => set((state) => ({
    frameIndex: typeof idx === 'function' ? idx(state.frameIndex) : idx
  })),
  setDataStatus: (dataStatus) => set({ dataStatus }),
  setMapLayersInitialized: (mapLayersInitialized) => set({ mapLayersInitialized }),
  setIsTimebarExpanded: (isTimebarExpanded) => set({ isTimebarExpanded }),
  setColumnReveal: (columnReveal) => set({ columnReveal }),
  setCameraPanelOpen: (cameraPanelOpen) => set({ cameraPanelOpen }),
  setCameraShots: (shots) => set((state) => ({
    cameraShots: typeof shots === 'function' ? shots(state.cameraShots) : shots
  })),
  setDraggingShotId: (draggingShotId) => set({ draggingShotId }),
  setRecordingState: (recordingState) => set({ recordingState }),
  setRecordingUrl: (recordingUrl) => set({ recordingUrl }),
  setRecordingExtension: (recordingExtension) => set({ recordingExtension }),
  setRecordingError: (recordingError) => set({ recordingError }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setOverlayVisibility: (visibility) => set((state) => ({
    overlayVisibility: typeof visibility === 'function' ? visibility(state.overlayVisibility) : visibility
  })),
  setShortcutChromeHidden: (shortcutChromeHidden) => set({ shortcutChromeHidden }),
  setIsTimelinePlaying: (isTimelinePlaying) => set({ isTimelinePlaying }),
  setRefreshNonce: (refreshNonce) => set({ refreshNonce }),
  setShowControls: (showControls) => set({ showControls }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  setMobileBoardOpen: (mobileBoardOpen) => set({ mobileBoardOpen }),
  setMobileMapOptionsOpen: (mobileMapOptionsOpen) => set({ mobileMapOptionsOpen }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setShowTimebarMetaPopup: (showTimebarMetaPopup) => set({ showTimebarMetaPopup }),
  setIs3DMode: (is3DMode) => set((state) => ({
    is3DMode: typeof is3DMode === 'function' ? is3DMode(state.is3DMode) : is3DMode
  })),
  setMapStyleLoaded: (mapStyleLoaded) => set({ mapStyleLoaded }),
  setMap: (map) => set({ map }),
  startColumnReveal: () => {
    if (revealFrameId) {
      cancelAnimationFrame(revealFrameId)
    }

    const startedAt = performance.now()
    const duration = 850
    set({ columnReveal: 0.02 })

    const tick = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / duration)
      const eased = progress * progress * (3 - 2 * progress)
      set({ columnReveal: eased })

      if (progress < 1) {
        revealFrameId = requestAnimationFrame(tick)
      } else {
        revealFrameId = null
      }
    }

    revealFrameId = requestAnimationFrame(tick)
    setTimeout(() => {
      set((state) => ({ columnReveal: state.columnReveal < 0.98 ? 1 : state.columnReveal }))
    }, duration + 180)
  }
}))

