$srcDir = "d:\_Projects\accreditex\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.tsx", "*.ts"
$changedFiles = 0

$patterns = @(
    @{p = '\bfrom-(purple|violet|teal|indigo)-\d+\b'; r = 'from-brand-primary' },
    @{p = '\bto-(purple|violet|teal|indigo)-\d+\b'; r = 'to-brand-primary/80' },
    @{p = '\bto-blue-\d+\b'; r = 'to-brand-primary/80' },
    @{p = '\bvia-(purple|violet|teal|indigo)-\d+\b'; r = 'via-brand-primary/50' },
    @{p = '\bbg-(purple|violet|teal|indigo)-50\b'; r = 'bg-brand-primary/5' },
    @{p = '\bbg-(purple|violet|teal|indigo)-[12]00\b'; r = 'bg-brand-primary/10' },
    @{p = '\bbg-(purple|violet|teal|indigo)-[345]00\b'; r = 'bg-brand-primary/70' },
    @{p = '\bbg-(purple|violet|teal|indigo)-[67]00\b'; r = 'bg-brand-primary' },
    @{p = '\bbg-(purple|violet|teal|indigo)-[89]00\b'; r = 'bg-brand-primary/90' },
    @{p = '\bbg-(purple|violet|teal|indigo)-950\b'; r = 'bg-brand-primary/95' },
    @{p = '\bhover:bg-(purple|violet|teal|indigo)-[12]00\b'; r = 'hover:bg-brand-primary/20' },
    @{p = '\bhover:bg-(purple|violet|teal|indigo)-[345]00\b'; r = 'hover:bg-brand-primary/80' },
    @{p = '\bhover:bg-(purple|violet|teal|indigo)-[67]00\b'; r = 'hover:bg-brand-primary/90' },
    @{p = '\bhover:bg-(purple|violet|teal|indigo)-[89]00\b'; r = 'hover:bg-brand-primary' },
    @{p = '\bdark:bg-(purple|violet|teal|indigo)-\d+\b'; r = 'dark:bg-brand-primary/20' },
    @{p = '\btext-(purple|violet|teal|indigo)-50\b'; r = 'text-brand-primary/40' },
    @{p = '\btext-(purple|violet|teal|indigo)-[12]00\b'; r = 'text-brand-primary/60' },
    @{p = '\btext-(purple|violet|teal|indigo)-[3-9]\d{2}\b'; r = 'text-brand-primary' },
    @{p = '\bhover:text-(purple|violet|teal|indigo)-\d+\b'; r = 'hover:text-brand-primary' },
    @{p = '\bdark:text-(purple|violet|teal|indigo)-[12]00\b'; r = 'dark:text-brand-primary/60' },
    @{p = '\bdark:text-(purple|violet|teal|indigo)-[3-9]\d{2}\b'; r = 'dark:text-brand-primary' },
    @{p = '\bborder-(purple|violet|teal|indigo)-\d+\b'; r = 'border-brand-primary/40' },
    @{p = '\bhover:border-(purple|violet|teal|indigo)-\d+\b'; r = 'hover:border-brand-primary' },
    @{p = '\bfocus:border-(purple|violet|teal|indigo)-\d+\b'; r = 'focus:border-brand-primary' },
    @{p = '\bdark:border-(purple|violet|teal|indigo)-\d+\b'; r = 'dark:border-brand-primary/20' },
    @{p = '\bfocus:ring-(purple|violet|teal|indigo)-\d+\b'; r = 'focus:ring-brand-primary' },
    @{p = '\bring-(purple|violet|teal|indigo)-\d+\b'; r = 'ring-brand-primary' }
)

foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file.FullName)
    $orig = $text
    foreach ($pat in $patterns) {
        $text = [regex]::Replace($text, $pat.p, $pat.r)
    }
    if ($text -ne $orig) {
        [System.IO.File]::WriteAllText($file.FullName, $text)
        $changedFiles++
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "`nTotal files updated: $changedFiles"
