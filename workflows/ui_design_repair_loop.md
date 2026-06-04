# UI Design Repair Loop (UI 디자인 수정/수리 루프)

## 1. Purpose (목적)
디자인 평가에서 불합격(FAIL) Verdict를 받은 UI 결과물의 결함을 격리하고 보완하여, 목표 점수를 획득할 때까지 수정-평가 사이클을 엄격히 통제합니다.

## 2. Trigger conditions (트리거 조건)
* `Design Evaluator` 단계에서 Verdict: **FAIL**이 선언되었을 때.

## 3. Required reading order (필수 독해 순서)
1. `system/design_review_log.md` (최근 실패 요인 및 개선 지시문)
2. [docs/ANTI_PATTERNS.template.md](file:///D:/Design_AI_Harness/docs/ANTI_PATTERNS.template.md)

## 4. Step-by-step execution (단계별 실행 절차)
1. **피드백 해독**: 디자인 리뷰 결과 문서에서 `Blocking Design Issues` 및 `Required Visible Changes` 요구 항목을 정독합니다.
2. **수정 스코프 제한**: `What Not To Touch` 영역을 제외한 지목된 결함 파일에 대해서만 락(Lock)을 유지하고 편집 범위로 한정합니다.
3. **코드 패치 및 가시 변화 발생**: Frontend Implementer가 지시된 간격, 타이포그래피, 컬러 수정을 코드로 이행하고 로컬 렌더링을 갱신합니다.
4. **재평가 의뢰**: 수정된 화면의 렌더링 증적(스크린샷 등)을 확보하여 `Design Evaluator`에게 다시 평가를 요청합니다.

## 5. Evidence required (요구 증적)
* 수정 전/후 스크린샷 대조군.
* `design_review_log.md`에 추가 기입된 리뷰 점수표.

## 6. Verification required (검증 요건)
* `design-evaluator.md` 점수 80점 이상 및 Verdict: **PASS**.

## 7. Human stop conditions (휴먼 중단 조건)
* **루프 초과**: 아래 루프 한계 횟수를 넘었을 때 즉시 수정을 정지하고 `Exception Gate: Human Intervention Required` 상태로 돌입.

## 8. Loop limit (루프 제한)
* **최대 3회**: 수정 및 재평가 루프는 최대 3회까지만 돌 수 있습니다. (3회 차 FAIL 시 즉시 정지)

## 9. Handoff/update requirements (인계/업데이트 요건)
* 3회 초과 실패 시 `state.md` 단계를 `Human Intervention`으로 바꾸고 마지막 에러 사항을 상세히 채팅에 표시.
