# PowerShell script to add id property to Standard interface
$content = Get-Content "types.ts" -Raw
$pattern = "export interface Standard \{`r`n  programId:"
$replacement = "export interface Standard {`r`n  id: string;`r`n  programId:"
$content = $content -replace [regex]::Escape($pattern), $replacement
$content | Set-Content "types.ts" -NoNewline
