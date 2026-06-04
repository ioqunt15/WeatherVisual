# Design-First Feature Loop (디자인 우선 신규 개발 루프)

## 1. Purpose (목적)
무작정 코딩을 하기 전에 기획, UX, 비주얼 설계 단계를 명확히 밟고, 완성 후 시각적 품질 검증을 거치는 신규 기능 개발 루프를 통제합니다.

## 2. Trigger conditions (트리거 조건)
* 신규 화면, 컴포넌트, 기능 개발 태스크가 개시될 때.

## 3. Required reading order (필수 독해 순서)
1. [docs/INDEX.md](file:///D:/Design_AI_Harness/docs/INDEX.md)
2. [agent.md](file:///D:/Design_AI_Harness/agent.md)
3. 관련 디자인 바이블 문서군 (`docs/VISUAL_SYSTEM.template.md` 등)

## 4. Step-by-step execution (단계별 실행 절차)
1. **Product Strategist 단계**: 요구사항 구체화 및 스코프 확정 (`docs/PRODUCT_STRATEGY.md` 생성).
2. **UX Architect 단계**: 정보 구조 및 유저 이동 동선 설계 (`docs/USER_FLOW.md`, `docs/INFORMATION_ARCHITECTURE.md` 생성).
3. **Visual Design Director 단계**: 디자인 시스템 색상, 타이포그래피, 형태 규정 및 가이드 도출 (`docs/VISUAL_SYSTEM.md` 생성).
4. **Interaction Designer 단계**: 요소별 상태 트랜지션 및 탭 타겟 설정 (`docs/INTERACTION_RULES.md` 생성).
5. **Frontend Implementer 단계**: 코드 편집 전 락 검증 후 마크업/CSS/동작 코딩 적용.
6. **Design Evaluator 단계**: 완성된 UI 화면의 스크린샷 리뷰 및 Verdcit 평가. 합격(PASS) 시 후속 단계 진행. 불합격(FAIL) 시 [ui_design_repair_loop.md](file:///D:/Design_AI_Harness/workflows/ui_design_repair_loop.md)로 이송.

## 5. Evidence required (요구 증적)
* 각 기획/설계 기입 완료 문서.
* 최종 구현된 화면 스크린샷 또는 HTML 빌드 결과물.

## 6. Verification required (검증 요건)
* `design-evaluator.md` 점수 80점 이상 획득 및 Verdict: **PASS** 필수 취득.

## 7. Human stop conditions (휴먼 중단 조건)
* 기획 단계에서 요구조건 충돌이 해결 불가능할 때.
* 디자인 리뷰 불합격(FAIL) 상태가 연속 3회 지속될 때.

## 8. Loop limit (루프 제한)
* 수리 루프 최대 3회 제한 (상세 사항은 `ui_design_repair_loop.md` 참고).

## 9. Handoff/update requirements (인계/업데이트 요건)
* 디자인 패스 시 `Technical Evaluator`로 품질 인계 및 `state.md` 갱신.
