$outFile = "$env:TEMP\cf-out.log"
$errFile = "$env:TEMP\cf-err.log"
$proc = Start-Process -FilePath "C:\Users\bryan\.openclaw\cloudflared.exe" -ArgumentList "tunnel","--no-autoupdate","--url","http://localhost:18789" -PassThru -RedirectStandardOutput $outFile -RedirectStandardError $errFile -WindowStyle Hidden
Start-Sleep 15
if (Test-Path $errFile) { Get-Content $errFile | Select-Object -Last 20 }
Write-Host "---PID: $($proc.Id), HasExited: $($proc.HasExited)---"
