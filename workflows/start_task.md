# Start Task Workflow (태스크 시작 워크플로우)

## 1. Purpose (목적)
신규 요구사항 혹은 버그 리포트를 접수하여 하네스 상태를 초기화하고 필요한 자원 락(Lock)을 취득합니다.

## 2. Trigger conditions (트리거 조건)
* 신규 태스크 수령 및 시작 지시 인입 시.

## 3. Required reading order (필수 독해 순서)
1. [agent.md](file:///D:/Design_AI_Harness/agent.md)
2. [system/state.md](file:///D:/Design_AI_Harness/system/state.md)
3. [system/task_queue.md](file:///D:/Design_AI_Harness/system/task_queue.md)

## 4. Step-by-step execution (단계별 실행 절차)
1. **상태 검증**: `system/state.md`를 열어 현재 활성화되어 구동 중인 다른 작업이 없는지(`Idle` 상태) 확인합니다.
2. **역할 할당**: 태스크 성격(신규 개발 vs 버그)에 맞춰 최초 기동 역할을 결정합니다. (신규 개발: `product-strategist`, 버그: `bug-reproducer`)
3. **작업자 락 선언**: `system/active_worker.md`에 본인의 모델 ID를 기입하고, 수정 대상 기획/소스 파일 경로를 `system/locks.md`에 등록해 락을 선언합니다.
4. **상태 변경**: `system/state.md` 내 `Current Objective`, `Current Role`, `Current Workflow` 정보를 갱신합니다.

## 5. Evidence required (요구 증적)
* `system/state.md` 및 `system/locks.md`에 기록된 락 획득 상태 스냅샷.

## 6. Verification required (검증 요건)
* `scripts/check.ps1` 또는 `scripts/check.sh`를 실행하여 락 및 작업자 선언 정합성을 자동 검증합니다.

## 7. Human stop conditions (휴먼 중단 조건)
* 작업 대상 파일이 이미 타인의 락에 의해 영구 잠금 상태여서 잠금 해제가 불가능할 때.

## 8. Loop limit (루프 제한)
* 해당 없음.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 상태 엔진 업데이트가 끝나면 즉시 주 대상을 다음 타겟 역할(Product Strategist 또는 Bug Reproducer)로 인계합니다.
