$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$proc = Start-Process -FilePath "node" -ArgumentList "dist/src/osint/index.js","--osint","vehicle","KY05YTJ" -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\vehicle_out.txt" -RedirectStandardError "$env:TEMP\vehicle_err.txt" -WorkingDirectory "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline"
$null = $proc.WaitForExit()
Write-Host "Exit code: $($proc.ExitCode)"
Write-Host "STDOUT bytes: $((Get-Content "$env:TEMP\vehicle_out.txt" -Raw).Length)"
Write-Host "STDERR bytes: $((Get-Content "$env:TEMP\vehicle_err.txt" -Raw).Length)"
if ((Get-Content "$env:TEMP\vehicle_out.txt" -Raw) -ne "") { Get-Content "$env:TEMP\vehicle_out.txt" | Select-Object -First 5 }
if ((Get-Content "$env:TEMP\vehicle_err.txt" -Raw) -ne "") { Get-Content "$env:TEMP\vehicle_err.txt" | Select-Object -First 5 }
