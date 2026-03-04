#!/usr/bin/env pwsh
# AccrediTex — Manual Fix Recorder
# Queue a structured fix record for Copilot to store in ReasoningBank.
# This is called automatically by the git post-commit hook.
# Use this manually when you want richer detail than a commit message provides.
#
# Usage:
#   .\scripts\record-fix.ps1 `
#     -Task    "Fix Firestore undefined saves in projectService" `
#     -Decision "Added deepCleanUndefined() helper; applied before addDoc/updateDoc" `
#     -Outcome "Runtime error resolved; project saves succeed" `
#     -Tags    "Firestore,projectService,undefined,accreditex" `
#     -Success $true

param(
    [Parameter(Mandatory)][string] $Task,
    [Parameter(Mandatory)][string] $Decision,
    [string] $Outcome = "Fix applied and verified",
    [string] $Tags = "accreditex,fix",
    [bool]   $Success = $true,
    [string] $Files = ""
)

$RepoRoot = git rev-parse --show-toplevel
$Pending = Join-Path $RepoRoot "logs\pending-reasoningbank.jsonl"
$null = New-Item -ItemType Directory -Path (Split-Path $Pending) -Force

# Normalise tags → JSON array
$TagArray = ($Tags -split '[,\s]+').Trim() | Where-Object { $_ } | ForEach-Object { "`"$_`"" }
$TagsJson = "[" + ($TagArray -join ",") + "]"

# Escape quotes
$Task = $Task -replace '"', '\"'
$Decision = $Decision -replace '"', '\"'
$Outcome = $Outcome -replace '"', '\"'
$SuccessStr = if ($Success) { "true" } else { "false" }

$Hash = & git rev-parse --short HEAD 2>$null
$Date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")

$FilesJson = if ($Files) {
    "[" + (($Files -split ',').Trim() | ForEach-Object { "`"$_`"" } ) -join "," + "]"
}
else { "[]" }

$Entry = "{`"hash`":`"$Hash`",`"task`":`"$Task`",`"decision`":`"$Decision`",`"outcome`":`"$Outcome`",`"success`":$SuccessStr,`"tags`":$TagsJson,`"files`":$FilesJson,`"date`":`"$Date`",`"_status`":`"pending`"}"

Add-Content -Path $Pending -Value $Entry

Write-Host ""
Write-Host "✅ Queued to ReasoningBank:" -ForegroundColor Green
Write-Host "   Task     : $Task"
Write-Host "   Decision : $Decision"
Write-Host "   Tags     : $Tags"
Write-Host ""
Write-Host "Copilot will record this at next session start." -ForegroundColor DarkGray
