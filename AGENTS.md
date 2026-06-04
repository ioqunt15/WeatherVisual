# 디자인 우선 AI 하네스 (Design-First AI Harness)

본 하네스는 AI 에이전트가 안전하고 일관되게 작업을 수행할 수 있도록 돕는 디자인 우선 개발 프레임워크입니다.

## 1. 기본 읽기 순서 (Read Order)
AI 작업자는 실행을 시작할 때 반드시 다음 순서로 파일을 읽고 컨텍스트를 파악해야 합니다:
1. [agent.md](file:///D:/Design_AI_Harness/agent.md) - 전체 작동 프로토콜 지도
2. [system/state.md](file:///D:/Design_AI_Harness/system/state.md) - 현재 태스크 및 단계 상태
3. [system/LAST_RUN.md](file:///D:/Design_AI_Harness/system/LAST_RUN.md) - 직전 실행 기록
4. [system/active_worker.md](file:///D:/Design_AI_Harness/system/active_worker.md) - 현재 권한을 가진 작업자 정보
5. [system/locks.md](file:///D:/Design_AI_Harness/system/locks.md) - 파일 잠금 상태
6. 관련 워크플로우 파일 ([workflows/](file:///D:/Design_AI_Harness/workflows/)) - 수행할 단계 절차
7. 관련 역할 파일 ([agents/](file:///D:/Design_AI_Harness/agents/)) - 수행 중인 역할의 세부 규칙
8. 관련 스킬 및 문서 ([skills/](file:///D:/Design_AI_Harness/skills/), [docs/](file:///D:/Design_AI_Harness/docs/)) - 필요한 경우에만 제한적 로드

## 2. 핵심 운영 정책 및 안전 규칙
* **단일 활성 작업자 룰 (Single Active Worker Rule)**: 오직 한 번에 하나의 AI 도구(Worker)만 코드/파일을 편집할 수 있습니다. 동시 수정은 엄격히 금지됩니다.
* **작업자 스왑 (Worker Swap Rule)**: 컨텍스트 제한 도달 시 [swap_worker.md](file:///D:/Design_AI_Harness/workflows/swap_worker.md)를 준수하여 교체합니다. 새 에이전트는 이전 작업을 재계획하거나 반복하지 않고 상태 파일에서 즉시 이어받습니다.
* **패치 전 재현 (Reproduce Before Patch)**: 버그나 레이아웃 문제 수정 전 반드시 실제 문제를 관찰하고 재현 경로를 기록합니다. ([bug_reproduction_before_patch.md](file:///D:/Design_AI_Harness/workflows/bug_reproduction_before_patch.md))
* **시각적 변화 검증 (Verify Visible Change)**: UI/디자인 변경 시 단순히 코드가 수정된 것만으로 부족하며, 반드시 화면의 시각적 개선 결과가 증명되어야 합니다.
* **동작하지 않음 허용 (Inaction Is Allowed)**: 코드 수정이 필요 없는 경우 억지로 변경하지 않고 "변경 없음 성공(No Code Change)"으로 작업을 종료할 수 있습니다.
* **완료 전 디자인 게이트 (Design Gate Before Done)**: UI 관련 모든 작업은 기술 테스트 합격 여부와 상관없이 [design-evaluator.md](file:///D:/Design_AI_Harness/agents/design-evaluator.md)의 PASS Verdict를 획득해야 완료 처리됩니다.
* **KISS / YAGNI / DRY**: 가장 단순한 해결책을 지향(KISS)하고, 예측적 기능 추가를 금지(YAGNI)하며, 성급한 추상화보다 코드 복제가 나을 수 있음을 인지합니다.
* **휴먼 승인 게이트 (Human Approval Gates)**: 아키텍처 변경, 종속성 추가, 결제/인증/DB 스키마 수정, 파괴적 명령 실행 전 반드시 수동 휴먼 승인을 받아야 합니다. ([HUMAN_APPROVAL_GATES.template.md](file:///D:/Design_AI_Harness/docs/HUMAN_APPROVAL_GATES.template.md))
* **LAST_RUN 업데이트 필수**: 작업을 멈추거나 넘기기 전, 반드시 `system/LAST_RUN.md`를 업데이트하여 현 상태를 기록합니다.
