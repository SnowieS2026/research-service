Get-ChildItem 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\reports' -Directory | Sort-Object Name -Descending | Select-Object -First 1 | ForEach-Object { $_.Name }
