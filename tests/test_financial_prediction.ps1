# Test script for Financial Prediction System

Write-Host "Testing Financial Prediction System..." -ForegroundColor Green

# Test 1: Check if required services are running
Write-Host "`n1. Checking if required services are running..." -ForegroundColor Yellow

# Check if MongoDB is running
$mongodbStatus = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if ($mongodbStatus) {
    Write-Host "   [✓] MongoDB is running on port 27017" -ForegroundColor Green
} else {
    Write-Host "   [!] MongoDB is not running on port 27017" -ForegroundColor Red
}

# Check if Backend is running
$backendStatus = Get-NetTCPConnection -LocalPort 5005 -ErrorAction SilentlyContinue
if ($backendStatus) {
    Write-Host "   [✓] Backend is running on port 5005" -ForegroundColor Green
} else {
    Write-Host "   [!] Backend is not running on port 5005" -ForegroundColor Red
}

# Check if ML Service is running
$mlServiceStatus = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($mlServiceStatus) {
    Write-Host "   [✓] ML Service is running on port 5001" -ForegroundColor Green
} else {
    Write-Host "   [!] ML Service is not running on port 5001" -ForegroundColor Red
}

# Test 2: Check ML Service Health Endpoint
Write-Host "`n2. Testing ML Service Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get
    if ($healthResponse.status -eq "healthy") {
        Write-Host "   [✓] ML Service Health Check Passed" -ForegroundColor Green
        Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Gray
        Write-Host "   Model Loaded: $($healthResponse.model_loaded)" -ForegroundColor Gray
    } else {
        Write-Host "   [!] ML Service Health Check Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   [!] Failed to reach ML Service Health Endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test 3: Check Financial Forecast Endpoint
Write-Host "`n3. Testing Financial Forecast Endpoint..." -ForegroundColor Yellow
try {
    $forecastResponse = Invoke-RestMethod -Uri "http://localhost:5005/api/financial-forecast/forecast" -Method Get -Headers @{Authorization="Bearer test-token"}
    if ($forecastResponse.success) {
        Write-Host "   [✓] Financial Forecast API Call Successful" -ForegroundColor Green
        Write-Host "   Predicted Revenue: ₹$($forecastResponse.data.predictedRevenue)" -ForegroundColor Gray
        Write-Host "   Confidence: $(($forecastResponse.data.confidence * 100).ToString("F1"))%" -ForegroundColor Gray
        Write-Host "   Percentage Change: $(if($forecastResponse.data.percentageChange -ge 0){"+"}else{""})$($forecastResponse.data.percentageChange.ToString("F1"))%" -ForegroundColor Gray
    } else {
        Write-Host "   [!] Financial Forecast API Call Failed" -ForegroundColor Red
        Write-Host "   Message: $($forecastResponse.message)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [!] Failed to reach Financial Forecast Endpoint" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host "`nTest completed." -ForegroundColor Green