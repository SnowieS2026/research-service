$ErrorActionPreference = 'Continue'
$start = Get-Date
$logFile = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\scan-out.log"
$errFile = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\scan-err.log"

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting..."

$proc = Start-Process -FilePath "node" `
  -ArgumentList "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\run-active-scan.js" `
  -WorkingDirectory "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline" `
  -NoNewWindow `
  -PassThru `
  -RedirectStandardOutput $logFile `
  -RedirectStandardError $errFile

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] PID: $($proc.Id)"

$timedOut = -not $proc.WaitForExit(480000)

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Exit: $($proc.ExitCode), timedOut: $timedOut"
Write-Host "=== STDOUT ==="
if (Test-Path $logFile) { Get-Content $logFile }
else { Write-Host "(empty or not found)" }
Write-Host "=== STDERR ==="
if (Test-Path $errFile) { Get-Content $errFile }
else { Write-Host "(empty or not found)" }
