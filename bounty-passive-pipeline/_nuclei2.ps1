$env:GOOGLE_API_KEY = ''
$env:GOOGLE_API_CX = ''

$ok = @(
    'https://adobemetrics.okta.com',
    'https://247-inc.okta.com',
    'https://agent-login.okta.com',
    'https://aexp-crtrs.okta.com',
    'https://2fdisneyanimation.okta.com',
    'https://2fbna.okta.com',
    'https://benevity-prod-ciam.okta.com',
    'https://circlek.okta.com',
    'https://assurant.okta.com'
)
$ok | Out-File 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_ok.txt' -Encoding UTF8
Write-Host "Targets: $($ok.Count)"

& nuclei -l 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_ok.txt' -t nuclei-templates/vulnerabilities/ -t nuclei-templates/exposed-panels/ -rate-limit 30 -timeout 8 -retries 0 -nc -json -o 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_nout.txt' 2>$null
Write-Host "nuclei exit: $LASTEXITCODE"

if (Test-Path 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_nout.txt') {
    $lines = Get-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\_nout.txt'
    Write-Host "Output: $($lines.Count) lines"
    foreach ($ln in $lines) {
        if ($ln -match '^\s*$') { continue }
        try {
            $j = $ln | ConvertFrom-Json
            $sev = if ($j.severity) { $j.severity } else { '?' }
            $host = if ($j.host) { $j.host } elseif ($j.matched_at) { $j.matched_at } else { '?' }
            $tpl = if ($j.info -and $j.info.name) { $j.info.name } elseif ($j.template) { $j.template } else { '?' }
            Write-Host "[$sev] $host -- $tpl"
        } catch {
            Write-Host "RAW: $($ln.Substring(0, [Math]::Min(200, $ln.Length)))"
        }
    }
} else {
    Write-Host "No nuclei output"
}
