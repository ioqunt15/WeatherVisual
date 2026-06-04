# Handoff Prompt Template (작업 이행/인계 프롬프트 템플릿)

* **사용 목적**: 컨텍스트 세션 초기화나 다른 AI 모델로의 활성 작업자 인계 시, 이전 대화 히스토리 없이 이 텍스트 주입만으로 모든 상태를 정확히 동기화하고 즉시 개발을 이어가게 돕습니다.

---

## 1. 인계시 프롬프트 구성 서식 (Swap Ingestion Format)
새로운 AI 작업자가 기동하면 사용자는 다음 형식의 텍스트에 `system/state.md`와 `system/LAST_RUN.md` 정보를 채워서 주입해야 합니다:

```markdown
이 프로젝트는 디자인 우선 AI 개발 하네스를 적용하여 관리 중입니다. 
당신은 새로운 활성 작업자(Active Worker)이며, 이전의 채팅 대화 맥락이 초기화된 상태에서 이어서 작업을 실행해야 합니다.

아래 지시 사항을 따르십시오:
1. `D:\Design_AI_Harness\AGENTS.md`의 읽기 우선 순위를 통해 하네스 기본 수칙을 독독하십시오.
2. `system/state.md`를 로드하여 현재 목표, 역할(Current Role), 워크플로우(Current Workflow)를 확인하십시오.
3. `system/locks.md`를 로드하여 당신의 작업 대상 파일에 락이 획득되었는지 검증하십시오.
4. 이전 완료 기록은 무시하고, `system/state.md` 상의 'In-Progress Work'에 기재된 부분부터 재계획 없이 즉시 이행하십시오.

현재 시스템 스냅샷:
- **Current Objective**: [system/state.md의 Objective 정보 붙여넣기]
- **Current Role**: [system/state.md의 Current Role 정보 붙여넣기]
- **Current Workflow**: [system/state.md의 Current Workflow 정보 붙여넣기]
- **Target Files**: [수정 또는 검증 중인 소스 파일 경로들]
```
