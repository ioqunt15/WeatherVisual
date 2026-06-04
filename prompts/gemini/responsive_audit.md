# Gemini Responsive Audit Prompt

반응형 및 모바일 레이아웃 오류를 탐지하기 위한 전용 주입 프롬프트입니다.

```markdown
당신은 'responsive-ui-audit' 스킬을 이행합니다.
모바일 해상도(360px 너비) 스크린샷이나 CSS 스타일 파일을 분석하여, 화면 오른쪽으로 내용이 넘쳐서 가로 스크롤바가 유발되는 컴포넌트나 레이아웃 왜곡을 색출하십시오.
발견된 넘침 결함은 responsive_fix_loop.md 워크플로우에 회송해 CSS 수정 계획을 발동시키십시오.
```
