$ErrorActionPreference = 'Stop'
$git = 'C:\Users\bryan\.openclaw\workspace'
$dst = "$git\bounty-passive-pipeline\vehicle-osint.py"

$content = git -C $git show "HEAD~1:bounty-passive-pipeline/vehicle-osint.py"
[System.IO.File]::WriteAllText($dst, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Written $((Get-Item $dst).Length) bytes"
