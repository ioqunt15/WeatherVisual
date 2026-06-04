# Technical Review (기술 및 코드 품질 평가 워크플로우)

## 1. Purpose (목적)
구현된 코드 파일들의 타입 안정성, 정적 린트 위반 여부, 단위 테스트 무결성 및 오버엔지니어링(YAGNI 위반) 유무를 기술적으로 최종 검격합니다.

## 2. Trigger conditions (트리거 조건)
* 비주얼 디자인 리뷰 통과 직후, 또는 비-UI 로직 수정이 완료되었을 때.

## 3. Required reading order (필수 독해 순서)
1. [docs/TECHNICAL_ARCHITECTURE.template.md](file:///D:/Design_AI_Harness/docs/TECHNICAL_ARCHITECTURE.template.md)
2. [docs/ANTI_PATTERNS.template.md](file:///D:/Design_AI_Harness/docs/ANTI_PATTERNS.template.md)

## 4. Step-by-step execution (단계별 실행 절차)
1. **정적 분석 스캔**: 빌드 도구 및 린터, 타입 체커를 로컬 환경에서 가동합니다.
2. **코드 사이즈 검사**: `scripts/file_size_audit.ps1` 또는 `sh` 버전을 작동시켜 파일 크기 임계치를 초과했는지 확인합니다.
3. **YAGNI/KISS 감사**: 필요 이상의 과도한 일반화, speculative(추측성) 코딩, 미사용 라이브러리 참조 유무를 점검합니다.
4. **결과 기록**: 검증 결과를 `system/verification_log.md`에 등재하고 Verdict(PASS/FAIL)를 통보합니다.

## 5. Evidence required (요구 증적)
* 빌드/타입체커 및 린터 실행 로그 출력 텍스트.
* 파일 사이즈 진단 결과 리포트.

## 6. Verification required (검증 요건)
* 정적 빌드 및 타입 검사 에러 없음(0 error) 및 파일 사이즈 규정 합격.

## 7. Human stop conditions (휴먼 중단 조건)
* 빌드 도구의 버전 충돌이나 패키지 결함으로 로컬 테스트가 영구히 불가능한 상황인 경우.

## 8. Loop limit (루프 제한)
* 수정 루프 최대 3회.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 검격 완료 후 `QA Verifier` 단계로 인계하고 `state.md`를 갱신합니다.
