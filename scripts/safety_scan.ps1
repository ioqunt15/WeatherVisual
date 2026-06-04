# safety_scan.ps1 - 위험 명령어 사용 검출 스크립트

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$HarnessRoot = Split-Path $ScriptDir -Parent

Write-Host "=== 위험 명령어 안전 스캔 시작 ===" -ForegroundColor Cyan

# Scan all files under D:\Design_AI_Harness
$Files = Get-ChildItem -Path $HarnessRoot -Recurse -File | Where-Object { $_.Extension -match "\.ps1|\.sh|\.md|\.json" }

$DestructivePatterns = @(
    "rm\s+-rf",
    "del\s+/f",
    "format\s+[a-zA-Z]:",
    "git\s+reset\s+--hard",
    "git\s+clean\s+-fd",
    "Remove-Item\s+.*-Recurse\s+-Force"
)

$ViolationsCount = 0

foreach ($File in $Files) {
    $Content = Get-Content $File.FullName
    $LineNumber = 1
    foreach ($Line in $Content) {
        foreach ($Pattern in $DestructivePatterns) {
            if ($Line -match $Pattern) {
                Write-Warning "[WARN] 파괴적 패턴 검출 ($Pattern):"
                Write-Host "  - 파일: $($File.FullName)" -ForegroundColor Yellow
                Write-Host "  - 줄 번호: $LineNumber" -ForegroundColor Yellow
                Write-Host "  - 내용: $Line" -ForegroundColor Gray
                $ViolationsCount++
            }
        }
        $LineNumber++
    }
}

if ($ViolationsCount -eq 0) {
    Write-Host "[OK] 안전 스캔 통과 - 파괴적인 명령어가 발견되지 않았습니다." -ForegroundColor Green
} else {
    Write-Warning "[WARN] 총 $ViolationsCount 건의 위험 의심 명령어 패턴이 발견되었습니다. 주의하십시오."
}

Write-Host "=== 스캔 완료 ===" -ForegroundColor Cyan
