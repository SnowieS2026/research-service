Get-ChildItem "C:\Users\bryan\.openclaw\credentials" | ForEach-Object { Write-Host $_.Name }
