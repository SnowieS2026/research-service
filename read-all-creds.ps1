$files = Get-ChildItem "C:\Users\bryan\.openclaw\credentials" -Recurse -File
foreach ($f in $files) {
    Write-Host "=== $($f.FullName) ==="
    Get-Content $f.FullName | Select-Object -First 5
}
