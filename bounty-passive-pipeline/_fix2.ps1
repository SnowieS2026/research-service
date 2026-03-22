$lines = Get-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\src\scanner\NucleiScanner.ts'
$lines[145] = '    const code = (err as Record<string, unknown>)[''code''];'
$lines[146] = '    if (e.name === ''TimeoutError'' || (typeof code === ''number'' && code !== 0)) {'
Set-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\src\scanner\NucleiScanner.ts' $lines -NoNewline
Write-Host "Fixed lines 146-147"
