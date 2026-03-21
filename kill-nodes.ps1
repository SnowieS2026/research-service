$ErrorActionPreference = "SilentlyContinue"
# Kill all node processes (bounty watcher + anything related)
Write-Host "Stopping all node processes..."
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = $_
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmd -like "*bounty*") {
            Stop-Process -Id $proc.Id -Force
            Write-Host "  Killed PID $($proc.Id) (bounty)"
        }
    } catch {}
}
Start-Sleep 3
Write-Host "Done. Remaining node processes: $((Get-Process node -ErrorAction SilentlyContinue | Measure-Object).Count)"
