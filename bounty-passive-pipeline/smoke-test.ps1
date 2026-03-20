$ErrorActionPreference = 'SilentlyContinue'
$results = @()

$tests = @(
    @{ type = "domain"; target = "example.com"; label = "Domain" },
    @{ type = "ip"; target = "8.8.8.8"; label = "IP" },
    @{ type = "phone"; target = "+447700900000"; label = "Phone" },
    @{ type = "email"; target = "test@example.com"; label = "Email" },
    @{ type = "general"; target = "Edinburgh"; label = "General" },
    @{ type = "business"; target = "Tesco"; label = "Business" },
    @{ type = "person"; target = "John Smith"; label = "Person" },
    @{ type = "username"; target = "testuser123"; label = "Username" }
)

$reportDir = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\reports"
$beforeFiles = @{}
Get-ChildItem $reportDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $beforeFiles[$_.FullName] = $_.LastWriteTime }

foreach ($t in $tests) {
    $label = $t.label
    $type = $t.type
    $target = $t.target
    $errFile = "$env:TEMP\osint_err_$([guid]::NewGuid().ToString('N')).txt"
    $outFile = "$env:TEMP\osint_out_$([guid]::NewGuid().ToString('N')).txt"

    Write-Host "[TEST] $label ($type / $target)"

    $start = Get-Date
    $proc = Start-Process -FilePath "node" -ArgumentList "dist/src/osint/index.js","--osint",$type,$target -WorkingDirectory "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline" -NoNewWindow -PassThru -RedirectStandardError $errFile -RedirectStandardOutput $outFile -Wait
    $elapsed = ((Get-Date) - $start).TotalSeconds

    $exitCode = $proc.ExitCode
    $err = Get-Content $errFile -Raw
    $out = Get-Content $outFile -Raw

    # Check for new report files
    $afterFiles = @{}
    Get-ChildItem $reportDir -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $afterFiles[$_.FullName] = $_.LastWriteTime }
    $newFiles = @()
    foreach ($f in $afterFiles.Keys) {
        if (-not $beforeFiles.ContainsKey($f) -or $afterFiles[$f] -gt $beforeFiles[$f]) {
            $newFiles += $f
        }
    }

    $reportFile = $null
    $findings = 0
    $reportErrors = @()
    if ($newFiles.Count -gt 0) {
        $jsonFiles = $newFiles | Where-Object { $_ -match '\.json$' }
        if ($jsonFiles) {
            $reportFile = $jsonFiles[0]
            try {
                $j = Get-Content $reportFile -Raw | ConvertFrom-Json
                $findings = $j.findings.Count
                if ($j.errors -and $j.errors.Count -gt 0) {
                    $reportErrors = $j.errors
                }
            } catch {
                $reportErrors = @("Failed to parse report JSON: $_")
            }
        }
    }

    $status = "PASS"
    $errorMsg = ""
    if ($exitCode -ne 0) {
        $status = "FAIL"
        $errorMsg = "Exit code: $exitCode"
    } elseif ($findings -eq 0) {
        $status = "ZERO_FINDINGS"
    } elseif ($reportErrors.Count -gt 0) {
        $status = "ERRORS"
        $errorMsg = ($reportErrors | Select-Object -First 3) -join "; "
    }

    $results += [PSCustomObject]@{
        Collector = $label
        Findings = $findings
        ExitCode = $exitCode
        Elapsed = [math]::Round($elapsed, 1)
        Status = $status
        Errors = $errorMsg
        ReportFile = ($newFiles -join ", ") -replace ".*reports[\\\/]", ""
    }

    Write-Host "  -> $status | findings=$findings | exit=$exitCode | time=${elapsed}s | files=$($newFiles.Count)"
    if ($err -and $err.Trim()) {
        Write-Host "  STDERR: $($err.Substring(0, [math]::Min(200, $err.Length)))"
    }

    Remove-Item $errFile -ErrorAction SilentlyContinue
    Remove-Item $outFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== SUMMARY ==="
$results | Format-Table Collector, Findings, ExitCode, Elapsed, Status, Errors -AutoSize

# Output as text for capture
$summary = $results | ForEach-Object {
    "$($_.Collector) | $($_.Findings) | $($_.Status) | $($_.Errors)"
}
$summary | Out-File "$env:TEMP\smoke_summary.txt" -Encoding UTF8
Get-Content "$env:TEMP\smoke_summary.txt"
