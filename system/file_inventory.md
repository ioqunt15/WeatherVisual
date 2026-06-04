# File Inventory (파일 인벤토리 관리 맵)

* **사용 목적**: 하네스 내부 및 연계 대상 프로젝트 폴더 내 모든 관리 대상 파일의 위치와 역할을 추적합니다.

---

## 1. 하네스 시스템 파일 목록 (Harness System Files)
*이 하네스 프레임워크 자체를 구성하는 파일 트리입니다.*

* `/AGENTS.md` - 크로스 에이전트 엔트리포인트 지도
* `/CLAUDE.md` - Claude 에이전트 최적화 지침
* `/GEMINI.md` - Gemini 및 Antigravity 최적화 지침
* `/agent.md` - 에이전트 실행 핵심 수칙
* `/README.md` - 사용 설명서
* `/harness.config.json` - 전역 설정 파일

* **`agents/`**
  - `orchestrator.md`, `product-strategist.md`, `ux-architect.md`, `visual-design-director.md`, `interaction-designer.md`, `frontend-implementer.md`, `technical-implementer.md`, `design-evaluator.md`, `technical-evaluator.md`, `bug-reproducer.md`, `qa-verifier.md`, `documenter.md`, `state-manager.md`

* **`docs/`**
  - `INDEX.md`, 18개 핵심 템플릿 마크다운 문서들.

* **`system/`**
  - 상태값 제어 및 의사결정/이슈/검증 로그 저장소.

* **`workflows/`**
  - 11가지 라이프사이클 실행 시나리오 흐름 정의서.

* **`skills/`**
  - YAML 프론트매터 지침이 포함된 행동 스킬 파일군.

* **`scripts/`**
  - PowerShell 및 Bash 자동화 헬퍼 스크립트.

* **`prompts/`**
  - 모델별 주입용 초기 유저/시스템 프롬프트 명세.

## 2. 관리 대상 소스 파일 목록 (Target Project Files)
*하네스가 이식되어 제어할 실제 프로젝트의 대상 파일 리스트입니다.*
* (현재 비어 있음 - 프로젝트 적용 시 작성)
