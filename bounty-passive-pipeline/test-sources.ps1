# Test script to check which vehicle data sources are accessible
param([string]$Plate = "KY05YTJ")

$ErrorActionPreference = "Continue"

function Test-Url {
    param([string]$Url, [string]$Name)
    try {
        $resp = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 10 -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -SkipHttpErrorCheck
        Write-Host "[$Name] Status: $($resp.StatusCode)" -ForegroundColor $(if($resp.StatusCode -eq 200){'Green'}else{'Yellow'})
        return $resp.StatusCode -eq 200
    } catch {
        Write-Host "[$Name] ERROR: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "=== Testing Vehicle Data Sources ===" -ForegroundColor Cyan
Write-Host "Plate: $Plate`n"

# Parkers valuation
Test-Url -Url "https://www.parkers.co.uk/car-valuation/" -Name "Parkers"

# Parkers specs
Test-Url -Url "https://www.parkers.co.uk/cars/ford/focus/2018/" -Name "Parkers-Focus"

# Valuemycar
Test-Url -Url "https://www.valuemycar.co.uk/" -Name "ValueMyCar"

# AutoTrader valuation
Test-Url -Url "https://www.autotrader.co.uk/cars/valuation" -Name "AutoTrader-Valuation"

# Motors.co.uk
Test-Url -Url "https://www.motors.co.uk/" -Name "Motors"

# Check a known motors listing
Test-Url -Url "https://www.motors.co.uk/ford/focus/" -Name "Motors-Focus"

# Exchange-data
Test-Url -Url "https://www.exchange-data.io/" -Name "ExchangeData"

# AskCheck app
Test-Url -Url "https://mobile.app.askcheck.com/" -Name "AskCheck"

# motcheck.eu
Test-Url -Url "https://www.motcheck.eu/" -Name "MotCheckEU"

Write-Host "`n=== Done ==="
