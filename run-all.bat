@echo off
cd /d "%~dp0"
echo Starting both FastAPI Backend and Next.js Frontend...
start "FastAPI Backend (8000)" cmd /k "C:\Python310\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
start "Next.js Frontend (3000)" cmd /k "npm run dev"
echo Both services have been launched in separate windows!

