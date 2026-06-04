# update_state.ps1 - 하네스 상태값 갱신 자동화 스크립트
# Usage: .\update_state.ps1 -Objective "신규 기능 개발" -Role "frontend-implementer" -Workflow "design_first_feature_loop"

param (
    [string]$Objective,
    [string]$Role,
    [string]$Workflow,
    [string]$Worker = "Antigravity",
    [string]$TaskId = "TASK-001"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$StatePath = Join-Path $ScriptDir "..\system\state.md"
$LastRunPath = Join-Path $ScriptDir "..\system\LAST_RUN.md"

Write-Host "=== 시스템 상태 업데이트 시작 ===" -ForegroundColor Cyan

if (Test-Path $StatePath) {
    $Content = Get-Content $StatePath -Raw
    
    if ($Objective) {
        $Content = $Content -replace '(Current Objective.*?\s*:\s*)"[^"]*"', "`$1`"$Objective`""
    }
    if ($Role) {
        $Content = $Content -replace '(Current Role.*?\s*:\s*)"[^"]*"', "`$1`"$Role`""
    }
    if ($Workflow) {
        $Content = $Content -replace '(Current Workflow.*?\s*:\s*)"[^"]*"', "`$1`"$Workflow`""
    }
    if ($Worker) {
        $Content = $Content -replace '(Current Worker.*?\s*:\s*)"[^"]*"', "`$1`"$Worker`""
    }
    if ($TaskId) {
        $Content = $Content -replace '(Current Task ID.*?\s*:\s*)"[^"]*"', "`$1`"$TaskId`""
    }
    
    $Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
    $Content = $Content -replace '(Last Updated.*?\s*:\s*)"[^"]*"', "`$1`"$Timestamp`""
    
    Set-Content -Path $StatePath -Value $Content -Encoding UTF8
    Write-Host "[OK] state.md 업데이트 완료." -ForegroundColor Green
}

# Update LAST_RUN.md
if (Test-Path $LastRunPath) {
    $LastRunContent = @"
# Last Run Log (최종 실행 로그)

* **최종 동기화 정보**: 마지막으로 실행된 AI 작업자의 마감 로그입니다.

---

## 1. 최근 실행 요약 (Latest Execution)
* **Timestamp**: $(Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
* **Worker**: $Worker
* **Assigned Role**: $Role
* **Status**: SUCCESS
* **Summary of Changes**:
  - 태스크 갱신 기동: $Objective ($TaskId)
  - 워크플로우 활성화: $Workflow

## 2. 다음 실행 예비 지침 (Next Action Instructions)
* 해당 워크플로우에 할당된 ($Role) 역할을 개시하십시오.
"@
    Set-Content -Path $LastRunPath -Value $LastRunContent -Encoding UTF8
    Write-Host "[OK] LAST_RUN.md 업데이트 완료." -ForegroundColor Green
}

Write-Host "=== 상태 업데이트 종료 ===" -ForegroundColor Cyan
