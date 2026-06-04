#!/bin/bash
# file_size_audit.sh - 소스 파일 크기 검격 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$SCRIPT_DIR/.."

echo -e "\033[36m=== 파일 크기 감사(Audit) 시작 ===\033[0m"

WARN_LINES=300
LIMIT_LINES=500
WARN_SIZE_KB=12
LIMIT_SIZE_KB=20

VIOLATIONS=0

find "$HARNESS_ROOT" -type f \( -name "*.md" -o -name "*.js" -o -name "*.ts" -o -name "*.css" -o -name "*.html" \) | while read -r FILE; do
    LINES=$(wc -l < "$FILE")
    SIZE_B=$(wc -c < "$FILE")
    SIZE_KB=$((SIZE_B / 1024))
    
    STATUS="Normal"
    COLOR="\033[32m" # Green
    
    if [ "$LINES" -ge "$LIMIT_LINES" ] || [ "$SIZE_KB" -ge "$LIMIT_SIZE_KB" ]; then
        STATUS="LIMIT (VIOLATION)"
        COLOR="\033[31m" # Red
        ((VIOLATIONS++))
    elif [ "$LINES" -ge "$WARN_LINES" ] || [ "$SIZE_KB" -ge "$WARN_SIZE_KB" ]; then
        STATUS="WARN"
        COLOR="\033[33m" # Yellow
    fi
    
    if [ "$STATUS" != "Normal" ]; then
        echo -e "  - File: $FILE"
        echo -e "    ${COLOR}줄 수: $LINES / 크기: $SIZE_KB KB\033[0m"
        echo -e "    ${COLOR}상태: $STATUS\033[0m"
        if [ "$STATUS" == "LIMIT (VIOLATION)" ]; then
            echo -e "    \033[31m-> 조치 요구사항: FILE_SIZE_POLICY.template.md에 따라 즉시 분할 리팩토링 계획을 수립하십시오.\033[0m"
        fi
        echo ""
    fi
done

if [ "$VIOLATIONS" -eq 0 ]; then
    echo -e "\033[32m[OK] 모든 파일이 크기 제한 범위 내에 존재합니다.\033[0m"
else
    echo -e "\033[33m[WARN] 크기 위반 파일이 검출되었습니다.\033[0m"
fi

echo -e "\033[36m=== 감사 완료 ===\033[0m"
