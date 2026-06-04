# print_handoff.ps1 - 에이전트 인계용 Handoff 프롬프트 렌더링 스크립트

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$StatePath = Join-Path $ScriptDir "..\system\state.md"
$LocksPath = Join-Path $ScriptDir "..\system\locks.md"

if (Test-Path $StatePath) {
    $State = Get-Content $StatePath -Raw
    
    $Objective = ""
    $Role = ""
    $Workflow = ""
    
    if ($State -match 'Current Objective.*?\s*:\s*"([^"]+)"') { $Objective = $Matches[1] }
    if ($State -match 'Current Role.*?\s*:\s*"([^"]+)"') { $Role = $Matches[1] }
    if ($State -match 'Current Workflow.*?\s*:\s*"([^"]+)"') { $Workflow = $Matches[1] }
    
    $Locks = "없음"
    if (Test-Path $LocksPath) {
        $LocksContent = Get-Content $LocksPath -Raw
        $LockLines = $LocksContent -split "`n" | Where-Object { $_ -match '\.(md|js|ts|css|html)' -and -not ($_ -match 'locked_file_path') }
        if ($LockLines) {
            $Locks = $LockLines -join ", "
        }
    }
    
    # Render Handoff prompt
    $Handoff = @"
=================== AGENT HANDOFF PROMPT ===================
이 프로젝트는 디자인 우선 AI 개발 하네스를 적용하여 관리 중입니다.
당신은 새로운 활성 작업자(Active Worker)이며, 이전의 채팅 대화 맥락이 초기화된 상태에서 이어서 작업을 실행해야 합니다.

아래 지시 사항을 따르십시오:
1. D:\Design_AI_Harness\AGENTS.md의 읽기 우선 순위를 통해 하네스 기본 수칙을 독독하십시오.
2. system/state.md를 로드하여 현재 목표, 역할(Current Role), 워크플로우(Current Workflow)를 확인하십시오.
3. system/locks.md를 로드하여 당신의 작업 대상 파일에 락이 획득되었는지 검증하십시오.
4. 이전 완료 기록은 무시하고, system/state.md 상의 'In-Progress Work'에 기재된 부분부터 재계획 없이 즉시 이행하십시오.

현재 시스템 스냅샷:
- **Current Objective**: $Objective
- **Current Role**: $Role
- **Current Workflow**: $Workflow
- **Locks Status**: $Locks
============================================================
"@
    Write-Output $Handoff
} else {
    Write-Error "state.md가 유실되어 Handoff 프롬프트를 빌드할 수 없습니다."
}
