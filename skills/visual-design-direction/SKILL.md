---
name: visual-design-direction
description: 비주얼 무드, 스타일 방향 및 타이포그래피/컬러 시스템 토큰을 정의하는 스킬
---

# Visual Design Direction Skill (비주얼 디자인 방향 스킬)

## 1. Trigger conditions (트리거 조건)
* UX 설계가 패스된 뒤 컴포넌트 마크업 전 비주얼 사양이 요구될 때.

## 2. Inputs (입력)
* `docs/USER_FLOW.md` 및 `docs/VISUAL_SYSTEM.template.md`

## 3. Procedure (과정)
1. 세 가지 스타일 핵심 키워드를 설정해 디자인 방향성을 확립합니다.
2. 그리드 여백 기준(8px), 폰트 스케일, 컬러 배합 토큰을 명세화합니다.
3. 템플릿형 양산 UI 방지를 위해 컴포넌트 밀도와 목적에 특화된 형태적 특징을 기록합니다.

## 4. Outputs (출력)
* `docs/DESIGN_DIRECTION.md` 및 `docs/VISUAL_SYSTEM.md`

## 5. Verification (검증 요건)
* 토큰 사양이 픽셀이나 배수로 정확히 계층화되어 정리되어 있는지 검토.

## 6. Failure handling (실패 처리)
* 디자인 가이드의 컬러 매칭이 접근성 기준 대비를 만족하지 못할 경우 재조정합니다.

## 7. Token-saving behavior (토큰 절약 행동)
* 비-UI 로직 소스 코드 및 테스트 파일은 일체 컨텍스트에 담지 않습니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md`에 비주얼 사양 등록 기재.
