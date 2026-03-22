$env:GOOGLE_API_KEY = ''
$outFile = "$env:TEMP\nt.jsonl"
$errFile = "$env:TEMP\nt.err"
Remove-Item $outFile -EA SilentlyContinue
Remove-Item $errFile -EA SilentlyContinue

# Test with a known vulnerable test endpoint
$proc = Start-Process -FilePath "C:\Users\bryan\go\bin\nuclei.exe" `
  -ArgumentList "-u","http://testphp.vulnweb.com/listquotes.php?id=1","-t","C:\Users\bryan\.nuclei-templates\http\vulnerabilities\sql-injection","-json-export",$outFile,"-nc","-rl","5","-timeout","30" `
  -NoNewWindow -Wait -PassThru -RedirectStandardError $errFile

Write-Host "exit: $($proc.ExitCode)"
if (Test-Path $outFile) { Write-Host "output: $((Get-Item $outFile).Length) bytes"; Get-Content $outFile | Select-Object -First 3 } else { Write-Host "NO output file" }
if (Test-Path $errFile) { $e = Get-Content $errFile -Raw; if ($e) { Write-Host "stderr: $($e.Substring(0, [Math]::Min(500, $e.Length)))" } }
