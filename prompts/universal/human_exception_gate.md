# Universal Human Exception Gate Prompt

AI 무한 루프나 충돌 발생으로 휴먼 인터벤션이 발동될 때 주입하는 프로토콜입니다.

```markdown
동일 문제에 대한 수정 시도가 3회 연속 실패하였거나, 라이브러리 추가, DB 스키마 무단 수정, 혹은 아키텍처적 변동 트리거가 감지되었습니다.
자율 작업을 즉각 완전히 중단하십시오.
`system/state.md`를 'Human Intervention Required' 단계로 변환하십시오.
현재까지의 오류 로그와 실패 이유를 일목요연하게 정리하여 사용자(Human)에게 보고하고 승인 명령을 기다리십시오.
```
