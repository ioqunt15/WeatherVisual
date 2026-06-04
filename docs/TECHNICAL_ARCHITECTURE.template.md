# Technical Architecture (기술 아키텍처 규칙)

* **사용 목적**: 소스 코드 전반의 도메인 모델링, API 클라이언트 격리, 보안 위협 통제, 종속성 규칙을 수립합니다.
* **작성자**: Technical Implementer / Technical Evaluator
* **포함 사항**: 의존성 흐름, 모듈화 정책, 에러 핸들링 기본 규범.
* **제외 사항**: 특정 백엔드 프레임워크나 DB 접속 설정 코드.

---

## 1. 아키텍처 의존성 방향 (Dependency Flow Rules)
* **단방향 의존성**: 모든 모듈은 아래 계층 구조로만 참조를 허용하며 역방향 참조(Circular Dependency)는 엄격히 불합격 처리합니다.
  - `UI View` -> `Controller/Presenter/Hook` -> `API Service` -> `Domain Model / Utils`

## 2. API 통신 레이어 격리 (API Service Isolation)
* 소스 코드 내부 어디에서든 `fetch` 나 `axios` 같은 로직이 무분별하게 인라인으로 구동되지 않도록 합니다.
* 모든 API 요청은 독립된 클라이언트 클래스 또는 서비스 함수 모듈(예: `services/api.js`) 내부로 캡슐화하여 구현해야 합니다.

## 3. 에러 핸들링 및 복구 규범 (Error Handling Policies)
* 모든 API 호출 지점은 `try-catch` 블록으로 예외가 발생하더라도 크래시가 나지 않도록 차단해야 합니다.
* 사용자에게 노출되는 기술적 에러(예: Database Connection Refused)는 유저 친화적인 경고 메시지로 변환하여 UI 레이어로 전달합니다.

## 4. 라이브러리 추가 정책 (Dependency Guard)
* 성능에 치명적이거나 코드 복잡도를 올릴 수 있는 라이브러리의 임의 패키지 추가를 완전히 금지합니다.
* 라이브러리 추가가 반드시 필요한 경우 `harness.config.json` 정책에 따라 사전에 휴먼 승인을 취득해야 합니다.
