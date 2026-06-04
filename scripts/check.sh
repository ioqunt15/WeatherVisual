#!/bin/bash
# check.sh - 하네스 시스템 및 잠금 무결성 진단 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_PATH="$SCRIPT_DIR/../system/state.md"
LOCKS_PATH="$SCRIPT_DIR/../system/locks.md"

echo -e "\033[36m=== 하네스 무결성 진단 시작 ===\033[0m"

if [ -f "$STATE_PATH" ]; then
    echo -e "\033[32m[OK] state.md 파일이 존재합니다.\033[0m"
    ROLE=$(grep -oE "Current Role\s*:\s*\"[^\"]+\"" "$STATE_PATH" | head -n 1)
    echo -e "  - 활성 역할: $ROLE"
else
    echo -e "\033[31m[FAIL] state.md 파일이 유실되었습니다.\033[0m"
fi

if [ -f "$LOCKS_PATH" ]; then
    echo -e "\033[32m[OK] locks.md 파일이 존재합니다.\033[0m"
    # Find active locks (exclude table headers and templates)
    ACTIVE_LOCKS=$(grep -iE "\.(md|js|ts|css|html)" "$LOCKS_PATH" | grep -v "locked_file_path")
    if [ -n "$ACTIVE_LOCKS" ]; then
        echo -e "  - 활성 잠금 검출:\n$ACTIVE_LOCKS"
    else
        echo -e "  - 현재 활성 잠금 파일 없음"
    fi
else
    echo -e "\033[31m[FAIL] locks.md 파일이 유실되었습니다.\033[0m"
fi

echo -e "\033[36m=== 진단 완료 ===\033[0m"
