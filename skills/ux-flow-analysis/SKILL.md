---
name: ux-flow-analysis
description: 사용자 동선 및 내비게이션 정보 계층을 설계하고 검증하는 스킬
---

# UX Flow Analysis Skill (UX 동선 분석 스킬)

## 1. Trigger conditions (트리거 조건)
* 프로젝트 브리프가 승인되고, 화면 인터페이스의 세부 흐름 설계가 요구될 때.

## 2. Inputs (입력)
* `docs/PROJECT_BRIEF.md` 및 `docs/USER_FLOW.template.md`

## 3. Procedure (과정)
1. 사용자가 시나리오 진입점부터 성공/실패 여정에 도달하는 단계를 구조화합니다.
2. 예외 케이스(로딩 중, 정보 없음, 서버 에러) 발생 시 사용자가 동선에서 낙오되지 않도록 복귀 경로를 마련합니다.
3. 정보 구조 설계서(`INFORMATION_ARCHITECTURE.md`)를 작성해 메뉴 계층과 핵심 노출 데이터를 정립합니다.

## 4. Outputs (출력)
* `docs/USER_FLOW.md` 및 `docs/INFORMATION_ARCHITECTURE.md`

## 5. Verification (검증 요건)
* 유저 여정 맵 내에 복귀 CTA가 누락된 '막다른 길(Dead End)'이 존재하지 않는가?

## 6. Failure handling (실패 처리)
* 동선 설계 모순 발견 시, 이전 기획 파트로 피드백을 보내고 흐름을 멈춥니다.

## 7. Token-saving behavior (토큰 절약 행동)
* 세션 내에 스타일 파일이나 빌드 관련 문서를 기입하지 않음으로써 토큰 낭비를 예방합니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md`의 설계 완료 이력 기재.
