export type StationTranslations = {
  vi: string
  en: string
  ko: string
}

export type DisasterPoint = {
  id: string
  name: string
  names?: StationTranslations
  lat: number
  lon: number
  value: number
}

export type DisasterScenario = {
  id: 'humidity' | 'wind' | 'uv' | 'aqi' | 'temperature' | 'rain' | 'heat' | 'wildfire' | 'forecast_temp' | 'forecast_rain' | 'future_danger'
  title: string
  headline: string
  subtitle: string
  unit: string
  metric: string
  updatedAt: string
  source: string
  kmaCategory?: 'T1H' | 'RN1'
  maxValue: number
  minValue: number
  gridCellSizeMeters: number
  bearing: number
  pitch: number
  zoom: number
  center: [number, number]
  palette: Array<[number, string]>
  points: DisasterPoint[]
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = Number.parseInt(clean, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgbToHex([red, green, blue]: [number, number, number]) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function getInterpolatedColor(value: number, anchors: Array<[number, string]>) {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0])

  if (value <= sorted[0][0]) {
    return sorted[0][1]
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const [stopValue, stopColor] = sorted[index]
    const [previousValue, previousColor] = sorted[index - 1]

    if (value <= stopValue) {
      const range = stopValue - previousValue
      const amount = range <= 0 ? 0 : (value - previousValue) / range
      const from = hexToRgb(previousColor)
      const to = hexToRgb(stopColor)

      return rgbToHex([
        Math.round(from[0] + (to[0] - from[0]) * amount),
        Math.round(from[1] + (to[1] - from[1]) * amount),
        Math.round(from[2] + (to[2] - from[2]) * amount),
      ])
    }
  }

  return sorted[sorted.length - 1][1]
}

function createPaletteSteps(anchors: Array<[number, string]>, count = 40): Array<[number, string]> {
  const sorted = [...anchors].sort((a, b) => a[0] - b[0])
  const minValue = sorted[0][0]
  const maxValue = sorted[sorted.length - 1][0]
  const range = maxValue - minValue

  return Array.from({ length: count }, (_, index) => {
    const value = index === count - 1 ? maxValue : minValue + (range * index) / (count - 1)
    const roundedValue = Math.round(value * 10) / 10

    return [roundedValue, getInterpolatedColor(value, sorted)]
  })
}

