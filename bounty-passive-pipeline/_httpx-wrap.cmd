@echo off
set HTTPX_BIN=C:\Users\bryan\go\bin\httpx.exe
set INFILE=%~1
set OUTFILE=%~2
REM Redirect all output to NUL — httpx writes structured results to -o file only
"%HTTPX_BIN%" -list %INFILE% -title -status-code -silent -json -o %OUTFILE% -timeout 5000 > NUL 2>&1
