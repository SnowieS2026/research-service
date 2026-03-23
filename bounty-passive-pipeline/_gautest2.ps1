$out = "$env:TEMP\gautest2.txt"
Remove-Item $out -EA SilentlyContinue

# Test gau with -o flag (output file)
& "C:\Users\bryan\go\bin\gau.exe" --subs --max-url 10 okta.com -o $out 2>$null
Write-Host "gau -o exit: $LASTEXITCODE"

if (Test-Path $out) {
    $content = Get-Content $out -Raw
    $lines = (@($content -split "`n" | Where-Object { $_ -match 'http' })).Count
    Write-Host "matched lines: $lines"
    Write-Host "first 500 chars:"
    Write-Host $content.Substring(0, [Math]::Min(500, $content.Length))
} else {
    Write-Host "output file not created"
}

Remove-Item $out -EA SilentlyContinue
