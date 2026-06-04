# File Size Audit Workflow (파일 크기 점검 및 관리 워크플로우)

## 1. Purpose (목적)
대규모 파일 누적으로 발생하는 컨텍스트 오버헤드를 사전에 예방하기 위해, 코드가 비대해진 파일들을 주기적으로 진단하고 분할 수립 계획을 처리합니다.

## 2. Trigger conditions (트리거 조건)
* 구현 단계 진입 및 완료 전 정기 감사 시.
* `scripts/file_size_audit.ps1` 또는 `sh` 실행 시 경고(Warn) 또는 위반(Limit)이 검출될 때.

## 3. Required reading order (필수 독해 순서)
1. [docs/FILE_SIZE_POLICY.template.md](file:///D:/Design_AI_Harness/docs/FILE_SIZE_POLICY.template.md)
2. `system/context_budget.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **스캔 구동**: 빌드 전 자동화 진단 스크립트를 작동하여 500줄 초과 파일을 검출합니다.
2. **분할 대상 파악**: 검출된 파일 내에서 모듈 분할이 용이한 기능 단위(컴포넌트, 헬퍼 유틸 등)를 정의합니다.
3. **분할 이행 계획 수립**: 임의 분할을 피하기 위해 `system/decision_log.md`에 계획을 기입합니다.
4. **휴먼 승인 취득**: 사용자에게 계획을 승인(Approved)받습니다.
5. **분리 구현**: 의존성이 흐트러지지 않게 주의하며 모듈을 쪼개고 `system/locks.md`를 조율합니다.

## 5. Evidence required (요구 증적)
* `system/context_budget.md`에 등재되는 크기 진단 로그 이력.
* `decision_log.md` 상의 휴먼 승인 결재.

## 6. Verification required (검증 요건)
* 분할 후 모든 소스 코드가 500줄 이하이고 프로젝트가 정상 빌드되는가?

## 7. Human stop conditions (휴먼 중단 조건)
* 수동 분할 이행 계획에 사용자가 반대하거나, 아키텍처적 전면 개편이 수반되어 AI가 다룰 수 있는 범위를 넘었을 때.

## 8. Loop limit (루프 제한)
* 해당 없음.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 분할 성공 시 `state-manager.md`를 통해 `system/file_inventory.md`를 갱신하고 본래의 개발 흐름으로 복귀합니다.
