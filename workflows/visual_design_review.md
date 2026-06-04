# Visual Design Review (비주얼 디자인 평가 프로세스)

## 1. Purpose (목적)
구현된 최종 UI 화면이 본 기획서 및 브랜드 가이드의 디자인적 깊이와 일관성을 완벽히 만족하는지 `Design Evaluator`가 심사하는 절차입니다.

## 2. Trigger conditions (트리거 조건)
* Frontend Implementer가 UI 파일 수정을 완료하고 검증을 의뢰했을 때.

## 3. Required reading order (필수 독해 순서)
1. [docs/DESIGN_QUALITY_BAR.template.md](file:///D:/Design_AI_Harness/docs/DESIGN_QUALITY_BAR.template.md)
2. `docs/VISUAL_SYSTEM.md` 및 `docs/INTERACTION_RULES.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **결과물 확보**: 구현된 화면 페이지의 렌더링 스크린샷 이미지 또는 실제 DOM 트리를 참조합니다.
2. **평가 질문 이행**: `DESIGN_QUALITY_BAR.template.md` 및 `UX_QUALITY_BAR.template.md` 자가 진단 질문을 전면 수행합니다.
3. **가혹 심사 점수 측정**: 디자인 디렉터가 정의한 6대 점수 가이드라인에 따라 평점을 측정합니다.
4. **리뷰 보고서 작성**: Verdict(PASS/FAIL)와 세부 가이드가 포함된 표준 피드백 서식을 `system/design_review_log.md`에 기입합니다.

## 5. Evidence required (요구 증적)
* `system/design_review_log.md` 내에 기재되는 표준 디자인 리뷰 보고서 전문.

## 6. Verification required (검증 요건)
* 총점 80점 이상 및 PASS Verdict 획득. (FAIL 처리 시 `ui_design_repair_loop.md` 가동)

## 7. Human stop conditions (휴먼 중단 조건)
* 시각 디자인 방향이 모호하여 AI 자율 평가가 불가능하거나 요구 조건이 모순되어 점수가 연속 감점될 때.

## 8. Loop limit (루프 제한)
* 수리 복구 루프 최대 3회.

## 9. Handoff/update requirements (인계/업데이트 요건)
* PASS 획득 시 즉시 `Technical Evaluator`로 품질 관리를 인계하고 `state.md`를 갱신합니다.
