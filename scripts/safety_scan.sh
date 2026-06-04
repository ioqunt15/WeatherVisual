#!/bin/bash
# safety_scan.sh - 위험 명령어 사용 검출 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$SCRIPT_DIR/.."

echo -e "\033[36m=== 위험 명령어 안전 스캔 시작 ===\033[0m"

DESTRUCTIVE_PATTERNS=(
    "rm -rf"
    "del /f"
    "format [a-zA-Z]:"
    "git reset --hard"
    "git clean -fd"
    "Remove-Item.*-Recurse"
)

VIOLATIONS_COUNT=0

# Scan shell scripts, powershell scripts, and markdown files
find "$HARNESS_ROOT" -type f \( -name "*.sh" -o -name "*.ps1" -o -name "*.md" -o -name "*.json" \) | while read -r FILE; do
    LINE_NO=1
    while read -r LINE; do
        for PATTERN in "${DESTRUCTIVE_PATTERNS[@]}"; do
            if echo "$LINE" | grep -qE "$PATTERN"; then
                echo -e "\033[33m[WARN] 파괴적 패턴 검출 ($PATTERN):\033[0m"
                echo "  - 파일: $FILE"
                echo "  - 줄 번호: $LINE_NO"
                echo "  - 내용: $LINE"
                ((VIOLATIONS_COUNT++))
            fi
        done
        ((LINE_NO++))
    done < "$FILE"
done

if [ "$VIOLATIONS_COUNT" -eq 0 ]; then
    echo -e "\033[32m[OK] 안전 스캔 통과 - 파괴적인 명령어가 발견되지 않았습니다.\033[0m"
else
    echo -e "\033[31m[WARN] 총 $VIOLATIONS_COUNT 건의 위험 의심 명령어 패턴이 발견되었습니다.\033[0m"
fi

echo -e "\033[36m=== 스캔 완료 ===\033[0m"
