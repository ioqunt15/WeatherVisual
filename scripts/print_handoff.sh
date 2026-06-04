#!/bin/bash
# print_handoff.sh - 에이전트 인계용 Handoff 프롬프트 렌더링 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_PATH="$SCRIPT_DIR/../system/state.md"
LOCKS_PATH="$SCRIPT_DIR/../system/locks.md"

if [ -f "$STATE_PATH" ]; then
    OBJECTIVE=$(grep -oE "Current Objective.*:\s*\"[^\"]+\"" "$STATE_PATH" | head -n 1 | cut -d'"' -f2)
    ROLE=$(grep -oE "Current Role.*:\s*\"[^\"]+\"" "$STATE_PATH" | head -n 1 | cut -d'"' -f2)
    WORKFLOW=$(grep -oE "Current Workflow.*:\s*\"[^\"]+\"" "$STATE_PATH" | head -n 1 | cut -d'"' -f2)
    
    LOCKS="없음"
    if [ -f "$LOCKS_PATH" ]; then
        ACTIVE_LOCKS=$(grep -iE "\.(md|js|ts|css|html)" "$LOCKS_PATH" | grep -v "locked_file_path" | paste -sd ", " -)
        if [ -n "$ACTIVE_LOCKS" ]; then
            LOCKS="$ACTIVE_LOCKS"
        fi
    fi
    
    echo "=================== AGENT HANDOFF PROMPT ==================="
    echo "이 프로젝트는 디자인 우선 AI 개발 하네스를 적용하여 관리 중입니다."
    echo "당신은 새로운 활성 작업자(Active Worker)이며, 이전의 채팅 대화 맥락이 초기화된 상태에서 이어서 작업을 실행해야 합니다."
    echo ""
    echo "아래 지시 사항을 따르십시오:"
    echo "1. D:\Design_AI_Harness\AGENTS.md의 읽기 우선 순위를 통해 하네스 기본 수칙을 독독하십시오."
    echo "2. system/state.md를 로드하여 현재 목표, 역할(Current Role), 워크플로우(Current Workflow)를 확인하십시오."
    echo "3. system/locks.md를 로드하여 당신의 작업 대상 파일에 락이 획득되었는지 검증하십시오."
    echo "4. 이전 완료 기록은 무시하고, system/state.md 상의 'In-Progress Work'에 기재된 부분부터 재계획 없이 즉시 이행하십시오."
    echo ""
    echo "현재 시스템 스냅샷:"
    echo "- **Current Objective**: $OBJECTIVE"
    echo "- **Current Role**: $ROLE"
    echo "- **Current Workflow**: $WORKFLOW"
    echo "- **Locks Status**: $LOCKS"
    echo "============================================================"
else
    echo "state.md가 유실되어 Handoff 프롬프트를 빌드할 수 없습니다."
fi
