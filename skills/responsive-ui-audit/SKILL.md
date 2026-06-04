---
name: responsive-ui-audit
description: 모바일 해상도 화면 깨짐과 가로 스크롤 생성 버그를 진단하는 스킬
---

# Responsive UI Audit Skill (반응형 UI 감사 스킬)

## 1. Trigger conditions (트리거 조건)
* 모바일 레이아웃 최적화 진단 및 화면 넘침 이상이 발견되었을 때.

## 2. Inputs (입력)
* `docs/RESPONSIVE_RULES.template.md` 및 브라우저 너비 스펙.

## 3. Procedure (과정)
1. 뷰포트를 모바일 사양(360px)으로 좁힌 뒤 화면 우측에 숨은 가로 스크롤바가 생기는지 검사합니다.
2. 테이블이나 넓은 카드 리스트가 vertical(세로) 배치로 안전하게 꺾이거나 오버플로우 스크롤 컨테이너에 잠기는지 확인합니다.
3. 모바일 환경 가독성을 위한 최소 텍스트 크기(14px) 충족 여부를 확인합니다.

## 4. Outputs (출력)
* `system/issue_log.md` 반응형 이상 기록 또는 해결 스크린샷 증적.

## 5. Verification (검증 요건)
* `Horizontal Scroll Value = None` 검증 확인.

## 6. Failure handling (실패 처리)
* 가로 넘침 수정 실패 시, 반응형 전용 수정 루프(`responsive_fix_loop.md`)를 통해 락 설정 후 CSS 복구를 유도합니다.

## 7. Token-saving behavior (토큰 절약 행동)
* 기획이나 DB 스키마 문서는 일체 컨텍스트에서 드롭합니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md`의 반응형 진단 통과 상태 기록.
