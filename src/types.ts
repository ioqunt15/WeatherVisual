export type Language = 'vi' | 'en' | 'ko'
export type RegionLayerId = 'stations' | 'regions'

export type Coordinate = [number, number]
export type PolygonCoordinates = Coordinate[][]
export type MultiPolygonCoordinates = PolygonCoordinates[]

export type RegionalFeature = {
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


export type ScriptText = {
  title: string
  headline: string
  subtitle: string
}

export type CameraShot = {
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

export type RecordingState = 'idle' | 'recording' | 'ready'

export type RecordingFormat = {
  mimeType: string
  extension: 'mp4' | 'webm'
}

export type OverlayKey =
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

export type OverlayVisibility = Record<OverlayKey, boolean>
