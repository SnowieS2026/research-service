$path = 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\nuclei_results.json'
if (Test-Path $path) {
    $content = Get-Content $path -Raw
    if ($content -match '^\s*$') {
        Write-Host "nuclei_results.json is empty"
    } else {
        $json = $content | ConvertFrom-Json
        $count = $json.Count
        Write-Host "nuclei findings: $count"
    }
} else {
    Write-Host "nuclei_results.json not found"
}
