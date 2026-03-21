Get-ChildItem 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\src' -Recurse -File | ForEach-Object { $_.FullName }
