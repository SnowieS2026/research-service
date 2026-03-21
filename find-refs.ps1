Select-String -Path 'C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\src\**\*.ts' -Pattern 'ScannerOrchestrator' -List | ForEach-Object { $_.Path + ':' + $_.LineNumber }
