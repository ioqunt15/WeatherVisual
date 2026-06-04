# Claude Resume From State Prompt

Claude가 세션 리셋 후 상태 파일 정보로부터 작업을 복구할 때 주입하는 프롬프트입니다.

```markdown
이전 대화가 소실되었습니다.
당신은 하네스의 system/state.md 및 LAST_RUN.md 상태를 참조하여, 이미 완결된 단계의 작업을 무시하고 'In-Progress Work'로 정의된 현재 역할과 단계부터 즉시 복구하여 태스크를 완수해야 합니다.
중복된 기획 수립을 수행하지 마십시오.
```
