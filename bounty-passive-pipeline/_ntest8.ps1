$env:GOOGLE_API_KEY = ''
$outFile = "$env:TEMP\nt.jsonl"
$errFile = "$env:TEMP\nt.err"
Remove-Item $outFile, $errFile -EA SilentlyContinue

# Try nuclei without templates (should fail with FTL error)
$proc = Start-Process -FilePath "C:\Users\bryan\go\bin\nuclei.exe" `
  -ArgumentList "-u","https://okta.com","-json-export",$outFile,"-nc","-timeout","10" `
  -NoNewWindow -Wait -PassThru -RedirectStandardError $errFile
Write-Host "no-templates exit: $($proc.ExitCode)"
if (Test-Path $errFile) { $e = Get-Content $errFile -Raw; Write-Host "stderr: $e" }
if (Test-Path $outFile) { Write-Host "output: $((Get-Item $outFile).Length)"; Remove-Item $outFile }
