Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ResQFood - AI-Based Food Redistribution System Launcher" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$ROOT_DIR = $PSScriptRoot

Write-Host "`n[1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$ROOT_DIR\backend`"; uvicorn main:app --reload --host 127.0.0.1 --port 8000" -PassThru

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$ROOT_DIR\frontend`"; npm run dev" -PassThru

Write-Host "`nServices started!" -ForegroundColor Green
Write-Host "Backend API:      http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "API Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend App:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress Enter to stop both services..." -ForegroundColor White
Read-Host

Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
Write-Host "Services stopped cleanly." -ForegroundColor Green
