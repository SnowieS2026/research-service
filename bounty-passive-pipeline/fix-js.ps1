$c = [System.IO.File]::ReadAllText('C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\run-active-scan.js');
$c = $c -replace ' as any', '';
[System.IO.File]::WriteAllText('C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\run-active-scan.js', $c);
Write-Host "Done - removed 'as any' casts"
