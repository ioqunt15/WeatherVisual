# check.ps1 - 하네스 시스템 및 잠금 무결성 진단 스크립트

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$StatePath = Join-Path $ScriptDir "..\system\state.md"
$LocksPath = Join-Path $ScriptDir "..\system\locks.md"

Write-Host "=== 하네스 무결성 진단 시작 ===" -ForegroundColor Cyan

if (Test-Path $StatePath) {
    Write-Host "[OK] state.md 파일이 존재합니다." -ForegroundColor Green
    $StateContent = Get-Content $StatePath -Raw
    if ($StateContent -match 'Current Role\s*:\s*"([^"]+)"') {
        Write-Host "  - 활성 역할: $($Matches[1])" -ForegroundColor Gray
    }
} else {
    Write-Warning "[FAIL] state.md 파일이 유실되었습니다."
}

if (Test-Path $LocksPath) {
    Write-Host "[OK] locks.md 파일이 존재합니다." -ForegroundColor Green
    $LocksContent = Get-Content $LocksPath -Raw
    $LockLines = $LocksContent -split "`n" | Where-Object { $_ -match '\|' }
    # Check if there are locks (lines containing files other than headers and dividers)
    $ActiveLocksCount = 0
    foreach ($Line in $LockLines) {
        if ($Line -match '\.(md|js|ts|css|html)' -and -not ($Line -match 'locked_file_path')) {
            $ActiveLocksCount++
            Write-Host "  - 활성 잠금 검출: $Line" -ForegroundColor Yellow
        }
    }
    Write-Host "  - 현재 총 잠금 파일 수: $ActiveLocksCount" -ForegroundColor Gray
} else {
    Write-Warning "[FAIL] locks.md 파일이 유실되었습니다."
}

Write-Host "=== 진단 완료 ===" -ForegroundColor Cyan
