# Active Worker Status (활성 작업자 정의서)

* **정의**: 현재 파일 쓰기 및 편집 권한을 물리적/논리적으로 독점 소유하고 있는 단일 에이전트 식별자입니다.

---

## 1. 현재 권한자 (Active Worker)
* **Authorized Model / Worker ID**: `None`
* **Lock Acquired At**: `None`
* **Status**: `IDLE / WAITING_FOR_TASK`

## 2. 작업자 수칙
* 활성 작업자 ID로 명시되지 않은 다른 병렬 에이전트들은 어떠한 파일 편집도 수행할 수 없으며, 오직 읽기 전용 검토, 기획 설계 피드백, 또는 아키텍처 조언만 수행할 수 있습니다.
* 작업 인계 시에는 [swap_worker.md](file:///D:/Design_AI_Harness/workflows/swap_worker.md) 절차에 의해 이 파일의 Authorized Model ID를 갱신해야 합니다.
