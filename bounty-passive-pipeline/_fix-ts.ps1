$ErrorActionPreference = 'Stop'
$file = 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\src\scanner\NucleiScanner.ts'
$lines = Get-Content $file
# Line 145 (1-indexed) is: if (e.name === 'TimeoutError' || e.code === 'ETIMEDOUT')
$lines[144] = $lines[144] -replace 'e\.code === ''ETIMEDOUT''', "(e.code != null && e.code !== 0)"
Set-Content -Path $file -Value $lines -NoNewline
Write-Host "Fixed line 145"
