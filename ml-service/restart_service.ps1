# Restart ML Service
# Run this script from PowerShell in the ml-service directory

Write-Host "Stopping existing Flask processes..." -ForegroundColor Yellow
$flaskProcesses = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*ml-service*"}
if ($flaskProcesses) {
    $flaskProcesses | Stop-Process -Force
    Write-Host "Stopped $($flaskProcesses.Count) Flask process(es)" -ForegroundColor Green
} else {
    Write-Host "No existing Flask processes found" -ForegroundColor Gray
}

Write-Host "`nStarting ML Service..." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan

# Activate venv and start Flask
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Working directory: $scriptPath" -ForegroundColor Gray

# Start Flask in background
Start-Process -FilePath ".\venv\Scripts\python.exe" -ArgumentList "app.py" -NoNewWindow

Start-Sleep -Seconds 2

Write-Host "`nML Service started on http://localhost:5001" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "`nAvailable EndponNts:" -ForegroundColor White
Write-Host "  POST /analyze-face-shape" -ForegroundColor Cyan
Write-Host "  POST /analyze-face-symmetry" -ForegroundColor Cyan
Write-Host "  GET  /static/videos/<filename>" -ForegroundColor Cyan
Write-Host "`nCheck terminal for Flask logs" -ForegroundColor Gray
