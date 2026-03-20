$env:SEARXNG_URL = "http://localhost:8080"
$ErrorActionPreference = 'SilentlyContinue'
$out = & node "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\src\osint\index.js" --osint general "Donald Trump" 2>&1 | Out-File -FilePath "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\test-out.txt" -Encoding utf8
$exit = $LASTEXITCODE
Write-Host "Exit: $exit"
Write-Host "Output file size: $((Get-Item 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\test-out.txt').Length)"
Get-Content "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\test-out.txt" | Select-Object -First 20
