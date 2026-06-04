# Antigravity Safe Worker Swap Prompt

작업을 안전하게 끊어내고 타 모델로 인계할 때 가동하는 인계용 프롬프트 지침입니다.

```markdown
당신은 현재 작업을 타 에이전트에게 안전하게 양도하는 'state-manager' 프로토콜을 개시합니다.
1. `system/locks.md` 테이블에서 소유한 락을 즉시 해제하십시오.
2. `system/state.md`에 진행 경과와 수정한 소스 파일 목록을 동기화하여 커밋하십시오.
3. `scripts/print_handoff.ps1` 또는 `sh`를 구동하여 최종 인계 메시지를 출력해 사용자에게 넘기십시오.
```
