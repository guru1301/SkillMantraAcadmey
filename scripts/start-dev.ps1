# Quick launcher script to start both FastAPI Backend and Next.js Frontend
$workspaceRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Skill Mantra Academy / Skill Thinker Platform    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $workspaceRoot -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting FastAPI Backend (Port 8000)...' -ForegroundColor Cyan; C:\Python310\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "2. Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $workspaceRoot -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting Next.js Frontend (Port 3000)...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "Both services are starting in separate windows!" -ForegroundColor Green
Write-Host "- Backend API & Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor Gray
Write-Host "- Frontend Application:       http://localhost:3000" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

