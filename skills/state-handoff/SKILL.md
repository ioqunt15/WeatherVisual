---
name: state-handoff
description: 컨텍스트 교체 시점을 인식하고 상태 백업 및 신규 에이전트 Handoff 문구를 출력하는 스킬
---

# State Handoff Skill (상태 인계 스킬)

## 1. Trigger conditions (트리거 조건)
* 활성 작업자 교체 명령 인입 시, 혹은 토큰 부족으로 인한 컨텍스트 윈도우 초기화가 임박했을 때.

## 2. Inputs (입력)
* `system/state.md` 및 `system/handoff_prompt.md`

## 3. Procedure (과정)
1. 현재 수정 중인 모든 임시 상태와 변경 사항을 `system/state.md` 및 `system/LAST_RUN.md`에 확실히 저장합니다.
2. 소유 중인 파일 락이 있다면 안전하게 반납하거나 대기 상태로 정렬합니다.
3. `handoff_prompt.md` 서식에 최신 시스템 스냅샷 데이터를 매핑하여 최종 복구용 프롬프트 명세 텍스트를 출력합니다.

## 4. Outputs (출력)
* 출력창에 표시되는 Handoff 프롬프트 텍스트 명세 및 `system/LAST_RUN.md` 갱신.

## 5. Verification (검증 요건)
* Handoff용 요약 프롬프트 텍스트에 필수 명세(Objective, Role, locks)가 전부 포함되었는지 확인.

## 6. Failure handling (실패 처리)
* 상태 저장 중 디스크 쓰기 오류 등으로 실패 시 즉시 복구 절차를 멈추고 사용자에게 비상 상태 복원 요청 알림 출력.

## 7. Token-saving behavior (토큰 절약 행동)
* 출력하는 요약 텍스트는 불필요한 미사여구를 제거하여 최대한 압축하여 바이트를 아낍니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/active_worker.md` 락 전환 상태 업데이트.
