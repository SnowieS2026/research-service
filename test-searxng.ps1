$ports = @(8080, 8888, 4000, 5000, 40000)
foreach ($p in $ports) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$p/search?q=test&format=json" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($r) {
            Write-Host "OK port $p"
        }
    } catch {
        Write-Host "FAIL port $p"
    }
}
