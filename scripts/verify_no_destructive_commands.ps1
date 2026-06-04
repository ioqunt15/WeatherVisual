# verify_no_destructive_commands.ps1 - 실행하려는 명령어 안전 검사 스크립트
# Usage: .\verify_no_destructive_commands.ps1 -CommandLine "git reset --hard"

param (
    [string]$CommandLine
)

if (-not $CommandLine) {
    Write-Error "검사할 CommandLine 매개변수가 필요합니다."
    exit 1
}

Write-Host "=== 실행 예정 커맨드 검격 시작 ===" -ForegroundColor Cyan
Write-Host "  - Command: $CommandLine" -ForegroundColor Gray

$UnsafePatterns = @(
    "rm\s+-rf",
    "del\s+/f",
    "format\s+[a-zA-Z]:",
    "git\s+reset\s+--hard",
    "git\s+clean\s+-fd",
    "Remove-Item\s+.*-Recurse\s+-Force",
    "mkfs",
    "fdisk",
    "dd\s+if="
)

$IsUnsafe = $false

foreach ($Pattern in $UnsafePatterns) {
    if ($CommandLine -match $Pattern) {
        $IsUnsafe = $true
        Write-Error "[FAIL] 파괴적/위험 패턴 검출 ($Pattern)! 실행이 엄격히 차단됩니다."
        break
    }
}

if (-not $IsUnsafe) {
    Write-Host "[OK] 안전 검증 통과 - 해당 명령어는 안전합니다." -ForegroundColor Green
    exit 0
} else {
    exit 1
}
