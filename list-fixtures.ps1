Get-ChildItem 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\fixtures\html' | Where-Object { $_.Name -like 'bugcrowd*' } | ForEach-Object { $_.Name + ' (' + $_.Length + 'b)' }
