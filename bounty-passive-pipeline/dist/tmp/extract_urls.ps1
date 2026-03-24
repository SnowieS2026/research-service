$json = Get-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\httpx_results.json' | ConvertFrom-Json
$urls = $json | ForEach-Object { $_.url }
$urls | Set-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\nuclei_targets.txt'
Write-Host "Total URLs written: $($json.Count)"
