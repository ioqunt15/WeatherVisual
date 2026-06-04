# Gemini Resume From State Prompt

Gemini가 컨텍스트 교체 후 이어서 가동할 때 주입하는 프로토콜입니다.

```markdown
이전 대화가 단절되었습니다.
재기획하거나 완성된 코드를 불필요하게 다시 짜는 행위를 금지합니다.
`system/state.md`에서 현재 역할(Role) 및 진행 상태(In-Progress Work)와 락 상태를 검출하여, 즉시 정의된 워크플로우에 따라 정합적으로 작업을 이어가십시오.
```
