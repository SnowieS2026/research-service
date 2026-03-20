$env:SEARXNG_URL = "http://localhost:8080"
$cd = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline"

$tests = @(
    @{osint="general"; target="Donald Trump"},
    @{osint="general"; target="Trump Organization foreign deals Russia China Saudi"},
    @{osint="general"; target="Trump Foundation fraud New York"},
    @{osint="general"; target="Trump business conflicts of interest presidency"},
    @{osint="person"; target="Donald J Trump Washington DC"},
    @{osint="business"; target="Trump Organization"},
    @{osint="domain"; target="trump.com"},
    @{osint="domain"; target="donaldtrump.com"},
    @{osint="username"; target="realDonaldTrump"},
    @{osint="email"; target="contact@donaldjtrump.com"}
)

foreach ($t in $tests) {
    Write-Host "=== $($t.osint): $($t.target) ==="
    $out = & node "$cd\dist\src\osint\index.js" --osint $t.osint $t.target 2>&1
    if ($out) { Write-Host $out.Substring(0, [Math]::Min(200, $out.Length)) }
    Start-Sleep -Seconds 2
}

Write-Host "=== ALL DONE ==="
