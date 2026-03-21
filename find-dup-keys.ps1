Get-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\src\browser\parsers\BugcrowdParser.ts' | ForEach-Object { if ($_ -match "^  '[a-z]") { $_ } }
