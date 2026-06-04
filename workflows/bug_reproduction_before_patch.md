# Bug Reproduction Before Patch (선 재현 후 버그 패치 워크플로우)

## 1. Purpose (목적)
추측을 기반으로 코드를 먼저 건드려 부작용을 일으키는 행동을 금지하고, 로컬 환경에서 버그를 물리적으로 재현하여 실패 테스트 케이스나 명확한 로그 증적을 선행 확보하게 강제합니다.

## 2. Trigger conditions (트리거 조건)
* 버그, 예외 오류, 레이아웃 깨짐 수정 태스크가 가동될 때.

## 3. Required reading order (필수 독해 순서)
1. [docs/BUG_REPRODUCTION_POLICY.template.md](file:///D:/Design_AI_Harness/docs/BUG_REPRODUCTION_POLICY.template.md)
2. `system/issue_log.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **문제 정의**: 보고된 현상을 분석하고 예상되는 오류 파일군을 탐색합니다. (아직 편집 락을 걸지 않음 - 읽기 전용 분석)
2. **재현 시나리오 작성**: 버그가 발현하기 위한 최소 입력값이나 페이지 이동 단계를 정의합니다.
3. **재현 실행 및 관찰**: 터미널 테스트 실행, API curl 호출, 또는 브라우저 조작을 통해 오류 현상을 관찰합니다.
4. **증적 기록**: 관찰된 오작동 에러 로그나 캡처 스크린샷을 `system/issue_log.md`에 기재하고 'Actual' 상태를 업데이트합니다.
5. **구현 착수**: 재현이 끝난 후에 비로소 수정 대상 파일의 락을 얻고 패치 코딩에 진입합니다.

## 5. Evidence required (요구 증적)
* `system/issue_log.md` 내에 기재된 재현 확인 증적 및 Expected vs Actual 항목.

## 6. Verification required (검증 요건)
* 재현 실패 로그 존재 유무 확인.

## 7. Human stop conditions (휴먼 중단 조건)
* **재현 불가**: 어떠한 경우에도 로컬이나 테스트 환경에서 이슈가 재현되지 않고 정상 동작만 관찰될 때. (이 경우 코드 수정을 멈추고 휴먼 승인 대기)

## 8. Loop limit (루프 제한)
* 재현 시도 3회 제한.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 재현 성공 증적 확보 시 즉시 구현자(Implementer) 역할로 인계하여 수정을 지시합니다.
