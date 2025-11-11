@echo off
echo ========================================
echo Starting Agentic RAG System
echo ========================================
echo.

echo Starting Backend Server...
start cmd /k "cd /d %~dp0 && uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
