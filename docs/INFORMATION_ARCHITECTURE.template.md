# Information Architecture (정보 구조 설계서)

* **사용 목적**: 화면의 내비게이션, 데이터 모델 구조, 계층을 명세하여 코드 통합 시 복잡도를 제어합니다.
* **작성자**: UX Architect
* **포함 사항**: 사이트 구조 맵, 네비게이션 방식, 주요 데이터 엔티티 및 스키마 관계.
* **제외 사항**: 실제 데이터베이스 쿼리나 스토어 구현 코드.

---

## 1. 내비게이션 및 사이트맵 (Sitemap / Navigation)
*메뉴 구성과 화면 계층 구조를 트리 구조로 나열하십시오.*
```
ROOT
├── 메인 화면 (Home)
│   ├── 상세 뷰
│   └── 검색 필터
└── 설정 화면 (Settings)
```

## 2. 화면별 정보 계층 (Screen Hierarchy / Information Grid)
*각 주요 페이지에서 가장 중요하게 눈에 띄어야 하는 핵심 콘텐츠의 위계를 지정하십시오.*

### A. [화면명 기입]
1. **Primary (최우선순위)**: (예: 요약 스탯 및 메인 CTA)
2. **Secondary (차순위)**: (예: 세부 목록 리스트)
3. **Tertiary (기타)**: (예: 메타 정보 및 푸터 링크)

## 3. 핵심 데이터 구조 정의 (Core Data Entities)
*화면에서 렌더링하고 관리해야 하는 데이터 객체의 속성을 정의합니다.*
* **Entity Name**:
  - `id`: Unique identifier (String)
  - `title`: Display title (String)
  - `status`: State status (Enum)
