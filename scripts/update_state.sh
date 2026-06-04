#!/bin/bash
# update_state.sh - 하네스 상태값 갱신 자동화 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_PATH="$SCRIPT_DIR/../system/state.md"
LASTRUN_PATH="$SCRIPT_DIR/../system/LAST_RUN.md"

OBJECTIVE=""
ROLE=""
WORKFLOW=""
WORKER="Antigravity"
TASKID="TASK-001"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -Objective) OBJECTIVE="$2"; shift ;;
        -Role) ROLE="$2"; shift ;;
        -Workflow) WORKFLOW="$2"; shift ;;
        -Worker) WORKER="$2"; shift ;;
        -TaskId) TASKID="$2"; shift ;;
    esac
    shift
done

echo -e "\033[36m=== 시스템 상태 업데이트 시작 ===\033[0m"

if [ -f "$STATE_PATH" ]; then
    if [ -n "$OBJECTIVE" ]; then
        sed -i -E "s/(Current Objective.*:\s*)\"[^\"]*\"/\1\"$OBJECTIVE\"/g" "$STATE_PATH"
    fi
    if [ -n "$ROLE" ]; then
        sed -i -E "s/(Current Role.*:\s*)\"[^\"]*\"/\1\"$ROLE\"/g" "$STATE_PATH"
    fi
    if [ -n "$WORKFLOW" ]; then
        sed -i -E "s/(Current Workflow.*:\s*)\"[^\"]*\"/\1\"$WORKFLOW\"/g" "$STATE_PATH"
    fi
    if [ -n "$WORKER" ]; then
        sed -i -E "s/(Current Worker.*:\s*)\"[^\"]*\"/\1\"$WORKER\"/g" "$STATE_PATH"
    fi
    if [ -n "$TASKID" ]; then
        sed -i -E "s/(Current Task ID.*:\s*)\"[^\"]*\"/\1\"$TASKID\"/g" "$STATE_PATH"
    fi
    
    TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S%z")
    sed -i -E "s/(Last Updated.*:\s*)\"[^\"]*\"/\1\"$TIMESTAMP\"/g" "$STATE_PATH"
    echo -e "\033[32m[OK] state.md 업데이트 완료.\033[0m"
fi

if [ -f "$LASTRUN_PATH" ]; then
    TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%S%z")
    cat <<EOF > "$LASTRUN_PATH"
# Last Run Log (최종 실행 로그)

* **최종 동기화 정보**: 마지막으로 실행된 AI 작업자의 마감 로그입니다.

---

## 1. 최근 실행 요약 (Latest Execution)
* **Timestamp**: $TIMESTAMP
* **Worker**: $WORKER
* **Assigned Role**: $ROLE
* **Status**: SUCCESS
* **Summary of Changes**:
  - 태스크 갱신 기동: $OBJECTIVE ($TASKID)
  - 워크플로우 활성화: $WORKFLOW

## 2. 다음 실행 예비 지침 (Next Action Instructions)
* 해당 워크플로우에 할당된 ($ROLE) 역할을 개시하십시오.
EOF
    echo -e "\033[32m[OK] LAST_RUN.md 업데이트 완료.\033[0m"
fi

echo -e "\033[36m=== 상태 업데이트 종료 ===\033[0m"
