$json = Get-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\httpx_results.json' | ConvertFrom-Json
# URLs with query params for dalfox (all)
$withQuery = $json | Where-Object { $_.url -match '\?' } | ForEach-Object { $_.url }
$withQuery | Set-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\dalfox_targets.txt'
Write-Host "dalfox targets: $($withQuery.Count)"
# Top 20 with query params for sqlmap
$withQuery | Select-Object -First 20 | Set-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\sqlmap_targets.txt'
Write-Host "sqlmap targets: 20"
