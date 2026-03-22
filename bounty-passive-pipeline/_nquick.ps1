$ErrorActionPreference = 'Continue'
$env:GOOGLE_API_KEY = ''
$env:GOOGLE_API_CX = ''
$NUCLEI = 'C:\Users\bryan\go\bin\nuclei.exe'
$TEMPLATES = "$env:USERPROFILE\.nuclei-templates"
$TARGETS = @('https://login.okta.com','https://www.okta.com','https://accounts.okta.com','https://agent-login.okta.com','https://2fdcg.okta.com')
$TARGET_FILE = "$env:TEMP\nucl-test-urls.txt"
$OUT_FILE = "$env:TEMP\nucl-test-out.jsonl"
$ERR_FILE = "$env:TEMP\nucl-test-err.txt"

[System.IO.File]::WriteAllLines($TARGET_FILE, $TARGETS)

# Build args as a single string for Start-Process
$argStr = "-l `"$TARGET_FILE`" -rl 20 -timeout 8 -retries 0 -nc -jsonl -o `"$OUT_FILE`" -t `"$TEMPLATES\http\vulnerabilities`" -t `"$TEMPLATES\http\exposed-panels`""

Write-Host "Running nuclei on 5 targets..."
$sw = [Diagnostics.Stopwatch]::StartNew()
$proc = Start-Process -FilePath $NUCLEI -ArgumentList $argStr -NoNewWindow -Wait -PassThru -RedirectStandardError $ERR_FILE
$sw.Stop()

Write-Host "Exit code: $($proc.ExitCode) in $($sw.Elapsed.TotalSeconds)s"
if (Test-Path $ERR_FILE) {
    $errContent = Get-Content $ERR_FILE -Raw
    if ($errContent) { Write-Host "Stderr: $($errContent.Substring(0, [Math]::Min(300, $errContent.Length)))" }
}
Write-Host "Out file exists: $(Test-Path $OUT_FILE)"
if (Test-Path $OUT_FILE) {
    $size = (Get-Item $OUT_FILE).Length
    Write-Host "Out file size: $size bytes"
    if ($size -gt 0) {
        Get-Content $OUT_FILE | Select-Object -First 3
    }
}
