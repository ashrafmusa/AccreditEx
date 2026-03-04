#!/usr/bin/env pwsh
# AccrediTex — Install Git Hooks
# Sets up the post-commit hook to auto-capture fixes into
# logs/pending-reasoningbank.jsonl for Copilot to process.

$RepoRoot = git rev-parse --show-toplevel
$HooksDir = Join-Path $RepoRoot ".git\hooks"
$SourceHook = Join-Path $RepoRoot "scripts\hooks\post-commit"
$TargetHook = Join-Path $HooksDir "post-commit"

if (-not (Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir | Out-Null
}

# Copy the hook script
Copy-Item -Path $SourceHook -Destination $TargetHook -Force

# On Unix: make executable. On Windows with Git Bash this is handled by git.
if ($IsLinux -or $IsMacOS) {
    chmod +x $TargetHook
}

# Ensure logs dir exists and is tracked
$LogsDir = Join-Path $RepoRoot "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}
$Gitkeep = Join-Path $LogsDir ".gitkeep"
if (-not (Test-Path $Gitkeep)) {
    New-Item -ItemType File -Path $Gitkeep | Out-Null
}

Write-Host ""
Write-Host "✅ Git post-commit hook installed at: $TargetHook" -ForegroundColor Green
Write-Host ""
Write-Host "How it works:" -ForegroundColor Cyan
Write-Host "  Every 'git commit' → parses the message → appends to logs/pending-reasoningbank.jsonl"
Write-Host "  Copilot reads that file at session start and records each entry to ReasoningBank."
Write-Host ""
Write-Host "To manually queue a fix record, run:" -ForegroundColor Cyan
Write-Host "  .\scripts\record-fix.ps1 -Task 'Fix X' -Decision 'Root cause + approach' -Tags 'bug-fix,component'"
