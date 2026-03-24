$path = 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp\nuclei_results.json'
if (Test-Path $path) {
    $f = Get-Item $path
    Write-Host "size: $($f.Length)"
} else {
    Write-Host "not yet created"
}
