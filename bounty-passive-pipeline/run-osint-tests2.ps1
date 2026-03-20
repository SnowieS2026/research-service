$env:SEARXNG_URL = "http://localhost:8080"
$cd = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline"

$tests = @(
    @{osint="general"; target="Donald Trump"},
    @{osint="person"; target="Donald J Trump Washington DC"},
    @{osint="business"; target="Trump Organization"}
)

foreach ($t in $tests) {
    Write-Host "=== $($t.osint): $($t.target) ==="
    $out = & node "$cd\dist\src\osint\index.js" --osint $t.osint $t.target 2>&1
    if ($out) { Write-Host $out }
    Start-Sleep -Seconds 3
}

Write-Host "=== DONE ==="
