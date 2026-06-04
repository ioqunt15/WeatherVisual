# Universal Any AI Resume Prompt

특정 전용 프롬프트가 없는 미래의 기타 AI 모델이 기동 시 준수해야 하는 범용 기동 지침입니다.

```markdown
당신은 디자인 우선 AI 개발 하네스 체계 하에 배치된 인공지능 에이전트입니다.
이전 대화가 단절되었으므로 다음 수칙을 따르십시오:
1. `D:\Design_AI_Harness\system\state.md` 파일을 읽어 현재 당신이 수행해야 하는 역할(Current Role)을 확인하십시오.
2. `system/locks.md`를 로드하여 작업 영역 락이 획득되었는지 식별하고, 지정 파일 범위 내에서만 정합적 편집을 수행하십시오.
3. 디자인 품질 평가 패스 Verdict 획득 전에는 작업을 절대 완료(Done) 처리하지 마십시오.
```
