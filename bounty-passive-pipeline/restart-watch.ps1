$ErrorActionPreference = "SilentlyContinue"
$root = "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline"
$log  = "$root\logs\bounty-watch.log"

# Kill old watcher (PID 3036 if still alive)
Stop-Process -Id 3036 -Force

# Also kill any stale node processes for this project
Get-Process node | ForEach-Object {
    $proc = $_
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmd -like "*index.js*watch*scan*") {
            Stop-Process -Id $proc.Id -Force
            Write-Host "Killed stale watcher PID $($proc.Id)"
        }
    } catch {}
}
Start-Sleep 2

# Ensure logs dir
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null

# Launch fresh
$stdoutLog = "$log.stdout.log"
$stderrLog = "$log.stderr.log"

$proc = Start-Process -FilePath "node" `
  -ArgumentList "dist/src/index.js","watch","--scan" `
  -WorkingDirectory $root `
  -NoNewWindow `
  -PassThru `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog

Start-Sleep 4

if ($proc.HasExited) {
    Write-Host "[WATCHER] FAILED - exit code: $($proc.ExitCode)"
    Write-Host "stdout:"
    Get-Content $stdoutLog -TotalCount 10
    Write-Host "stderr:"
    Get-Content $stderrLog -TotalCount 10
    exit 1
} else {
    Write-Host "[WATCHER] Started OK - PID $($proc.Id)"
    Write-Host "stdout: $stdoutLog"
    Write-Host ""
    Write-Host "Last 15 lines of log:"
    Get-Content $stdoutLog -Tail 15
}
