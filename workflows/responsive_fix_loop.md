# Responsive Fix Loop (반응형 레이아웃 수정 루프)

## 1. Purpose (목적)
모바일, 태블릿 해상도 화면 깨짐과 가로 스크롤 넘침(Horizontal Overflow) 현상이 발생했을 때 이를 해결하고 다차원 뷰포트에서 안정성을 검증하는 반응형 전문 수정 루프입니다.

## 2. Trigger conditions (트리거 조건)
* 반응형 깨짐 또는 모바일 화면 레이아웃 이상 버그가 발견되었을 때.

## 3. Required reading order (필수 독해 순서)
1. [docs/RESPONSIVE_RULES.template.md](file:///D:/Design_AI_Harness/docs/RESPONSIVE_RULES.template.md)
2. `system/issue_log.md`

## 4. Step-by-step execution (단계별 실행 절차)
1. **해상도 재현**: 브라우저 뷰포트를 모바일 규격(`360px` 또는 `375px`) 및 태블릿 규격(`768px`)으로 지정해 레이아웃 깨짐 현상을 직접 캡처합니다.
2. **원인 규명**: 고정 픽셀 값(`width: 600px` 등) 사용 지점, 패딩 과다, 혹은 Flex wrap 미지정 위치를 확인합니다.
3. **가로 넘침(Overflow) 방지 패치**: 미디어 쿼리 조정이나 가변 그리드(`%`, `fr`, `vw` 등) 및 `max-width: 100%`를 CSS에 반영합니다.
4. **해상도별 검증**: 모바일, 태블릿, 데스크톱 각각의 너비에서 가로 스크롤바가 나타나지 않으며 텍스트가 겹치지 않는지 다시 확인합니다.

## 5. Evidence required (요구 증적)
* 세 가지 해상도(360px, 768px, 1200px)에서의 전/후 화면 대조 스크린샷 증적.

## 6. Verification required (검증 요건)
* 모바일 해상도에서 가로 스크롤 없음(`Horizontal Scroll Bar = None`) 확인.

## 7. Human stop conditions (휴먼 중단 조건)
* 브라우저 뷰포트 제어 스크립트 실행이 차단되거나, 지원 해상도 변경 요건이 기본 하네스 범위를 초과할 때.

## 8. Loop limit (루프 제한)
* 최대 3회 수정 루프 제한.

## 9. Handoff/update requirements (인계/업데이트 요건)
* 검격 완료 시 `system/verification_log.md`에 결과를 기입하고 `State Manager`로 인계.
