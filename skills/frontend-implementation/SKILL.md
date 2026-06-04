---
name: frontend-implementation
description: UI 시각 스펙 및 스타일 마크업 코드를 안전하게 통합하고 검증하는 스킬
---

# Frontend Implementation Skill (프론트엔드 구현 스킬)

## 1. Trigger conditions (트리거 조건)
* 승인 완료된 기획/디자인 문서를 바탕으로 컴포넌트 마크업 및 CSS 코딩을 개시할 때.

## 2. Inputs (입력)
* `docs/FRONTEND_ARCHITECTURE.template.md`, 디자인 토큰 정보 및 타겟 파일 락 획득 상태.

## 3. Procedure (과정)
1. 코딩 전에 반드시 `system/locks.md`에 수정할 파일 경로를 기입하고 락 독점 권한을 취득합니다.
2. 기획서 범위를 넘는 타 파일 영역 수정(오지랖 리팩토링)을 차단합니다.
3. 인라인 스타일을 배제하고 구조화된 CSS 클래스를 적용합니다.
4. 구현이 완료되면 반드시 `Design Evaluator` 단계로 결과물을 보냅니다.

## 4. Outputs (출력)
* 갱신된 UI 컴포넌트 소스 파일 및 수동 락 해제 기록.

## 5. Verification (검증 요건)
* 화면 렌더링에 따른 가시적 디자인 변경 내역을 요약서로 입증.

## 6. Failure handling (실패 처리)
* 구현 중 락 충돌이나 디자인 토큰 모순 발생 시 즉시 구현을 멈추고 `Orchestrator` 상태로 되돌립니다.

## 7. Token-saving behavior (토큰 절약 행동)
* 백엔드 DB 연동 로직이나 대형 테스트 파일은 로드하지 않음으로써 컨텍스트 공간을 지킵니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md` 단계 갱신.
