---
name: component-design-review
description: 카드, 테이블, 모달 등 단위 컴포넌트의 품질과 완성도를 채점 검격하는 스킬
---

# Component Design Review Skill (컴포넌트 디자인 검격 스킬)

## 1. Trigger conditions (트리거 조건)
* 개발 완료된 특정 화면이나 UI 요소에 대한 비주얼 심사가 요청되었을 때.

## 2. Inputs (입력)
* `docs/COMPONENT_QUALITY_BAR.template.md`, `docs/DESIGN_QUALITY_BAR.template.md` 및 결과 이미지/스크린샷.

## 3. Procedure (과정)
1. 둥글기, 텍스트 오버플로우 처리, 입력 레이블 매핑 구조를 현물 대조 검격합니다.
2. 템플릿 양산형 스타일 남발 유무를 조사합니다.
3. 6개 부문 평가 점수 모델로 평점을 산출해 Verdict를 선언합니다.

## 4. Outputs (출력)
* 갱신된 `system/design_review_log.md` 보고 기록.

## 5. Verification (검증 요건)
* Verdict PASS 판정 시 최종 총점이 80점 이상인지 더블체크.

## 6. Failure handling (실패 처리)
* 결함 검출 시 FAIL Verdict를 기록하고 구체적인 보완 사항을 frontend-implementer에게 피드백으로 보낸 후 수정 루프 가동.

## 7. Token-saving behavior (토큰 절약 행동)
* 백엔드 API 연동 모듈이나 기타 미관련 유틸 파일은 로드 대상에서 완전히 제외합니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md` 단계 및 Verdict 기록 반영.
