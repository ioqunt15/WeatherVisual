---
name: bug-reproduction
description: 패치 작성 전에 버그를 최소 단위 경로로 로컬 재현하고 문서를 최신화하는 스킬
---

# Bug Reproduction Skill (버그 재현 스킬)

## 1. Trigger conditions (트리거 조건)
* 버그 수정 또는 결함 패치 요청이 등록되었을 때.

## 2. Inputs (입력)
* `docs/BUG_REPRODUCTION_POLICY.template.md` 및 유저 이슈 리포트.

## 3. Procedure (과정)
1. 코드를 임의로 짐작하여 패치(Blind Patch)하려는 시도를 차단합니다.
2. 에러 로그 수집 및 로컬 테스트 케이스 구동을 위한 재현 셸 명령어나 시나리오 입력을 결정합니다.
3. 로컬에서 버그가 정확히 발생하여 실패함을 확인한 후, Expected vs Actual 매핑 결과와 증적 경로를 `system/issue_log.md`에 등재합니다.

## 4. Outputs (출력)
* `system/issue_log.md`에 갱신된 재현 이력.

## 5. Verification (검증 요건)
* 재현 증적 스크린샷명이나 에러 콘솔 로그 텍스트가 확실히 등재되었는가?

## 6. Failure handling (실패 처리)
* 재현 시도 3회 실패 시 패치 작성을 중지하고 휴먼 승인 대기 게이트로 전환.

## 7. Token-saving behavior (토큰 절약 행동)
* 관련 소스 코드 파일의 원본 컨텍스트 로드를 최소화하고 문제 발생 예상 구역으로 범위를 좁혀 로드합니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md` 재현 단계 표시.
