$env:GOOGLE_API_KEY = ''
$outFile = "$env:TEMP\nt.jsonl"
$errFile = "$env:TEMP\nt.err"
Remove-Item $outFile -EA SilentlyContinue
Remove-Item $errFile -EA SilentlyContinue

# Use exposed-panels template dir (more likely to match than vulnerabilities)
$proc = Start-Process -FilePath "C:\Users\bryan\go\bin\nuclei.exe" `
  -ArgumentList "-u","https://okta.com","-t","C:\Users\bryan\.nuclei-templates\http\exposed-panels","-json-export",$outFile,"-nc","-rl","20","-timeout","30" `
  -NoNewWindow -Wait -PassThru -RedirectStandardError $errFile

Write-Host "exit: $($proc.ExitCode)"
if (Test-Path $outFile) {
  $sz = (Get-Item $outFile).Length
  Write-Host "output: $sz bytes"
  if ($sz -gt 0) { Get-Content $outFile | Select-Object -First 3 }
  Remove-Item $outFile
} else {
  Write-Host "NO output file (normal when no findings)"
}
if (Test-Path $errFile) {
  $e = Get-Content $errFile -Raw
  if ($e) { Write-Host "--- stderr ---"; Write-Host $e }
  Remove-Item $errFile
}
