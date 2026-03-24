@echo off
cd /d C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp
"C:\Users\bryan\go\bin\nuclei.exe" -l nuclei_test_targets.txt -t C:\Users\bryan\.nuclei-templates\http\exposed-panels -json-export nuclei_test_results.json
echo EXIT CODE: %ERRORLEVEL%
