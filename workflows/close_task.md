# Close Task Workflow (태스크 종료 및 완료 워크플로우)

## 1. Purpose (목적)
모든 비주얼 및 기능적 품질 게이트를 완전히 통과한 태스크를 정식으로 종결하고, 소유 중인 파일의 락(Lock)을 영구 해제하고 상태 엔진을 유휴(Idle) 상태로 되돌립니다.

## 2. Trigger conditions (트리거 조건)
* QA Verifier의 PASS Verdict를 획득하고 Documenter의 최종 문서 갱신이 완료된 시점.

## 3. Required reading order (필수 독해 순서)
1. [system/state.md](file:///D:/Design_AI_Harness/system/state.md)
2. `system/locks.md`
3. `system/verification_log.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **최종 서명 대조**: `verification_log.md` 및 `design_review_log.md`가 최종 태스크 ID에 대해 전부 PASS 상태로 합격 정렬되어 있는지 대조합니다.
2. **락 해제**: 소유 중이던 `system/locks.md` 테이블의 모든 파일 잠금 정보를 제거하여 편집 독점권을 완전히 포기합니다.
3. **상태 정비**:
  - `system/state.md`의 `Current Objective`를 "하네스 초기 기동 및 대기"로 환원합니다.
  - `Current Phase`를 `Idle`로, `Current Role`을 `orchestrator`로 돌리고 `Current Task ID`를 비웁니다.
4. **마지막 실행 이력 기록**: `system/LAST_RUN.md`에 성공적인 완료(SUCCESS) 정보와 최종 변경 요약을 기록합니다.

## 5. Evidence required (요구 증적)
* 갱신된 `system/state.md` 및 `system/locks.md`(잠금 없음 상태)와 `system/LAST_RUN.md`.

## 6. Verification required (검증 요건)
* `scripts/check.ps1` 또는 `check.sh`에 의한 락 충돌 없음 유효성 검증 통과.

## 7. Human stop conditions (휴먼 중단 조건)
* 이전 검격 과정에서 미통과된 FAIL 레코드가 발견되었을 때 (즉시 종료를 취소하고 미해결 단계로 회송).

## 8. Loop limit (루프 제한)
* 해당 없음.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 종료 완료 후 사용자에게 완료 브리핑을 전달하고 작업 대기를 선언합니다.
