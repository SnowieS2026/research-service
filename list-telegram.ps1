Get-ChildItem "C:\Users\bryan\.openclaw\telegram" -Recurse | ForEach-Object {
    Write-Host $_.FullName
}
