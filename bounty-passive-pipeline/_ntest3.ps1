$env:GOOGLE_API_KEY = ''
$outFile = "$env:TEMP\nt.jsonl"
$errFile = "$env:TEMP\nt.err"
$proc = Start-Process -FilePath "C:\Users\bryan\go\bin\nuclei.exe" `
  -ArgumentList "-u","https://okta.com","-t","C:\Users\bryan\.nuclei-templates\http\vulnerabilities","-json-export",$outFile,"-silent","-nc","-rl","20","-timeout","30" `
  -NoNewWindow -Wait -PassThru -RedirectStandardError $errFile
Write-Host "exit: $($proc.ExitCode)"
if (Test-Path $outFile) { Write-Host "file size: $((Get-Item $outFile).Length)"; Remove-Item $outFile } else { Write-Host "no output" }
if (Test-Path $errFile) { $e = Get-Content $errFile -Raw; if ($e) { Write-Host "stderr: $e" }; Remove-Item $errFile }