const standardStations: Omit<DisasterPoint, 'value'>[] = [
  { id: 'hanoi', name: '하노이', names: { vi: 'Hà Nội', en: 'Hanoi', ko: '하노이' }, lat: 21.0285, lon: 105.8542 },
  { id: 'haiphong', name: '하이퐁', names: { vi: 'Hải Phòng', en: 'Haiphong', ko: '하이퐁' }, lat: 20.8449, lon: 106.6881 },
  { id: 'quangninh', name: '광닌', names: { vi: 'Quảng Ninh', en: 'Quangninh', ko: '광닌' }, lat: 20.9599, lon: 107.0425 },
  { id: 'langson', name: '랑선', names: { vi: 'Lạng Sơn', en: 'Langson', ko: '랑선' }, lat: 21.8548, lon: 106.7620 },
  { id: 'laocai', name: '라오카이', names: { vi: 'Lào Cai', en: 'Laocai', ko: '라오카이' }, lat: 22.4856, lon: 103.9707 },
  { id: 'dienbien', name: '디엔비엔', names: { vi: 'Điện Biên', en: 'Dienbien', ko: '디엔비엔' }, lat: 21.3912, lon: 103.0163 },
  { id: 'sonla', name: '선라', names: { vi: 'Sơn La', en: 'Sonla', ko: '선라' }, lat: 21.3289, lon: 103.9100 },
  { id: 'hoabinh', name: '화빈', names: { vi: 'Hòa Bình', en: 'Hoabinh', ko: '화빈' }, lat: 20.8172, lon: 105.3376 },
  { id: 'thainguyen', name: '타이응우옌', names: { vi: 'Thái Nguyên', en: 'Thainguyen', ko: '타이응우옌' }, lat: 21.5939, lon: 105.8481 },
  { id: 'vinhphuc', name: '빈푹', names: { vi: 'Vĩnh Phúc', en: 'Vinhphuc', ko: '빈푹' }, lat: 21.3089, lon: 105.6046 },
  { id: 'hanam', name: '하남', names: { vi: 'Hà Nam', en: 'Hanam', ko: '하남' }, lat: 20.5403, lon: 105.9189 },
  { id: 'namdinh', name: '남딘', names: { vi: 'Nam Định', en: 'Namdinh', ko: '남딘' }, lat: 20.4354, lon: 106.1782 },
  { id: 'ninhbinh', name: '닌빈', names: { vi: 'Ninh Bình', en: 'Ninhbinh', ko: '닌빈' }, lat: 20.2506, lon: 105.9749 },
  { id: 'thanhhoa', name: '탄호아', names: { vi: 'Thanh Hóa', en: 'Thanhhoa', ko: '탄호아' }, lat: 19.8067, lon: 105.7760 },
  { id: 'nghean', name: '응에안', names: { vi: 'Nghệ An', en: 'Nghean', ko: '응에안' }, lat: 18.6732, lon: 105.6922 },
  { id: 'hue', name: '후에', names: { vi: 'Huế', en: 'Hue', ko: '후에' }, lat: 16.4637, lon: 107.5909 },
  { id: 'danang', name: '다낭', names: { vi: 'Đà Nẵng', en: 'Da Nang', ko: '다낭' }, lat: 16.0471, lon: 108.2062 },
  { id: 'quangnam', name: '광남', names: { vi: 'Quảng Nam', en: 'Quangnam', ko: '광남' }, lat: 15.8797, lon: 108.3325 },
  { id: 'quynhon', name: '퀴논', names: { vi: 'Quy Nhơn', en: 'Quynhon', ko: '퀴논' }, lat: 13.7830, lon: 109.2194 },
  { id: 'nhatrang', name: '냐짱', names: { vi: 'Nha Trang', en: 'Nhatrang', ko: '냐짱' }, lat: 12.2451, lon: 109.1943 },
  { id: 'dalat', name: '달랏', names: { vi: 'Đà Lạt', en: 'Dalat', ko: '달랏' }, lat: 11.9404, lon: 108.4583 },
  { id: 'phanthiet', name: '판티엣', names: { vi: 'Phan Thiết', en: 'Phanthiet', ko: '판티엣' }, lat: 10.9333, lon: 108.1000 },
  { id: 'hochiminh', name: '호치민', names: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City', ko: '호치민' }, lat: 10.8231, lon: 106.6297 },
  { id: 'vungtau', name: '붕따우', names: { vi: 'Vũng Tàu', en: 'Vungtau', ko: '붕따우' }, lat: 10.3460, lon: 107.0843 },
  { id: 'tayninh', name: '타이닌', names: { vi: 'Tây Ninh', en: 'Tayninh', ko: '타이닌' }, lat: 11.3115, lon: 106.0985 },
  { id: 'dongnai', name: '동나이', names: { vi: 'Đồng Nai', en: 'Dongnai', ko: '동나이' }, lat: 10.9574, lon: 106.8427 },
  { id: 'cantho', name: '깐토', names: { vi: 'Cần Thơ', en: 'Cantho', ko: '깐토' }, lat: 10.0452, lon: 105.7469 },
  { id: 'phuquoc', name: '푸꾸옥', names: { vi: 'Phú Quốc', en: 'Phuquoc', ko: '푸꾸옥' }, lat: 10.2899, lon: 103.9840 },
  { id: 'camau', name: '까마우', names: { vi: 'Cà Mau', en: 'Camau', ko: '까마우' }, lat: 9.1769, lon: 105.1524 },
  { id: 'hoangsa', name: 'Hoàng Sa', names: { vi: 'Hoàng Sa', en: 'Hoang Sa Islands', ko: '황사 제도' }, lat: 16.5, lon: 112.5 },
  { id: 'truongsa', name: 'Trường Sa', names: { vi: 'Trường Sa', en: 'Spratly Islands', ko: '쯔엉사 제도' }, lat: 8.63, lon: 111.9 },
]

const humidityValues: Record<string, number> = {
  hanoi: 76, haiphong: 78, quangninh: 80, langson: 72, laocai: 70, dienbien: 68, sonla: 70, hoabinh: 74, thainguyen: 75, vinhphuc: 76,
  hanam: 77, namdinh: 82, ninhbinh: 80, thanhhoa: 82, nghean: 80, hue: 84, danang: 80, quangnam: 82, quynhon: 78, nhatrang: 76,
  dalat: 88, phanthiet: 78, hochiminh: 82, vungtau: 80, tayninh: 75, dongnai: 78, cantho: 84, phuquoc: 82, camau: 85, hoangsa: 82, truongsa: 84
}

const windValues: Record<string, number> = {
  hanoi: 3.2, haiphong: 5.4, quangninh: 6.2, langson: 2.8, laocai: 2.1, dienbien: 1.8, sonla: 2.4, hoabinh: 2.8, thainguyen: 3.0, vinhphuc: 3.2,
  hanam: 3.5, namdinh: 4.8, ninhbinh: 4.2, thanhhoa: 4.5, nghean: 5.0, hue: 3.8, danang: 6.5, quangnam: 5.8, quynhon: 5.2, nhatrang: 4.8,
  dalat: 3.0, phanthiet: 6.8, hochiminh: 4.2, vungtau: 7.2, tayninh: 3.0, dongnai: 3.5, cantho: 3.8, phuquoc: 6.5, camau: 5.8, hoangsa: 6.8, truongsa: 7.5
}

const uvValues: Record<string, number> = {
  hanoi: 6.5, haiphong: 7.0, quangninh: 7.2, langson: 5.8, laocai: 5.0, dienbien: 6.2, sonla: 6.0, hoabinh: 6.4, thainguyen: 6.5, vinhphuc: 6.8,
  hanam: 7.0, namdinh: 7.2, ninhbinh: 7.0, thanhhoa: 8.0, nghean: 8.5, hue: 9.0, danang: 9.5, quangnam: 9.2, quynhon: 9.0, nhatrang: 9.2,
  dalat: 7.8, phanthiet: 9.5, hochiminh: 10.2, vungtau: 10.5, tayninh: 9.8, dongnai: 9.5, cantho: 10.0, phuquoc: 9.8, camau: 9.5, hoangsa: 9.5, truongsa: 10.0
}

const aqiValues: Record<string, number> = {
  hanoi: 154, haiphong: 120, quangninh: 92, langson: 64, laocai: 48, dienbien: 42, sonla: 52, hoabinh: 76, thainguyen: 110, vinhphuc: 105,
  hanam: 115, namdinh: 88, ninhbinh: 84, thanhhoa: 95, nghean: 102, hue: 58, danang: 46, quangnam: 52, quynhon: 62, nhatrang: 55,
  dalat: 32, phanthiet: 60, hochiminh: 142, vungtau: 78, tayninh: 115, dongnai: 98, cantho: 85, phuquoc: 50, camau: 42, hoangsa: 28, truongsa: 25
}

const rainValues: Record<string, number> = {
  hanoi: 12, haiphong: 15, quangninh: 18, langson: 8, laocai: 10, dienbien: 6, sonla: 8, hoabinh: 14, thainguyen: 12, vinhphuc: 10,
  hanam: 15, namdinh: 18, ninhbinh: 16, thanhhoa: 22, nghean: 25, hue: 35, danang: 28, quangnam: 30, quynhon: 15, nhatrang: 12,
  dalat: 8, phanthiet: 10, hochiminh: 45, vungtau: 35, tayninh: 40, dongnai: 42, cantho: 50, phuquoc: 60, camau: 55, hoangsa: 25, truongsa: 35
}

const temperatureValues: Record<string, number> = {
  hanoi: 29.5, haiphong: 28.2, quangninh: 28.5, langson: 26.4, laocai: 25.2, dienbien: 27.8, sonla: 26.2, hoabinh: 28.8, thainguyen: 28.6, vinhphuc: 29.0,
  hanam: 29.8, namdinh: 29.2, ninhbinh: 29.4, thanhhoa: 30.2, nghean: 31.0, hue: 32.5, danang: 31.5, quangnam: 31.2, quynhon: 30.5, nhatrang: 29.8,
  dalat: 21.4, phanthiet: 30.2, hochiminh: 32.8, vungtau: 31.0, tayninh: 33.2, dongnai: 32.5, cantho: 31.8, phuquoc: 30.6, camau: 31.2, hoangsa: 28.5, truongsa: 29.2
}

const heatValues: Record<string, number> = {
  hanoi: 34, haiphong: 32, quangninh: 32, langson: 29, laocai: 27, dienbien: 30, sonla: 28, hoabinh: 33, thainguyen: 32, vinhphuc: 33,
  hanam: 34, namdinh: 33, ninhbinh: 33, thanhhoa: 35, nghean: 37, hue: 39, danang: 38, quangnam: 37, quynhon: 36, nhatrang: 34,
  dalat: 22, phanthiet: 35, hochiminh: 39, vungtau: 36, tayninh: 40, dongnai: 39, cantho: 38, phuquoc: 36, camau: 37, hoangsa: 33, truongsa: 34
}

const fireValues: Record<string, number> = {
  hanoi: 25, haiphong: 20, quangninh: 18, langson: 35, laocai: 38, dienbien: 42, sonla: 40, hoabinh: 30, thainguyen: 28, vinhphuc: 25,
  hanam: 24, namdinh: 20, ninhbinh: 22, thanhhoa: 35, nghean: 45, hue: 50, danang: 40, quangnam: 42, quynhon: 48, nhatrang: 45,
  dalat: 55, phanthiet: 52, hochiminh: 30, vungtau: 28, tayninh: 35, dongnai: 32, cantho: 25, phuquoc: 22, camau: 20, hoangsa: 10, truongsa: 8
}

const forecastTempValues: Record<string, number> = {
  hanoi: 31.5, haiphong: 30.2, quangninh: 30.5, langson: 28.4, laocai: 27.2, dienbien: 29.8, sonla: 28.2, hoabinh: 30.8, thainguyen: 30.6, vinhphuc: 31.0,
  hanam: 31.8, namdinh: 31.2, ninhbinh: 31.4, thanhhoa: 32.2, nghean: 33.0, hue: 34.5, danang: 33.5, quangnam: 33.2, quynhon: 32.5, nhatrang: 31.8,
  dalat: 23.4, phanthiet: 32.2, hochiminh: 34.8, vungtau: 33.0, tayninh: 35.2, dongnai: 34.5, cantho: 33.8, phuquoc: 32.6, camau: 33.2, hoangsa: 29.5, truongsa: 30.2
}

const forecastRainValues: Record<string, number> = {
  hanoi: 5, haiphong: 10, quangninh: 12, langson: 3, laocai: 5, dienbien: 2, sonla: 4, hoabinh: 8, thainguyen: 6, vinhphuc: 5,
  hanam: 10, namdinh: 12, ninhbinh: 10, thanhhoa: 15, nghean: 18, hue: 25, danang: 20, quangnam: 22, quynhon: 10, nhatrang: 8,
  dalat: 4, phanthiet: 6, hochiminh: 30, vungtau: 22, tayninh: 25, dongnai: 28, cantho: 35, phuquoc: 45, camau: 40, hoangsa: 15, truongsa: 22
}

const futureDangerValues: Record<string, number> = {
  hanoi: 0, haiphong: 0, quangninh: 0, langson: 0, laocai: 0, dienbien: 0, sonla: 0, hoabinh: 0, thainguyen: 0, vinhphuc: 0,
  hanam: 0, namdinh: 0, ninhbinh: 0, thanhhoa: 0, nghean: 0, hue: 0, danang: 0, quangnam: 0, quynhon: 0, nhatrang: 0,
  dalat: 0, phanthiet: 0, hochiminh: 0, vungtau: 0, tayninh: 0, dongnai: 0, cantho: 0, phuquoc: 0, camau: 0, hoangsa: 0, truongsa: 0
}

function buildPoints(values: Record<string, number>): DisasterPoint[] {
  return standardStations.map((station) => ({
    ...station,
    value: values[station.id] ?? 0,
  }))
}

export const scenarios: DisasterScenario[] = [
  {
    id: 'humidity',
    title: '습도',
    headline: '실시간 상대습도 분포',
    subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    unit: '%',
    metric: '상대습도',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    kmaCategory: 'T1H',
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e8f0fe'],
      [30, '#b3d1ff'],
      [50, '#66a3ff'],
      [70, '#1a75ff'],
      [90, '#0052cc'],
      [100, '#002966'],
    ]),
    points: buildPoints(humidityValues),
  },
  {
    id: 'wind',
    title: '풍속',
    headline: '실시간 풍속 분포',
    subtitle: 'CF-VHWIS 고해상도 기상정보 생산 (m/s)',
    unit: 'm/s',
    metric: '풍속',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    kmaCategory: 'T1H',
    maxValue: 25,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e8fdf5'],
      [3, '#a3f3d2'],
      [6, '#4ce4a6'],
      [12, '#f6c927'],
      [18, '#f68027'],
      [25, '#c81e3d'],
    ]),
    points: buildPoints(windValues),
  },
  {
    id: 'uv',
    title: '자외선 지수',
    headline: '실시간 자외선 지수',
    subtitle: '일사 및 태양 자외선 노출 강도',
    unit: 'Index',
    metric: '자외선',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    kmaCategory: 'T1H',
    maxValue: 12,
    minValue: 0,
    gridCellSizeMeters: 5300,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#fffdd0'],
      [2, '#ffe066'],
      [5, '#ff8000'],
      [7, '#ff0000'],
      [10, '#cc00cc'],
      [12, '#6600cc'],
    ]),
    points: buildPoints(uvValues),
  },
  {
    id: 'aqi',
    title: '대기질 지수',
    headline: '실시간 대기질 분포 (AQI)',
    subtitle: 'US EPA 기준 미세먼지 종합 대기질 지수',
    unit: '점',
    metric: '대기질',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    kmaCategory: 'T1H',
    maxValue: 300,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#55a630'],
      [50, '#ffd166'],
      [100, '#f77f00'],
      [150, '#d62828'],
      [200, '#7209b7'],
      [300, '#4d001f'],
    ]),
    points: buildPoints(aqiValues),
  },
  {
    id: 'temperature',
    title: '기온',
    headline: '실시간 기온 분포',
    subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    unit: '℃',
    metric: '기온',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    kmaCategory: 'T1H',
    maxValue: 45,
    minValue: 10,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [10, '#3db8ff'],
      [18, '#7be1d3'],
      [25, '#fff1a8'],
      [30, '#ff9f3d'],
      [35, '#f04b2f'],
      [45, '#8b0032'],
    ]),
    points: buildPoints(temperatureValues),
  },
  {
    id: 'rain',
    title: '누적강수량',
    headline: '실시간 강수량 정보',
    subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    unit: 'mm',
    metric: '누적 강수량',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    kmaCategory: 'RN1',
    maxValue: 200,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#fff1a8'],
      [5, '#b8ead5'],
      [10, '#75d5f4'],
      [25, '#367dff'],
      [50, '#7133ff'],
      [100, '#bd31ff'],
      [150, '#ff3e9d'],
      [200, '#ef2f2f'],
     ]),
    points: buildPoints(rainValues),
  },
  {
    id: 'heat',
    title: '체감온도',
    headline: '체감 온도 지수',
    subtitle: '습도와 바람을 고려한 열 스트레스',
    unit: '℃',
    metric: '체감온도',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    maxValue: 48,
    minValue: 10,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [10, '#fff3a6'],
      [20, '#ffc857'],
      [28, '#ff8737'],
      [35, '#ed3c3b'],
      [40, '#c81e3d'],
      [48, '#8e102f'],
    ]),
    points: buildPoints(heatValues),
  },
  {
    id: 'wildfire',
    title: '산불 확산 위험',
    headline: '산불 발생 위험도',
    subtitle: '온도, 습도, 풍속 기반 실시간 지수',
    unit: '점',
    metric: '확산 위험지수',
    updatedAt: '2026.06.01 13:00',
    source: 'CF-VHWIS',
    maxValue: 80,
    minValue: 0,
    gridCellSizeMeters: 5600,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#fee08b'],
      [20, '#fdae61'],
      [40, '#f46d43'],
      [60, '#d73027'],
      [80, '#4d001f'],
    ]),
    points: buildPoints(fireValues),
  },
  {
    id: 'forecast_temp',
    title: '예측 기온',
    headline: '내일 기온 예측 분포',
    subtitle: '기상 AI 예측 모델 분석 결과',
    unit: '℃',
    metric: '예측 기온',
    updatedAt: '2026.06.05 13:00 (예측)',
    source: 'CF-VHWIS',
    maxValue: 45,
    minValue: 10,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [10, '#3db8ff'],
      [18, '#7be1d3'],
      [25, '#fff1a8'],
      [30, '#ff9f3d'],
      [35, '#f04b2f'],
      [45, '#8b0032'],
    ]),
    points: buildPoints(forecastTempValues),
  },
  {
    id: 'forecast_rain',
    title: '예측 강수량',
    headline: '내일 강수량 예측 분포',
    subtitle: '기상 AI 예측 모델 분석 결과 (24h)',
    unit: 'mm',
    metric: '예측 강수량',
    updatedAt: '2026.06.05 13:00 (예측)',
    source: 'CF-VHWIS',
    maxValue: 200,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#fff1a8'],
      [5, '#b8ead5'],
      [10, '#75d5f4'],
      [25, '#367dff'],
      [50, '#7133ff'],
      [100, '#bd31ff'],
      [150, '#ff3e9d'],
      [200, '#ef2f2f'],
    ]),
    points: buildPoints(forecastRainValues),
  },
  {
    id: 'future_danger',
    title: '위험지수 추가 예정',
    headline: '기타 재난 위험지수 분석',
    subtitle: '산사태 및 추가 위험지수 분석 모델',
    unit: '점',
    metric: '재난 위험지수',
    updatedAt: '서비스 준비 중',
    source: 'CF-VHWIS',
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#eceff1'],
      [100, '#cfd8dc'],
    ]),
    points: buildPoints(futureDangerValues),
  },
]
