# 에이전트 핵심 작동 프로토콜 (agent.md)

이 문서는 AI 작업자의 진행 흐름을 제어하는 인간 및 AI 공동 참조용 핵심 프로토콜 지도입니다.

## 1. 태스크 실행 루프

### A. 디자인/기능 신규 개발 루프 (Design-First Loop)
기획 단계부터 최종 검증까지 다음 역할 순서대로 파이프라인을 진행합니다:
1. **Product Strategist** (요구사항 스코프 및 타겟 정의)
2. **UX Architect** (화면 흐름, 계층 구조 설계)
3. **Visual Design Director** (스타일, 레이아웃 및 비주얼 피드백 정의)
4. **Implementer** (디자인 구현 및 기능 코딩)
5. **Design Evaluator** (시각적 품질 검증 및 Verdict 평가)
6. **Technical Evaluator** (코드 품질, 타입, 성능 감사)
7. **QA Verifier** (동작 및 호환성 최종 검증)
8. **Documenter** (문서 갱신 및 완료)

### B. 버그 및 결함 수정 루프 (Bug Loop)
문제를 해결할 때는 무작정 패치하기 전에 아래 순서를 따릅니다:
1. **Bug Reproducer** (문제 조건 재현 및 증적 수집)
2. **Implementer** (버그 패치 작성)
3. **Evaluator** (수정이 유효한지 비주얼/로직적 검토)
4. **Verifier** (재발 여부 확인 및 종결)

## 2. 작업 원칙
* **컨텍스트 리셋 및 작업자 인계**: 세션이 한계에 도달하면 `system/state.md`를 기점으로 작업자를 스왑하여 재작성 비용을 절감합니다.
* **병렬 편집 금지**: 동일 프로젝트 경로 상에서 두 개 이상의 AI 도구가 동시 편집 권한을 가질 수 없습니다.
* **스펙 코딩 엄금 (No Speculative Development)**: 미래를 대비한 사용하지 않는 아키텍처나 기능(YAGNI 위반)을 미리 코딩하지 않습니다.
* **템플릿 UI 배제**: 목적이 불명확한 장식용 그라데이션, 의미 없는 배지, 프레임워크 기본 UI를 지양하고 목적에 특화된 레이아웃을 제공합니다.
* **조용한 성공 / 상세한 실패**: 정상 작동 시엔 핵심 결과만 보고하고, 오류 발생 시 원인, 증적 및 다음 조치 사항을 최대한 소상히 서술합니다.
* **휴먼 승인**: [HUMAN_APPROVAL_GATES.template.md](file:///D:/Design_AI_Harness/docs/HUMAN_APPROVAL_GATES.template.md)의 트리거 발생 시 수동 승인이 필요합니다.
