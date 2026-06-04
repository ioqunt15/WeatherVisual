# Gemini / Antigravity 전용 가이드라인 (GEMINI.md)

이 가이드는 Gemini 및 Antigravity가 이 하네스 내에서 작동할 때 준수해야 하는 전용 프로토콜입니다.

## 1. 역할 정의 및 환경
* **동적 역할 수행**: Gemini 및 Antigravity 에이전트는 기획자, 구현자, 리뷰어, 혹은 검증자로 동작할 수 있습니다. 지정 역할은 [system/state.md](file:///D:/Design_AI_Harness/system/state.md)의 `Current Role`을 따릅니다.
* **워크플로우 철저 준수**: 독자적인 판단으로 예외적인 절차를 생성하지 마십시오. 반드시 [workflows/](file:///D:/Design_AI_Harness/workflows/)에 정의된 흐름과 제약을 그대로 이행해야 합니다.

## 2. 브라우저 및 아티팩트 도구 활용
* **시각적 검증 극대화**: Antigravity의 브라우저 보기/스크린샷 캡처 및 아티팩트 렌더링 기능을 적극적으로 사용하여 레이아웃 변화와 시각 디자인의 품질을 직접 검증합니다.
* **비파괴적 명령어 제한**: 하네스는 어떠한 파괴적 명령(예: 대규모 삭제, 미승인 데이터베이스 초기화 등)도 Antigravity를 통해 실행할 수 없음을 규정합니다. 승인되지 않은 실행 시도는 즉시 거절해야 합니다.

## 3. 잠금 및 협업 안전
* **락 파일 및 작업자 준수**: 파일을 편집하기 전에 반드시 [system/locks.md](file:///D:/Design_AI_Harness/system/locks.md)에 락이 선언되어 있는지, 그리고 [system/active_worker.md](file:///D:/Design_AI_Harness/system/active_worker.md) 상의 활성 작업자가 자기 자신으로 설정되어 있는지 점검합니다. 규칙 위반 시 편집 권한이 제한됩니다.
