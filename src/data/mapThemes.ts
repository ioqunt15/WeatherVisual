import type { StyleSpecification } from 'maplibre-gl'

export type MapThemeId = 'dark' | 'admin' | 'satellite'

export type MapTheme = {
  id: MapThemeId
  label: string
  shortLabel: string
}

export const mapThemes: MapTheme[] = [
  { id: 'dark', label: '보정 다크 지도', shortLabel: '다크' },
  { id: 'admin', label: '행정구역 지도', shortLabel: '행정' },
  { id: 'satellite', label: '위성 지도', shortLabel: '위성' },
]

const provinceFillColor = [
  'match',
  ['get', 'shapeISO'],
  'VN-HN', '#68a8ff', // Hanoi
  'VN-HC', '#ffd36b', // Ho Chi Minh City
  'VN-DN', '#7fd6c2', // Da Nang
  'VN-HP', '#9db7ff', // Hai Phong
  'VN-CT', '#f59ad8', // Can Tho
  '#b6ddff', // Default
]

type LooseLayer = Record<string, unknown>
type LooseSources = Record<string, unknown>

function provinceLayers(theme: MapThemeId) {
  const admin = theme === 'admin'
  const satellite = theme === 'satellite'

  return [
    {
      id: 'vietnam-province-fill',
      type: 'fill',
      source: 'vietnamProvinces',
      paint: {
        'fill-color': provinceFillColor,
        'fill-opacity': admin ? 0.5 : satellite ? 0.14 : 0.1,
      },
    },
    {
      id: 'vietnam-province-line',
      type: 'line',
      source: 'vietnamProvinces',
      paint: {
        'line-color': admin ? '#284a6f' : '#e8f5ff',
        'line-opacity': admin ? 0.62 : satellite ? 0.52 : 0.34,
        'line-width': admin ? 1.25 : 1,
      },
    },
  ]
}

function baseStyle(layers: LooseLayer[], sources: LooseSources) {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      vietnamProvinces: {
        type: 'geojson',
        data: '/data/vietnam-provinces.geojson',
      },
      ...sources,
    },
    layers,
  } as unknown as StyleSpecification
}

export function createMapStyle(theme: MapThemeId): StyleSpecification {
  if (theme === 'admin') {
    return baseStyle(
      [
        {
          id: 'admin-ocean',
          type: 'background',
          paint: {
            'background-color': '#f4fbff',
          },
        },
        ...provinceLayers(theme),
      ],
      {},
    )
  }

  if (theme === 'satellite') {
    return baseStyle(
      [
        {
          id: 'satellite-raster',
          type: 'raster',
          source: 'esriSatellite',
          paint: {
            'raster-opacity': 0.92,
            'raster-contrast': 0.08,
            'raster-saturation': -0.03,
          },
        },
        ...provinceLayers(theme),
      ],
      {
        esriSatellite: {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri',
        },
      },
    )
  }

  return baseStyle(
    [
      {
        id: 'carto-dark',
        type: 'raster',
        source: 'cartoDark',
        paint: {
          'raster-opacity': 1,
          'raster-contrast': 0.04,
          'raster-saturation': -0.08,
          'raster-brightness-min': 0.2,
          'raster-brightness-max': 1,
        },
      },
      ...provinceLayers(theme),
    ],
    {
      cartoDark: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      },
    },
  )
}
