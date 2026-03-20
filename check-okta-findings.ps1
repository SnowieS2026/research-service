$data = Get-Content 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\reports\2026-03-20\bugcrowd-okta-43d56de857b7.json' | ConvertFrom-Json
if ($data.findings) {
    $data.findings | Sort-Object severity -Descending | Format-Table severity, type, tool -AutoSize
} else {
    "No findings property found. Keys: $($data.PSObject.Properties.Name)"
}
