try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $token = "8522710836:AAERxn_PJqfEEJHwXNzqS2f3R4gsd0v4LSc"
    $url = "https://api.telegram.org/bot$token/getMe"
    $resp = [Net.WebClient]::new().DownloadString($url)
    Write-Host "getMe response: $resp"
} catch {
    Write-Host "FAIL getMe: $($_.Exception.Message)"
}

# Try sendChatAction to test outbound
try {
    $token = "8522710836:AAERxn_PJqfEEJHwXNzqS2f3R4gsd0v4LSc"
    $chatId = "851533398"
    $url = "https://api.telegram.org/bot$token/sendChatAction"
    $data = [System.Text.Encoding]::UTF8.GetBytes("chat_id=$chatId&action=typing")
    $req = [Net.HttpWebRequest]::CreateHttp($url)
    $req.Method = "POST"
    $req.ContentType = "application/x-www-form-urlencoded"
    $req.ContentLength = $data.Length
    $req.Timeout = 10000
    $req.ServicePoint.Expect100Continue = $false
    $req.GetRequestStream().Write($data, 0, $data.Length)
    $req.GetRequestStream().Close()
    $resp = $req.GetResponse()
    $reader = [System.IO.StreamReader]::new($resp.GetResponseStream()).ReadToEnd()
    Write-Host "sendChatAction OK: $reader"
} catch {
    Write-Host "FAIL sendChatAction: $($_.Exception.Message)"
}
