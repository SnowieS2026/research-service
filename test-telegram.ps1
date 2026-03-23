try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $resp = [Net.WebClient]::new().DownloadString('https://api.telegram.org')
    Write-Host 'OK - Telegram API reachable'
} catch {
    Write-Host "FAIL: $($_.Exception.Message)"
}
