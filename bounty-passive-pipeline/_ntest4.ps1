$env:GOOGLE_API_KEY = ''
$outFile = "$env:TEMP\nt.jsonl"
$errFile = "$env:TEMP\nt.err"
$proc = Start-Process -FilePath "C:\Users\bryan\go\bin\nuclei.exe" `
  -ArgumentList "-u","https://okta.com","-t","C:\Users\bryan\.nuclei-templates\http\vulnerabilities\cimd-file-upload.yaml","-json-export",$outFile,"-nc","-rl","20","-timeout","15" `
  -NoNewWindow -Wait -PassThru -RedirectStandardError $errFile
Write-Host "exit: $($proc.ExitCode)"
if (Test-Path $outFile) { Write-Host "file size: $((Get-Item $outFile).Length)"; Get-Content $outFile | Select-Object -First 3; Remove-Item $outFile } else { Write-Host "no output" }
if (Test-Path $errFile) { $e = Get-Content $errFile -Raw; if ($e) { Write-Host "stderr: $e" }; Remove-Item $errFile }
