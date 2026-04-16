$srcDir = "d:\_Projects\accreditex\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.tsx", "*.ts"
$violations = 0

foreach ($file in $files) {
    $c = [System.IO.File]::ReadAllText($file.FullName)
    $m = [regex]::Matches($c, '\b(bg|text|from|to|border|ring|hover:bg|hover:text|focus:ring|dark:bg|dark:text)-(purple|violet|indigo)-\d+\b')
    if ($m.Count -gt 0) {
        Write-Host "$($file.Name): $($m.Count) violations"
        $m | Select-Object -First 3 | ForEach-Object { Write-Host "  - $($_.Value)" }
        $violations += $m.Count
    }
}

Write-Host "`nTotal violations: $violations"
