@echo off
chcp 65001 >nul
title Previsao Tempo Pescaria - Parar

echo ==========================================================
echo    PARANDO - PREVISAO TEMPO PESCARIA
echo ==========================================================
echo.

REM ---------- Encerrar processos pelas PORTAS (8001 backend, 3000 frontend) ----------
echo [INFO] Encerrando o BACKEND (porta 8001)...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8001" ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>nul && echo    - Backend encerrado (PID %%p)
)

echo [INFO] Encerrando o FRONTEND (porta 3000)...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000" ^| findstr LISTENING') do (
    taskkill /F /PID %%p >nul 2>nul && echo    - Frontend encerrado (PID %%p)
)

REM ---------- Fallback: fechar janelas pelo titulo ----------
taskkill /FI "WINDOWTITLE eq Backend - Pescaria*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Frontend - Pescaria*" /T /F >nul 2>nul

echo.
echo ==========================================================
echo    APP ENCERRADO.
echo    (O MongoDB continua ativo como servico do Windows.)
echo ==========================================================
echo.
pause
