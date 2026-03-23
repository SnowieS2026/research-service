Get-ChildItem "C:\openclaw-local" -Recurse -File | ForEach-Object {
    Write-Host "=== $($_.FullName) ==="
    Get-Content $_.FullName | Select-Object -First 10
    Write-Host ""
}
