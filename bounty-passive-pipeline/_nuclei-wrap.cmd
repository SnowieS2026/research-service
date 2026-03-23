@echo off
set NUCLEI_BIN=nuclei
set TEMPLATES_BASE=%USERPROFILE%\.nuclei-templates
set TARGET_FILE=%~1
set OUT_FILE=%~2
set NUCLEI_ARGS=-l %TARGET_FILE% -rl 20 -timeout 8 -retries 0 -nc -jsonl -o %OUT_FILE% -t "%TEMPLATES_BASE%\http\vulnerabilities" -t "%TEMPLATES_BASE%\http\exposed-panels" -t "%TEMPLATES_BASE%\http\exposures" -t "%TEMPLATES_BASE%\http\misconfiguration"
set GOOGLE_API_KEY=
set GOOGLE_API_CX=
"%NUCLEI_BIN%" %NUCLEI_ARGS%
