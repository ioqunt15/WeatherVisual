export type ProvinceLabel = {
  id: string
  name: string
  lat: number
  lon: number
}

export const provinceLabels: ProvinceLabel[] = [
  { id: 'seoul', name: '서울', lat: 37.56, lon: 126.98 },
  { id: 'incheon', name: '인천', lat: 37.47, lon: 126.55 },
  { id: 'gyeonggi', name: '경기', lat: 37.35, lon: 127.25 },
  { id: 'gangwon', name: '강원', lat: 37.68, lon: 128.28 },
  { id: 'chungbuk', name: '충북', lat: 36.78, lon: 127.78 },
  { id: 'chungnam', name: '충남', lat: 36.48, lon: 126.83 },
  { id: 'sejong', name: '세종', lat: 36.49, lon: 127.28 },
  { id: 'daejeon', name: '대전', lat: 36.35, lon: 127.39 },
  { id: 'jeonbuk', name: '전북', lat: 35.72, lon: 127.14 },
  { id: 'jeonnam', name: '전남', lat: 34.88, lon: 126.9 },
  { id: 'gwangju', name: '광주', lat: 35.16, lon: 126.85 },
  { id: 'gyeongbuk', name: '경북', lat: 36.35, lon: 128.74 },
  { id: 'daegu', name: '대구', lat: 35.87, lon: 128.6 },
  { id: 'gyeongnam', name: '경남', lat: 35.35, lon: 128.18 },
  { id: 'ulsan', name: '울산', lat: 35.54, lon: 129.31 },
  { id: 'busan', name: '부산', lat: 35.18, lon: 129.07 },
  { id: 'jeju', name: '제주', lat: 33.39, lon: 126.55 },
]
