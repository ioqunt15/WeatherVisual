#!/bin/bash
# verify_no_destructive_commands.sh - 실행하려는 명령어 안전 검사 스크립트

COMMAND_LINE="$1"

if [ -z "$COMMAND_LINE" ]; then
    echo "검사할 명령어 문자열을 인수로 입력하십시오."
    exit 1
fi

echo -e "\033[36m=== 실행 예정 커맨드 검격 시작 ===\033[0m"
echo -e "  - Command: $COMMAND_LINE"

UNSAFE_PATTERNS=(
    "rm -rf"
    "del /f"
    "format [a-zA-Z]:"
    "git reset --hard"
    "git clean -fd"
    "Remove-Item.*-Recurse"
    "mkfs"
    "fdisk"
    "dd if="
)

IS_UNSAFE=0

for PATTERN in "${UNSAFE_PATTERNS[@]}"; do
    if echo "$COMMAND_LINE" | grep -qE "$PATTERN"; then
        IS_UNSAFE=1
        echo -e "\033[31m[FAIL] 파괴적/위험 패턴 검출 ($PATTERN)! 실행이 엄격히 차단됩니다.\033[0m"
        break
    fi
done

if [ "$IS_UNSAFE" -eq 0 ]; then
    echo -e "\033[32m[OK] 안전 검증 통과 - 해당 명령어는 안전합니다.\033[0m"
    exit 0
else
    exit 1
fi
