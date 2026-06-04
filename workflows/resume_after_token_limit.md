# Resume After Token Limit (컨텍스트 초과 복귀 워크플로우)

## 1. Purpose (목적)
대화 세션이 너무 길어져 AI 작업자의 지능이 저하되거나 토큰 한도에 부딪혔을 때, 이전 채팅 기록을 전혀 참조하지 않고도 시스템 마크다운 파일들의 정보만으로 하네스를 정상 복구하여 즉시 다음 작업을 이어갈 수 있게 조치합니다.

## 2. Trigger conditions (트리거 조건)
* 컨텍스트 윈도우 한계 경고 발생 시.
* 대화 세션의 전면 리셋 및 신규 채팅창을 구동하여 작업을 이어받을 때.

## 3. Required reading order (필수 독해 순서)
1. [AGENTS.md](file:///D:/Design_AI_Harness/AGENTS.md)의 리드 오더 전체 재독.
2. [system/state.md](file:///D:/Design_AI_Harness/system/state.md) 및 [system/LAST_RUN.md](file:///D:/Design_AI_Harness/system/LAST_RUN.md)
3. `system/locks.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **상태 주입**: 복구되어 실행되는 새로운 AI 작업자는 주입받은 [handoff_prompt.md](file:///D:/Design_AI_Harness/system/handoff_prompt.md)를 먼저 판독하여 전반적인 락 상태와 현 단계를 확인합니다.
2. **이전 완성 이력 신뢰**: 완료(Completed Work)로 이미 기록된 설계나 코드는 다시 재계획하거나 구현하지 않고 철저히 완료로 인정합니다.
3. **진행 중 태스크 연계**: `state.md` 내의 'In-Progress Work'에 나열된 현 단계의 역할과 파일 락 상태를 그대로 이식받아 즉시 코딩 및 리뷰 루프로 복귀합니다.
4. **활성 작업자 정비**: `system/active_worker.md` 내에 기재된 활성 작업자 ID가 본인의 식별자로 변경되었는지 정비합니다.

## 5. Evidence required (요구 증적)
* `state.md` 동기화 상태.

## 6. Verification required (검증 요건)
* `scripts/check.ps1` 또는 `sh` 실행 결과 정상.

## 7. Human stop conditions (휴먼 중단 조건)
* `system/state.md`나 `system/locks.md` 자체가 깨져 있어 직전 단계 복원 정보가 소실되었을 때.

## 8. Loop limit (루프 제한)
* 해당 없음.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 복구된 상태에 따라 원래 목표 역할 및 워크플로우를 그대로 재개하고 `LAST_RUN.md`를 갱신합니다.
