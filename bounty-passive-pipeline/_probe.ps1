$ErrorActionPreference = 'SilentlyContinue'
$tmp = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_subs.txt"
$out = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_httpx.txt"

# Get subfinder subs, filter, write to file
$subs = & subfinder -d okta.com -silent 2>$null | Where-Object { $_ -and $_ -notmatch 'dev-|test-|qa-|staging|demo|tmp-|customdomains|trial-' } | Select-Object -First 200
$subs | Out-File -FilePath $tmp -Encoding UTF8
Write-Host "Subfinder: $($subs.Count) prod subs"

# Run httpx
$httpx = & "C:\Users\bryan\go\bin\httpx.exe" -list $tmp -silent -sc -nc -timeout 5000 2>$null
$httpx | Out-File -FilePath $out -Encoding UTF8
Write-Host "httpx output: $($httpx.Count) lines"

# Show 200s
$alive = $httpx | Where-Object { $_ -match '200' }
Write-Host "Alive (200): $($alive.Count)"
$alive | Select-Object -First 20

# nuclei on top alive subs
if ($alive) {
    $urls = ($alive | ForEach-Object { if ($_ -match 'https?://[^\s\[\]]+') { $Matches[0] } } | Where-Object { $_ } | Select-Object -First 30)
    $nucleiOut = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_nuclei.txt"
    $urls | Out-File -FilePath $tmp -Encoding UTF8
    Write-Host "`n=== Running nuclei on $($urls.Count) targets ==="
    $r = & nuclei -l $tmp -t vulnerabilities/ -t exposed-panels/ -tags rce,sql-injection,xss -rate-limit 30 -timeout 8 -retries 0 -nc -json -o $nucleiOut 2>$null
    Write-Host "nuclei exit: $LASTEXITCODE"
    if (Test-Path $nucleiOut) {
        $nout = Get-Content $nucleiOut -Raw
        $nlines = ($nout -split "`n" | Where-Object { $_ -match '\S' })
        Write-Host "nuclei output: $($nlines.Count) lines"
        $high = $nlines | Where-Object { $_ -match '"HIGH"|"CRITICAL"|"MEDIUM"' }
        if ($high) {
            Write-Host "`n=== HIGH/CRITICAL/MEDIUM findings ==="
            $high | Select-Object -First 20
        }
    }
}

# Cleanup
Remove-Item $tmp -EA SilentlyContinue
Remove-Item $out -EA SilentlyContinue
