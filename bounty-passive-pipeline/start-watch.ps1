$ErrorActionPreference = "SilentlyContinue"
$root = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline"
$log  = "$root\logs\bounty-watch.log"

# Kill ALL node processes for this project (prevents old-code reuse)
Write-Host "Stopping all project node processes..."
Get-Process node 2>$null | ForEach-Object {
    $proc = $_
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmd -like "*bounty-passive-pipeline*" -or $cmd -like "*dist/src/index.js*") {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Killed PID $($proc.Id)"
        }
    } catch {}
}
Start-Sleep 2

# Ensure logs dir
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\logs\scan-results" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\logs\snapshots" | Out-Null

# Clear old scan results (fresh start)
$scanResDir = "$root\logs\scan-results"
Get-ChildItem $scanResDir -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Clear old scan-state
$stateFile = "$root\logs\scan-state.json"
if (Test-Path $stateFile) { Remove-Item $stateFile -Force -ErrorAction SilentlyContinue }

# Launch fresh watcher with --scan
$stdoutLog = "$log.stdout.log"
$stderrLog = "$log.stderr.log"
# Remove old logs
if (Test-Path $stdoutLog) { Remove-Item $stdoutLog -Force -ErrorAction SilentlyContinue }
if (Test-Path $stderrLog) { Remove-Item $stderrLog -Force -ErrorAction SilentlyContinue }

Write-Host "Starting bounty watcher (PID will be logged)..."
$proc = Start-Process -FilePath "node" `
  -ArgumentList "dist/src/index.js","watch","--scan" `
  -WorkingDirectory $root `
  -NoNewWindow `
  -PassThru `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog

Start-Sleep 5

if ($proc.HasExited) {
    Write-Host "[FATAL] Watcher exited immediately with code: $($proc.ExitCode)"
    if (Test-Path $stderrLog) {
        Write-Host "=== stderr ==="
        Get-Content $stderrLog -TotalCount 20
    }
    exit 1
} else {
    Write-Host "[OK] Watcher running as PID $($proc.Id)"
    Write-Host "Log: $stdoutLog"
    Write-Host ""
    Write-Host "=== startup output ==="
    if (Test-Path $stdoutLog) {
        Get-Content $stdoutLog -TotalCount 20
    } else {
        Write-Host "(no output yet)"
    }
}
