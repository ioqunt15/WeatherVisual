# KBS Disaster Visual MVP

재난 데이터를 방송형 16:9 지도 그래픽으로 자동 시각화하는 PoC입니다.

## 실행

```bash
npm install
npm run dev
```

개발 서버:

```text
http://127.0.0.1:5173
```

프로덕션 빌드:

```bash
npm run build
```

## 현재 구현

- 오픈소스 지도 기반: MapLibre GL JS + CARTO/OpenStreetMap raster tiles
- 데이터 시각화: deck.gl 3D column layer
- 재난 템플릿 3종: 누적강수량, 누적 폭염일수, 산불 확산 위험
- 지도 레이어 3종: 보정 다크 지도, 행정구역 지도, 위성 지도
- 지역 선택 레이어 2종: 표준지역 지점 값 콜아웃, 시도명 고정 라벨
- 방송 화면 구성: 타이틀, 주요 지점 값 콜아웃, 순위 패널, 범례, 시연 재생
- 샘플 데이터 위치: `src/data/scenarios.ts`
- 시도 경계 데이터: `public/data/korea-provinces.geojson`

## 버전

- `mvp-v0.1`: 지점 주변 큐브 묶음 형태의 최초 MVP
- `mvp-v0.2`: 작은 격자형 3D 강수량 레이어, 표준지역/시도명 레이어, 전체 화면 반응형 구조

## 용어

- `지점 값 콜아웃`: 지도 위 블록 중심에서 봉이 시작되고, 지점명/세부지역/값을 함께 보여주는 방송형 배너입니다.
- `지도 레이어`: 같은 데이터를 유지한 상태에서 배경 지도만 교체하는 화면 스타일입니다.
- `격자 컬럼`: 기상청 격자형 자료를 받는다는 전제로 만든 작은 3D 칸 단위 시각화입니다. 현재는 샘플 지점값을 시도 경계 안쪽 격자로 보간해 사용합니다.

## 실제 데이터로 교체할 때 필요한 자료

최소 데이터는 아래 형태면 됩니다.

```json
{
  "name": "무안공항",
  "detail": "망운면",
  "lat": 34.9914,
  "lon": 126.3828,
  "value": 289
}
```

운영용으로는 CSV/JSON 중 하나를 정하면 됩니다.

```csv
name,detail,lat,lon,value,unit,updatedAt
무안공항,망운면,34.9914,126.3828,289,mm,2026-05-12 09:00
```

## 교체 대상

- 지도 스타일: 현재는 API 키 없는 오픈소스 타일입니다. 실제 서비스에서는 KBS 내부 지도, VWorld, Kakao/Naver, Mapbox, 자체 타일 서버로 교체 가능합니다.
- 데이터: 현재 수치는 시연용 샘플입니다. 실제 관측/예보 데이터가 오면 `src/data/scenarios.ts` 또는 별도 JSON/API로 연결하면 됩니다.
- 브랜드: 현재 KBS 스타일의 임시 화면입니다. CI/자막 규정이 있으면 색상, 폰트, 로고, 안전 영역 기준에 맞춰 교체하면 됩니다.
- 행정구역: 현재는 KOSTAT 2013 기반 단순 시도 경계입니다. 최신 법정 경계나 KBS 내부 GIS 기준이 있으면 이 파일만 교체하면 됩니다.
- 격자: 실제 기상청 격자 API/파일이 오면 `src/utils/koreaGrid.ts`의 샘플 보간 로직 대신 원본 격자값을 연결하면 됩니다.

## 시연 산출물

검증용 스크린샷은 `artifacts/` 폴더에 생성됩니다.

- `desktop-final.png`
- `mobile-final.png`
- `phase1-dark-final.png`
- `phase1-admin-final.png`
- `phase1-satellite-final.png`
- `ver02-stations.png`
- `ver02-provinces.png`
- `ver02-dark.png`
