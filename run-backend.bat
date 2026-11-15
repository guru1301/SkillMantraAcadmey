@echo off
title FastAPI Backend (Port 8000)
cd /d "%~dp0"
echo ========================================================
echo  Starting FastAPI Backend on http://127.0.0.1:8000
echo ========================================================
C:\Python310\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause

