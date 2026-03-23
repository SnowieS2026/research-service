Get-ChildItem "C:\Users\bryan\.openclaw\credentials" -Recurse | ForEach-Object {
    Write-Host "$($_.FullName)"
}
Write-Host "---"
Get-ChildItem "C:\Users\bryan\.openclaw" -Recurse -Filter "telegram*" | ForEach-Object {
    Write-Host "$($_.FullName)"
}
