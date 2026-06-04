# file_size_audit.ps1 - 소스 파일 크기 검격 스크립트

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$HarnessRoot = Split-Path $ScriptDir -Parent

Write-Host "=== 파일 크기 감사(Audit) 시작 ===" -ForegroundColor Cyan

# Define limits
$WarnLines = 300
$LimitLines = 500
$WarnSizeKb = 12
$LimitSizeKb = 20

# Scan D:\Design_AI_Harness directory for code and document files
$Files = Get-ChildItem -Path $HarnessRoot -Recurse -File | Where-Object { $_.Extension -match "\.md|\.js|\.ts|\.css|\.html" }

$Violations = 0

foreach ($File in $Files) {
    $Lines = (Get-Content $File.FullName).Count
    $SizeKb = [Math]::Round(($File.Length / 1KB), 2)
    
    $Status = "Normal"
    $Color = "Green"
    
    if ($Lines -ge $LimitLines -or $SizeKb -ge $LimitSizeKb) {
        $Status = "LIMIT (VIOLATION)"
        $Color = "Red"
        $Violations++
    }
    elseif ($Lines -ge $WarnLines -or $SizeKb -ge $WarnSizeKb) {
        $Status = "WARN"
        $Color = "Yellow"
    }

    if ($Status -ne "Normal") {
        Write-Host "  - File: $($File.FullName)" -ForegroundColor Gray
        Write-Host "    줄 수: $Lines / 크기: $SizeKb KB" -ForegroundColor $Color
        Write-Host "    상태: $Status" -ForegroundColor $Color
        if ($Status -eq "LIMIT (VIOLATION)") {
            Write-Host "    -> 조치 요구사항: FILE_SIZE_POLICY.template.md에 따라 즉시 분할 리팩토링 계획을 수립하십시오." -ForegroundColor Red
        }
        Write-Host ""
    }
}

if ($Violations -eq 0) {
    Write-Host "[OK] 모든 파일이 크기 제한 범위 내에 존재합니다." -ForegroundColor Green
} else {
    Write-Warning "[WARN] 크기 위반 파일이 총 $Violations 건 검출되었습니다."
}

Write-Host "=== 감사 완료 ===" -ForegroundColor Cyan
