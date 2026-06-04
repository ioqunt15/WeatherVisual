# Swap Worker Workflow (작업 모델 교체 워크플로우)

## 1. Purpose (목적)
하나의 AI 모델에서 다른 AI 모델(예: Claude에서 Gemini로, 또는 그 반대로)로 안전하게 주도권을 이전하고, 여러 AI가 충돌하여 동시 파일 수정을 일으키지 않도록 잠금과 식별자를 조정합니다.

## 2. Trigger conditions (트리거 조건)
* 사용자의 명시적인 에이전트 교체 지시가 있거나, 토큰 제약으로 타 모델로 작업을 인계할 때.

## 3. Required reading order (필수 독해 순서)
1. [system/active_worker.md](file:///D:/Design_AI_Harness/system/active_worker.md)
2. `system/locks.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **현재 작업 정지**: 교체당하는 기존 작업자는 즉시 모든 코딩을 멈추고 `system/locks.md`에 등재된 본인의 락을 해제합니다.
2. **이행 준비**: 현재까지의 요약(Summary)과 진행 중이던 소스 파일 리스트를 `system/state.md` 및 `system/LAST_RUN.md`에 확실히 보관합니다.
3. **새 작업자 지정**: 사용자는 `system/active_worker.md`에 새로 권한을 줄 AI 모델 ID를 기입합니다.
4. **락 재취득**: 새로 교체된 AI 모델은 가동을 개시하면서 `system/locks.md` 상에 새로 편집할 파일에 대한 본인의 락을 등록합니다.

## 5. Evidence required (요구 증적)
* `system/active_worker.md`에 교체되어 등재된 새 Authorized Model ID.

## 6. Verification required (검증 요건)
* 복수의 작업자 ID가 동시에 활성 상태로 겹치지 않는가? (단일 활성 작업자 원칙)

## 7. Human stop conditions (휴먼 중단 조건)
* 작업 인계 도중 락 해제에 실패하여 두 모델 간 데드락(Lock Conflict)이 발생했을 때.

## 8. Loop limit (루프 제한)
* 해당 없음.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 스왑 완료 후 새 작업자는 `State Manager`를 거치지 않고 직접 목표 워크플로우를 승계 실행합니다.
