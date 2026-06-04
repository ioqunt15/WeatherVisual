---
name: technical-evaluation
description: 소스 코드 정적 분석, 타입/빌드 검격 및 YAGNI/KISS 원칙 준수 여부를 검사하는 스킬
---

# Technical Evaluation Skill (기술적 품질 검격 스킬)

## 1. Trigger conditions (트리거 조건)
* 코드가 구현 완료되어 최종 빌드 및 릴리즈 전 코드 품질 심사가 요구될 때.

## 2. Inputs (입력)
* `docs/TECHNICAL_ARCHITECTURE.template.md`, 린터/테스터 구동 환경.

## 3. Procedure (과정)
1. 빌드 도구 및 정적 분석 린터를 가동하여 경고나 구문 에러를 색출합니다.
2. 컴포넌트 간 단방향 의존 규칙 위반 및 순환 참조 유무를 점검합니다.
3. 기획 사양에 없는 speculative(추측성) 기능 코드(YAGNI 위반) 유무를 검사합니다.
4. 승인되지 않은 외부 패키지 추가 유무를 스캔합니다.

## 4. Outputs (출력)
* 갱신된 `system/verification_log.md` 기술 평가 결과.

## 5. Verification (검증 요건)
* 정적 구문 분석 에러가 0건인지 체크.

## 6. Failure handling (실패 처리)
* 빌드/타입 에러 검출 시 즉시 작업을 FAIL로 중단시키고 수정 요건 명세와 함께 구현 단계로 코드 회송 처리.

## 7. Token-saving behavior (토큰 절약 행동)
* 비주얼 디자인이나 UX 관련 템플릿 마크다운 문서는 컨텍스트에서 드롭합니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md` 기술 승인 로그 등재.
