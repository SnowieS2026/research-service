@echo off
cd "C:\Users\bryan\.openclaw\workspace\bounty-passive-pipeline\dist\tmp"
"C:\Users\bryan\go\bin\nuclei.exe" -l "nuclei_targets.txt" -t "C:\Users\bryan\.nuclei-templates\http\vulnerabilities" -t "C:\Users\bryan\.nuclei-templates\http\exposed-panels" -t "C:\Users\bryan\.nuclei-templates\http\exposures" -json-export "nuclei_results.json" 2>&1
