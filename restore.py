$ErrorActionPreference = 'Stop'
$git = 'C:\Users\bryan\.openclaw\workspace'
$dst = "$git\bounty-passive-pipeline\vehicle-osint.py"

# Get content from git (no BOM)
$content = git -C $git show "HEAD~1:bounty-passive-pipeline/vehicle-osint.py"
# Write with UTF-8 encoding (no BOM)
[System.IO.File]::WriteAllText($dst, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Written $(Get-Item $dst).Length bytes"

# Verify syntax
try {
    $null = [System.Management.Automation.Language.Parser]::ParseFile($dst, [ref]$null, [ref]$null)
    Write-Host "Syntax OK"
} catch {
    Write-Host "Syntax error: $_"
}
