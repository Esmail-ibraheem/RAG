@echo off
echo ========================================
echo Installing Agentic RAG System
echo ========================================
echo.

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Installing Node.js dependencies...
cd frontend
npm install

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo To start the application, run: start.bat
echo.
pause
