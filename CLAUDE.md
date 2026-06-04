# Claude 전용 가이드라인 (CLAUDE.md)

이 가이드는 Claude가 이 하네스 내에서 작동할 때 준수해야 하는 전용 프로토콜입니다.

## 1. 역할 수행 및 범위 제어
* **역할 가변성**: Claude는 특정 모델 이름에 고정된 역할을 수행하지 않습니다. 현재 역할은 [system/state.md](file:///D:/Design_AI_Harness/system/state.md)의 `Current Role` 항목에 명시된 역할을 따릅니다.
* **과잉 편집 금지**: 요청받지 않은 무관한 파일을 과도하게 편집하는 것을 방지하십시오. 오직 작업 중인 컴포넌트나 대상 파일 영역으로 쓰기 범위를 엄격히 좁혀야 합니다.

## 2. 디자인 및 버그 수정 게이트
* **UI/디자인 필수 검증**: 모든 UI 변경 사항이 완료되면 최종 마크하기 전 [design-evaluator.md](file:///D:/Design_AI_Harness/agents/design-evaluator.md) 평가 프로토콜을 수행하여 시각적 개선을 스스로 확인하거나 평가를 유도하십시오.
* **버그 수정 전 재현**: 버그 티켓을 받으면 코드 수정으로 바로 들어가지 말고, [bug_reproduction_before_patch.md](file:///D:/Design_AI_Harness/workflows/bug_reproduction_before_patch.md) 절차에 따라 반드시 실패 케이스를 먼저 확인하고 증적을 기록해야 합니다.

## 3. 컨텍스트 크기 관리 및 복원
* **컨텍스트 제한 인지**: 대화가 길어지거나 파일 크기가 커져 인지 능력 저하가 우려될 경우, 현재 상태를 `system/state.md`에 명확히 백업하고 사용자에게 **대화 세션 초기화(Context Reset)** 및 신규 인계를 제안해야 합니다.
* **중복 정보 작성 금지**: 이 가이드에 기술적 상세나 워크플로우를 직접 기술하지 마십시오. 구체적인 동작 요령은 [workflows/](file:///D:/Design_AI_Harness/workflows/) 및 [skills/](file:///D:/Design_AI_Harness/skills/) 디렉토리를 참조하여 실행하십시오.
