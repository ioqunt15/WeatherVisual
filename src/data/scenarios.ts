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
  direction?: number // Wind direction angle in degrees (0-360)
}

export type DisasterScenario = {
  id:
    | 'humidity'
    | 'wind'
    | 'uv'
    | 'aqi'
    | 'temperature'
    | 'rain'
    | 'heat'
    | 'wildfire'
    | 'forecast_temp'
    | 'forecast_rain'
    | 'gust'
    | 'pressure'
    | 'solar'
    | 'forecast_wind'
    | 'forecast_humidity'
    | 'cloud'
    | 'landslide'
    | 'flood'
    | 'drought'
    | 'typhoon'
    | 'sst'
    | 'wave'
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

export const standardStations: Omit<DisasterPoint, 'value'>[] = [
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
  { id: 'hoangsa', name: 'Hoàng Sa', names: { vi: 'Quần đảo Hoàng Sa', en: 'Hoang Sa Archipelago', ko: '황사 군도' }, lat: 16.5, lon: 112.5 },
  { id: 'truongsa', name: 'Trường Sa', names: { vi: 'Quần đảo Trường Sa', en: 'Truong Sa Archipelago', ko: '쯔엉사 군도' }, lat: 10.4, lon: 114.3 },
]

// 1. Observations
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

const gustValues: Record<string, number> = {
  hanoi: 5.8, haiphong: 9.2, quangninh: 10.5, langson: 4.8, laocai: 3.5, dienbien: 3.0, sonla: 4.2, hoabinh: 4.8, thainguyen: 5.2, vinhphuc: 5.5,
  hanam: 6.0, namdinh: 8.2, ninhbinh: 7.5, thanhhoa: 8.0, nghean: 9.0, hue: 6.8, danang: 11.2, quangnam: 10.0, quynhon: 9.2, nhatrang: 8.5,
  dalat: 5.0, phanthiet: 11.5, hochiminh: 7.5, vungtau: 12.8, tayninh: 5.2, dongnai: 6.0, cantho: 6.5, phuquoc: 10.5, camau: 9.8, hoangsa: 11.5, truongsa: 13.0
}

const pressureValues: Record<string, number> = {
  hanoi: 1009.5, haiphong: 1009.2, quangninh: 1009.0, langson: 1008.4, laocai: 1007.2, dienbien: 1007.8, sonla: 1007.5, hoabinh: 1008.6, thainguyen: 1009.2, vinhphuc: 1009.4,
  hanam: 1009.8, namdinh: 1009.7, ninhbinh: 1009.6, thanhhoa: 1009.2, nghean: 1008.8, hue: 1008.2, danang: 1008.0, quangnam: 1008.1, quynhon: 1007.8, nhatrang: 1007.9,
  dalat: 1002.4, phanthiet: 1007.8, hochiminh: 1008.2, vungtau: 1008.0, tayninh: 1008.1, dongnai: 1008.3, cantho: 1008.4, phuquoc: 1008.2, camau: 1008.5, hoangsa: 1007.5, truongsa: 1007.2
}

const rainValues: Record<string, number> = {
  hanoi: 1.2, haiphong: 2.5, quangninh: 3.8, langson: 0.8, laocai: 1.0, dienbien: 0.6, sonla: 0.8, hoabinh: 1.4, thainguyen: 1.2, vinhphuc: 1.0,
  hanam: 1.5, namdinh: 1.8, ninhbinh: 1.6, thanhhoa: 2.2, nghean: 2.5, hue: 3.5, danang: 2.8, quangnam: 3.0, quynhon: 1.5, nhatrang: 1.2,
  dalat: 0.8, phanthiet: 1.0, hochiminh: 4.5, vungtau: 3.5, tayninh: 4.0, dongnai: 4.2, cantho: 5.0, phuquoc: 6.0, camau: 5.5, hoangsa: 2.5, truongsa: 3.5
}

const solarValues: Record<string, number> = {
  hanoi: 450, haiphong: 480, quangninh: 500, langson: 380, laocai: 320, dienbien: 400, sonla: 390, hoabinh: 420, thainguyen: 440, vinhphuc: 450,
  hanam: 470, namdinh: 490, ninhbinh: 480, thanhhoa: 520, nghean: 580, hue: 600, danang: 650, quangnam: 640, quynhon: 630, nhatrang: 660,
  dalat: 580, phanthiet: 680, hochiminh: 720, vungtau: 730, tayninh: 710, dongnai: 700, cantho: 680, phuquoc: 650, camau: 660, hoangsa: 720, truongsa: 750
}

const temperatureValues: Record<string, number> = {
  hanoi: 29.5, haiphong: 28.2, quangninh: 28.5, langson: 26.4, laocai: 25.2, dienbien: 27.8, sonla: 26.2, hoabinh: 28.8, thainguyen: 28.6, vinhphuc: 29.0,
  hanam: 29.8, namdinh: 29.2, ninhbinh: 29.4, thanhhoa: 30.2, nghean: 31.0, hue: 32.5, danang: 31.5, quangnam: 31.2, quynhon: 30.5, nhatrang: 29.8,
  dalat: 21.4, phanthiet: 30.2, hochiminh: 32.8, vungtau: 31.0, tayninh: 33.2, dongnai: 32.5, cantho: 31.8, phuquoc: 30.6, camau: 31.2, hoangsa: 28.5, truongsa: 29.2
}

// 2. Forecasts
const forecastTempValues: Record<string, number> = {
  hanoi: 31.5, haiphong: 30.2, quangninh: 30.5, langson: 28.4, laocai: 27.2, dienbien: 29.8, sonla: 28.2, hoabinh: 30.8, thainguyen: 30.6, vinhphuc: 31.0,
  hanam: 31.8, namdinh: 31.2, ninhbinh: 31.4, thanhhoa: 32.2, nghean: 33.0, hue: 34.5, danang: 33.5, quangnam: 33.2, quynhon: 32.5, nhatrang: 31.8,
  dalat: 23.4, phanthiet: 32.2, hochiminh: 34.8, vungtau: 33.0, tayninh: 35.2, dongnai: 34.5, cantho: 33.8, phuquoc: 32.6, camau: 33.2, hoangsa: 29.5, truongsa: 30.2
}

const forecastRainValues: Record<string, number> = {
  hanoi: 5.0, haiphong: 10.0, quangninh: 12.0, langson: 3.0, laocai: 5.0, dienbien: 2.0, sonla: 4.0, hoabinh: 8.0, thainguyen: 6.0, vinhphuc: 5.0,
  hanam: 10.0, namdinh: 12.0, ninhbinh: 10.0, thanhhoa: 15.0, nghean: 18.0, hue: 25.0, danang: 20.0, quangnam: 22.0, quynhon: 10.0, nhatrang: 8.0,
  dalat: 4.0, phanthiet: 6.0, hochiminh: 30.0, vungtau: 22.0, tayninh: 25.0, dongnai: 28.0, cantho: 35.0, phuquoc: 45.0, camau: 40.0, hoangsa: 15.0, truongsa: 22.0
}

const forecastWindValues: Record<string, number> = { ...windValues }
const forecastHumidityValues: Record<string, number> = { ...humidityValues }

const cloudValues: Record<string, number> = {
  hanoi: 65, haiphong: 70, quangninh: 75, langson: 58, laocai: 50, dienbien: 45, sonla: 48, hoabinh: 55, thainguyen: 60, vinhphuc: 62,
  hanam: 64, namdinh: 78, ninhbinh: 74, thanhhoa: 80, nghean: 75, hue: 82, danang: 68, quangnam: 72, quynhon: 55, nhatrang: 50,
  dalat: 85, phanthiet: 45, hochiminh: 80, vungtau: 78, tayninh: 65, dongnai: 70, cantho: 82, phuquoc: 85, camau: 88, hoangsa: 60, truongsa: 65
}

// 3. Danger Indices
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

const landslideValues: Record<string, number> = {
  hanoi: 10, haiphong: 8, quangninh: 30, langson: 65, laocai: 88, dienbien: 84, sonla: 80, hoabinh: 68, thainguyen: 45, vinhphuc: 25,
  hanam: 5, namdinh: 5, ninhbinh: 12, thanhhoa: 48, nghean: 55, hue: 60, danang: 40, quangnam: 62, quynhon: 35, nhatrang: 25,
  dalat: 65, phanthiet: 15, hochiminh: 5, vungtau: 10, tayninh: 20, dongnai: 25, cantho: 5, phuquoc: 15, camau: 5, hoangsa: 5, truongsa: 5
}

const floodValues: Record<string, number> = {
  hanoi: 62, haiphong: 68, quangninh: 52, langson: 20, laocai: 15, dienbien: 12, sonla: 10, hoabinh: 35, thainguyen: 40, vinhphuc: 42,
  hanam: 58, namdinh: 72, ninhbinh: 68, thanhhoa: 55, nghean: 58, hue: 78, danang: 65, quangnam: 60, quynhon: 52, nhatrang: 48,
  dalat: 22, phanthiet: 45, hochiminh: 82, vungtau: 70, tayninh: 35, dongnai: 48, cantho: 75, phuquoc: 58, camau: 78, hoangsa: 42, truongsa: 45
}

const droughtValues: Record<string, number> = {
  hanoi: 25, haiphong: 22, quangninh: 20, langson: 32, laocai: 35, dienbien: 38, sonla: 35, hoabinh: 28, thainguyen: 26, vinhphuc: 24,
  hanam: 28, namdinh: 20, ninhbinh: 22, thanhhoa: 38, nghean: 48, hue: 52, danang: 45, quangnam: 48, quynhon: 68, nhatrang: 65,
  dalat: 40, phanthiet: 82, hochiminh: 72, vungtau: 68, tayninh: 78, dongnai: 65, cantho: 85, phuquoc: 70, camau: 88, hoangsa: 50, truongsa: 52
}

// 4. Marine & Special
const typhoonValues: Record<string, number> = {
  hanoi: 3.2, haiphong: 9.8, quangninh: 12.5, langson: 2.8, laocai: 1.8, dienbien: 1.2, sonla: 2.0, hoabinh: 3.2, thainguyen: 3.0, vinhphuc: 3.2,
  hanam: 4.2, namdinh: 10.5, ninhbinh: 8.8, thanhhoa: 12.0, nghean: 15.2, hue: 28.5, danang: 48.2, quangnam: 35.8, quynhon: 24.2, nhatrang: 15.8,
  dalat: 6.5, phanthiet: 14.2, hochiminh: 5.2, vungtau: 12.5, tayninh: 3.0, dongnai: 4.8, cantho: 5.0, phuquoc: 6.8, camau: 8.5, hoangsa: 65.5, truongsa: 18.2
}

function buildPoints(values: Record<string, number>, isWindOrTyphoon = false): DisasterPoint[] {
  return standardStations.map((station) => {
    // Generate standard direction (pointing westward / southwestward usually in monsoon seasons 220-270, or typhoon counter-clockwise)
    let direction = undefined
    if (isWindOrTyphoon) {
      // Hanoi/Northern: 230 degrees. Central: 250 degrees. Southern: 270 degrees. Hoang Sa: 240 degrees.
      if (station.lat > 19) direction = 230
      else if (station.lat > 14) direction = 250
      else direction = 270
    }
    return {
      ...station,
      value: values[station.id] ?? 0,
      direction,
    }
  })
}

export const scenarios: DisasterScenario[] = [
  // 1. Observations
  {
    id: 'temperature',
    title: '기온',
    headline: '실시간 기온 분포',
    subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    unit: '℃',
    metric: '기온',
    updatedAt: '2026.06.04 14:00',
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
    id: 'humidity',
    title: '상대습도',
    headline: '실시간 상대습도 분포',
    subtitle: 'CF-VHWIS 고해상도 기상정보 생산',
    unit: '%',
    metric: '상대습도',
    updatedAt: '2026.06.04 14:00',
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
    title: '풍속/풍향',
    headline: '실시간 풍속 및 바람장 벡터',
    subtitle: 'CF-VHWIS 고해상도 바람 관측 관측 정보',
    unit: 'm/s',
    metric: '풍속',
    updatedAt: '2026.06.04 14:00',
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
    points: buildPoints(windValues, true),
  },
  {
    id: 'gust',
    title: '돌풍',
    headline: '실시간 돌풍(Wind Gust) 분포',
    subtitle: '순간 최대 풍속 및 급격한 돌풍 감시',
    unit: 'm/s',
    metric: '돌풍',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS',
    maxValue: 40,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e0f7fa'],
      [5, '#80deea'],
      [10, '#26c6da'],
      [20, '#ffb74d'],
      [30, '#ff7043'],
      [40, '#d84315'],
    ]),
    points: buildPoints(gustValues, true),
  },
  {
    id: 'pressure',
    title: '기압',
    headline: '실시간 기압(Surface Pressure) 분포',
    subtitle: '베트남 기압 분포도 및 저기압 시스템 분석',
    unit: 'hPa',
    metric: '기압',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS',
    maxValue: 1025,
    minValue: 990,
    gridCellSizeMeters: 5600,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [990, '#5e35b1'],
      [1000, '#3949ab'],
      [1008, '#00acc1'],
      [1013, '#43a047'],
      [1020, '#ffb300'],
      [1025, '#ffb300'],
    ]),
    points: buildPoints(pressureValues),
  },
  {
    id: 'rain',
    title: '강수현황',
    headline: '실시간 강수 분포도',
    subtitle: 'CF-VHWIS 고해상도 강수량 관측 정보',
    unit: 'mm',
    metric: '강수량',
    updatedAt: '2026.06.04 14:00',
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
    id: 'solar',
    title: '일사량',
    headline: '실시간 태양 일사량(Solar Radiation)',
    subtitle: '태양광 발전 및 지역별 에너지 모니터링',
    unit: 'W/m²',
    metric: '일사량',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS',
    maxValue: 1000,
    minValue: 0,
    gridCellSizeMeters: 5300,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#263238'],
      [100, '#ffcc80'],
      [300, '#ffe082'],
      [500, '#ffd54f'],
      [800, '#ffb300'],
      [1000, '#ff8f00'],
    ]),
    points: buildPoints(solarValues),
  },

  // 2. Forecasts
  {
    id: 'forecast_temp',
    title: '기온 예보',
    headline: '단기 예보 기온 분포 (24h)',
    subtitle: '기상 AI 예측 모델 분석 결과',
    unit: '℃',
    metric: '예측 기온',
    updatedAt: '2026.06.04 14:00 (예보)',
    source: 'CF-VHWIS 예보',
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
    title: '강수 예보',
    headline: '예측 강수량 분포 (24h)',
    subtitle: '수치 예보 모델 강수 예측 데이터',
    unit: 'mm',
    metric: '예측 강수량',
    updatedAt: '2026.06.04 14:00 (예보)',
    source: 'CF-VHWIS 예보',
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
    id: 'forecast_wind',
    title: '바람 예보',
    headline: '예측 수치 바람장 벡터 (24h)',
    subtitle: '대기 순환 모델 기반 단기 바람 분석',
    unit: 'm/s',
    metric: '예측 풍속',
    updatedAt: '2026.06.04 14:00 (예보)',
    source: 'CF-VHWIS 예보',
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
    points: buildPoints(forecastWindValues, true),
  },
  {
    id: 'forecast_humidity',
    title: '습도 예보',
    headline: '예측 상대습도 분포 (24h)',
    subtitle: '수치 예보 모델 단기 습도 예측',
    unit: '%',
    metric: '예측 습도',
    updatedAt: '2026.06.04 14:00 (예보)',
    source: 'CF-VHWIS 예보',
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
    points: buildPoints(forecastHumidityValues),
  },
  {
    id: 'cloud',
    title: '구름량',
    headline: '예측 총 구름량(Cloud Cover)',
    subtitle: '하늘 상태 예측 및 태양 가시성 분석',
    unit: '%',
    metric: '구름량',
    updatedAt: '2026.06.04 14:00 (예보)',
    source: 'CF-VHWIS 예보',
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5300,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#bbdefb'],
      [20, '#e3f2fd'],
      [50, '#e0e0e0'],
      [80, '#9e9e9e'],
      [100, '#616161'],
    ]),
    points: buildPoints(cloudValues),
  },

  // 3. Danger Indices
  {
    id: 'heat',
    title: '체감온도',
    headline: '실시간 체감 온도 지수',
    subtitle: '습도와 바람을 고려한 열 스트레스 및 노출 위험도',
    unit: '℃',
    metric: '체감온도',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS 위험 지수',
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
    title: '산불 위험도',
    headline: '실시간 산불 위험지수',
    subtitle: '온도, 습도, 풍속 기반 산림 화재 확산 위험도 분석',
    unit: '점',
    metric: '산불위험',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS 위험 지수',
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
    id: 'uv',
    title: 'UV 지수',
    headline: '실시간 자외선 지수',
    subtitle: '일사 및 태양 자외선 노출 강도 및 인체 위해도',
    unit: 'Index',
    metric: '자외선',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS',
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
    updatedAt: '2026.06.04 14:00',
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
    id: 'landslide',
    title: '산사태 위험',
    headline: '산사태 취약 및 붕괴 위험지수',
    subtitle: '강수량 및 고도 경사도를 반영한 산사태 예찰',
    unit: '점',
    metric: '산사태위험',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS 재난 지수',
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5400,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e2f1e7'],
      [25, '#a3dbb6'],
      [50, '#ffeb3b'],
      [75, '#ff9800'],
      [100, '#e53935'],
    ]),
    points: buildPoints(landslideValues),
  },
  {
    id: 'flood',
    title: '도심 침수',
    headline: '도심 침수 및 강 범람 위험도',
    subtitle: '저지대 및 해수면 만조 연계 침수 리스크 모델',
    unit: '점',
    metric: '침수위험',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS 재난 지수',
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5200,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e3f2fd'],
      [25, '#90caf9'],
      [50, '#2196f3'],
      [75, '#ab47bc'],
      [100, '#e91e63'],
    ]),
    points: buildPoints(floodValues),
  },
  {
    id: 'drought',
    title: '가뭄/토양수분',
    headline: '가뭄 및 메콩델타 토양 수분 지수',
    subtitle: '농경지 수분량 분석 및 해수 염수 침입 예찰 지표',
    unit: '점',
    metric: '가뭄지수',
    updatedAt: '2026.06.04 14:00',
    source: 'CF-VHWIS 재난 지수',
    maxValue: 100,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e8f5e9'],
      [30, '#c8e6c9'],
      [60, '#ffcc80'],
      [80, '#ff8a65'],
      [100, '#d84315'],
    ]),
    points: buildPoints(droughtValues),
  },

  // 4. Marine & Special
  {
    id: 'typhoon',
    title: '태풍 트래킹',
    headline: '실시간 태풍 경로 추적 및 풍풍장',
    subtitle: '동해(South China Sea) 내 발생 태풍 이동 경로 감시',
    unit: 'm/s',
    metric: '풍속',
    updatedAt: '2026.06.04 14:00',
    source: 'VHWIS 태풍센터',
    maxValue: 75,
    minValue: 0,
    gridCellSizeMeters: 5500,
    bearing: 0,
    pitch: 0,
    zoom: 4.8,
    center: [109.5, 15.0],
    palette: createPaletteSteps([
      [0, '#e8fdf5'],
      [15, '#4ce4a6'],
      [25, '#f6c927'],
      [35, '#f68027'],
      [50, '#c81e3d'],
      [75, '#7b1fa2'],
    ]),
    points: buildPoints(typhoonValues, true),
  },
]
