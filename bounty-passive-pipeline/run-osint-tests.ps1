$env:SEARXNG_URL = "http://localhost:8080"
$ErrorActionPreference = 'SilentlyContinue'
$cd = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline"

$tests = @(
    @{osint="general"; target="Donald Trump"},
    @{osint="person"; target="Donald J Trump"},
    @{osint="domain"; target="trump.com"},
    @{osint="business"; target="Trump Organization"},
    @{osint="username"; target="realDonaldTrump"},
    @{osint="email"; target="contact@donaldjtrump.com"}
)

foreach ($t in $tests) {
    Write-Host "=== $($t.osint): $($t.target) ==="
    $out = & node "$cd\dist\src\osint\index.js" --osint $t.osint $t.target 2>&1
    if ($out) { Write-Host $out }
    Start-Sleep -Seconds 2
}

Write-Host "=== ALL DONE ==="
