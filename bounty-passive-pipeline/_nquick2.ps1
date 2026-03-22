$ErrorActionPreference = 'Continue'
$env:GOOGLE_API_KEY = ''
$env:GOOGLE_API_CX = ''
$NUCLEI = 'C:\Users\bryan\go\bin\nuclei.exe'
$TEMPLATES = "$env:USERPROFILE\.nuclei-templates"
$TARGETS = @('https://login.okta.com','https://www.okta.com')
$TARGET_FILE = "$env:TEMP\nucl-test-urls.txt"
$OUT_FILE = "$env:TEMP\nucl-test-out.jsonl"
$ERR_FILE = "$env:TEMP\nucl-test-err.txt"

[System.IO.File]::WriteAllLines($TARGET_FILE, $TARGETS)

Write-Host "Testing direct nuclei call..."
$sw = [Diagnostics.Stopwatch]::StartNew()
# Use & operator with stderr redirect to file - stdout goes to console
& $NUCLEI -l $TARGET_FILE -rl 20 -timeout 8 -retries 0 -nc -jsonl -o $OUT_FILE -t "$TEMPLATES\http\vulnerabilities" -t "$TEMPLATES\http\exposed-panels" 2>$ERR_FILE
$exit = $LASTEXITCODE
$sw.Stop()
Write-Host "Exit: $exit in $($sw.Elapsed.TotalSeconds)s"
if (Test-Path $ERR_FILE) { Get-Content $ERR_FILE -EA SilentlyContinue | Select-Object -First 3 }
Write-Host "Out file: $(Test-Path $OUT_FILE) | $(if(Test-Path $OUT_FILE){(Get-Item $OUT_FILE).Length}else{0}) bytes"
if (Test-Path $OUT_FILE) { Get-Content $OUT_FILE -EA SilentlyContinue | Select-Object -First 3 }
