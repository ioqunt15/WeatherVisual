---
name: file-size-audit
description: 소스 파일 줄 수와 용량을 자동 스캔하여 리팩토링 및 분할 대상을 식별하는 스킬
---

# File Size Audit Skill (파일 크기 진단 스킬)

## 1. Trigger conditions (트리거 조건)
* 릴리즈 직전 또는 구현 단계 주기적 스캔 필요 시.

## 2. Inputs (입력)
* `docs/FILE_SIZE_POLICY.template.md` 및 `system/context_budget.md`

## 3. Procedure (과정)
1. 프로젝트 소스 파일 목록을 스캔하여 각 파일의 라인 수와 파일 크기(KB)를 산출합니다.
2. 500줄 초과 또는 20KB 초과 파일(위반 대상)을 색출합니다.
3. 위반 대상 검출 시, 모듈화 분할 계획서 작성을 지시합니다.

## 4. Outputs (출력)
* `system/context_budget.md` 내에 기재되는 최신 파일 검격 결과 보고서.

## 5. Verification (검증 요건)
* 신규 분할된 파일들이 정책상 허용된 파일 크기 상한선 내에 들어가는지 대조.

## 6. Failure handling (실패 처리)
* 분할 계획에 휴먼 반대 시, 아키텍처 예외 목록 등록 후 dry-run 우회.

## 7. Token-saving behavior (토큰 절약 행동)
* 대형 소스 파일 본문을 대화 세션에 통째로 적재하여 읽지 않도록 진단 시 셸 도구의 메타 정보(라인 수 등)만 추출하여 읽습니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md` 크기 감사 통과 여부 기재.
