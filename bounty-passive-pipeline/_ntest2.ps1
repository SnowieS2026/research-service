$ErrorActionPreference = 'SilentlyContinue'
$env:GOOGLE_API_KEY = ''

$outFile = "$env:TEMP\nuclei-test.jsonl"
$errFile = "$env:TEMP\nuclei-test.err"

$proc = Start-Process -FilePath "C:\Users\bryan\go\bin\nuclei.exe" `
  -ArgumentList "-u","https://okta.com","-t","C:\Users\bryan\.nuclei-templates\http\vulnerabilities","-json-export",$outFile,"-silent","-nc","-rl","20" `
  -NoNewWindow -Wait -PassThru -RedirectStandardError $errFile

Write-Host "exit: $($proc.ExitCode)"
if (Test-Path $outFile) {
  $content = Get-Content $outFile -Raw
  Write-Host "output bytes: $($content.Length)"
  if ($content.Length -gt 0) { Write-Host $content.Substring(0, [Math]::Min(500, $content.Length)) }
  Remove-Item $outFile
} else {
  Write-Host "no output file"
}
if (Test-Path $errFile) {
  $err = Get-Content $errFile -Raw
  if ($err.Length -gt 0) { Write-Host "stderr: $err" }
  Remove-Item $errFile
}
