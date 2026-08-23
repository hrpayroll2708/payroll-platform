@echo off
title Payroll Platform Launcher
echo ===================================================
echo Starting Payroll Platform Environment...
echo ===================================================

echo [1/3] Starting Docker containers (Postgres, Redis, MinIO)...
docker compose up -d

echo [2/3] Starting Backend API (Port 4000)...
start "Payroll API" cmd /k "npm run dev:api"

echo [3/3] Starting Web Frontend (Port 3000)...
start "Payroll Web" cmd /k "npm run dev:web"

echo Launching browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000/payroll/process
