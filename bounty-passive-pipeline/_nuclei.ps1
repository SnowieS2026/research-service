$ErrorActionPreference = 'SilentlyContinue'
$tmp = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_subs.txt"
$nout = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_nuclei.txt"
Remove-Item $nout -Force -EA SilentlyContinue

$env:GOOGLE_API_KEY = ''
$env:GOOGLE_API_CX = ''

Write-Host "Running nuclei on $(@(Get-Content $tmp).Count) targets..."
$r = & nuclei -l $tmp -t nuclei-templates/vulnerabilities/ -t nuclei-templates/exposed-panels/ -rate-limit 30 -timeout 8 -retries 0 -nc -json -o $nout 2>$null
Write-Host "nuclei exit: $LASTEXITCODE"

if (Test-Path $nout) {
    $content = Get-Content $nout -Raw
    $lines = ($content -split "`n" | Where-Object { $_ -match '\S' })
    Write-Host "nuclei output: $($lines.Count) lines"
    $findings = $lines | ForEach-Object { try { $_ | ConvertFrom-Json } catch {} }
    $high = $findings | Where-Object { $_.severity -match 'CRITICAL|HIGH|MEDIUM' }
    Write-Host "HIGH/CRITICAL/MEDIUM: $($high.Count)"
    foreach ($f in $high) {
        Write-Host "  [$($f.severity)] $($f.host) -- $($f.template)"
    }
    $info = $findings | Where-Object { $_.severity -eq 'info' }
    Write-Host "INFO: $($info.Count)"
    foreach ($f in $info | Select-Object -First 10) {
        Write-Host "  [info] $($f.host) -- $($f.info.name)"
    }
} else {
    Write-Host "No nuclei output file"
}
