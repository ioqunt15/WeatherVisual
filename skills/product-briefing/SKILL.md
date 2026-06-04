---
name: product-briefing
description: 기획 요건을 정제하고 프로젝트 요구사항 문서를 동기화하는 스킬
---

# Product Briefing Skill (제품 브리핑 스킬)

## 1. Trigger conditions (트리거 조건)
* 신규 기획안이 인입되거나 모호한 태스크를 구체화해야 할 때.

## 2. Inputs (입력)
* 사용자 개발 요건 설명 및 `PROJECT_BRIEF.template.md`

## 3. Procedure (과정)
1. 사용자가 제시한 요구사항의 유즈케이스와 가치를 파악합니다.
2. `PROJECT_BRIEF.md` 파일을 생성하여 목적과 범위를 규정합니다.
3. 무분별한 에이전트 활동을 차단하기 위한 비목표(Non-goals)를 최소 3가지 이상 명시적으로 색출합니다.
4. 완성 여부를 평가할 인수 조건(Acceptance Criteria)을 작성합니다.

## 4. Outputs (출력)
* 작성이 완료된 `D:\Design_AI_Harness\docs\PROJECT_BRIEF.md`

## 5. Verification (검증 요건)
* 문서 내 기획 조건의 모호함이 모두 해소되었는지 검토.

## 6. Failure handling (실패 처리)
* 비목표나 인수조건 설정에 논리적 모순이 있는 경우, 기획 수정을 즉시 정지하고 휴먼 개입을 요청합니다.

## 7. Token-saving behavior (토큰 절약 행동)
* 기획 단계 진행 시에는 프론트엔드 스타일 코드나 백엔드 소스 파일 등을 절대 대화 컨텍스트에 로드하지 않습니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md`에 기획 수립 완료 상태로 상태 갱신.
