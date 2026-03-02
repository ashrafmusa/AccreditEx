[CmdletBinding()]
Param(
    [string]$Message = "Agentica Heartbeat: Task Failed!",
    [string]$Sound = "Hand" # System sounds: Asterisk, Beep, Exclamation, Hand, Question
)

# Play system sound
Write-Host "--- Playing System Alert ($Sound) ---"
[System.Media.SystemSounds]::$Sound.Play()

# Optional: Show Windows Toast if possible (requires BurntToast or specific PowerShell modules)
# For now, we use a simple popup or just the audio + console message
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show($Message, "Agentica Alert", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
