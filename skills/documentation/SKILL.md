---
name: documentation
description: 프로젝트 산출물 문서 목록 및 링크의 무결성을 최신화하고 장황함을 차단하는 스킬
---

# Documentation Skill (문서 관리 스킬)

## 1. Trigger conditions (트리거 조건)
* 태스크 완료 릴리즈 전 최종 문서 정리 지시 시, 또는 정기 문서 동기화 단계.

## 2. Inputs (입력)
* `docs/INDEX.md` 및 `system/file_inventory.md`

## 3. Procedure (과정)
1. 문서 내 구구절절하게 길어진 사설이나 장황한 요약은 Bullet points와 표 형식으로 다이어트(Compress)합니다.
2. 모든 Markdown 로컬 링크(`file:///...`)가 유효하게 연결되어 작동하는지 정합성을 대조 스캔합니다.
3. 신규 추가되거나 제거된 파일들을 `system/file_inventory.md` 목록에 반영합니다.

## 4. Outputs (출력)
* 최신화 완료된 `docs/INDEX.md` 및 `system/file_inventory.md`

## 5. Verification (검증 요건)
* 문서 내 깨진 링크(Broken Link) 수 = 0 확인.

## 6. Failure handling (실패 처리)
* 링크 검증 실패 시 수정을 보류하고 경고 로그를 출력한 후 재갱신 시도.

## 7. Token-saving behavior (토큰 절약 행동)
* 문서를 최신화할 때는 소스 코드 본문을 전혀 로드하지 않고 메타 정보만 사용합니다.

## 8. Required state updates (필수 상태 업데이트)
* `system/state.md` 기입 업데이트 완료.
---
