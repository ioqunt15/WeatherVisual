# Visual System Tokens (시각 디자인 시스템 토큰)

* **사용 목적**: 타이포그래피 계층, 간격(Spacing), 색상표, 레이아웃 밀도 등 핵심 비주얼 토큰을 엄격히 규정합니다.
* **작성자**: Visual Design Director
* **포함 사항**: CSS 변수로 변환될 수 있는 컬러 팔레트, 폰트 스케일, 여백 시스템, 컴포넌트 라운딩 값.
* **제외 사항**: 특정 라이브러리(Tailwind 등)의 특정 테마 연동 설정 파일 코드 자체.

---

## 1. 컬러 팔레트 (Color Palette)
*의미가 명확한 HSL이나 HEX 값 기반의 테마 컬러를 규정하십시오.*
* **Primary (주요 색상)**:
* **Secondary (보조 색상)**:
* **Background (배경 색상)**:
* **Text Primary (글자 기본 색상)**:
* **Text Secondary (글자 보조 색상)**:

## 2. 타이포그래피 계층 (Typography Scale)
*화면 내 텍스트 위계를 확실히 제어하기 위해 규정된 크기와 두께만 사용합니다.*
* **H1 (대제목)**: Size: `_px`, Weight: `_`, Line-Height: `_`
* **H2 (중제목)**: Size: `_px`, Weight: `_`, Line-Height: `_`
* **Body (본문)**: Size: `_px`, Weight: `_`, Line-Height: `_`
* **Caption (설명)**: Size: `_px`, Weight: `_`, Line-Height: `_`

## 3. 간격 및 여백 시스템 (Spacing System)
*임의의 마진/패딩(예: `margin-top: 13px`) 사용을 금지하고 배수 시스템을 강제합니다.*
* Base Unit: `8px`
* Spacing Scale: `4px (XS)`, `8px (S)`, `16px (M)`, `24px (L)`, `32px (XL)`, `48px (XXL)`

## 4. 컴포넌트 밀도 및 형태 (Density & Composition)
* **둥글기 (Border Radius)**: `4px (Sharp)`, `8px (Smooth)`, `16px (Round)`
* **레이아웃 밀도 (Density)**: (예: Comfort - 넓은 패딩과 여백 유지 / Compact - 대시보드형 밀집 배치)
* **그림자 스케일 (Shadows)**: 
