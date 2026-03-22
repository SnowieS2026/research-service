$ErrorActionPreference = 'Continue'
$HTTPX = 'C:\Users\bryan\go\bin\httpx.exe'
$TMP = $env:TEMP

$inFile = "$TMP\httpx-test-in.txt"
$outFile = "$TMP\httpx-test-out.jsonl"

$subs = @('https://login.okta.com', 'https://www.okta.com', 'https://okta.com')
[System.IO.File]::WriteAllLines($inFile, $subs)

Write-Host "Input file:"
Get-Content $inFile

Write-Host "`nRunning httpx..."
$proc = Start-Process -FilePath $HTTPX -ArgumentList '-list', $inFile, '-title', '-status-code', '-silent', '-json', '-o', $outFile, '-timeout', '5000' -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$TMP\httpx-test-stdout.txt" -RedirectStandardError "$TMP\httpx-test-stderr.txt"

Write-Host "Exit code: $($proc.ExitCode)"
Write-Host "`n--- STDOUT ---"
Get-Content "$TMP\httpx-test-stdout.txt" -EA SilentlyContinue
Write-Host "`n--- STDERR ---"
Get-Content "$TMP\httpx-test-stderr.txt" -EA SilentlyContinue
Write-Host "`n--- JSONL FILE ---"
if (Test-Path $outFile) {
    $content = Get-Content $outFile -Raw
    Write-Host $content
    Write-Host "`nParsed:"
    foreach ($line in ($content -split "`n" | Where-Object { $_.Trim() })) {
        try {
            $j = $line | ConvertFrom-Json
            Write-Host "  URL: $($j.url)  Status: $($j.status_code)  Title: $($j.title)"
        } catch {
            Write-Host "  PARSE ERROR: $line"
        }
    }
} else {
    Write-Host "FILE NOT CREATED"
}
