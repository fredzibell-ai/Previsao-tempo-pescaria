@echo off
chcp 65001 >nul
title Previsao Tempo Pescaria - Iniciar

set "DEST=D:\Pescarias - previsão do tempo"

echo ==========================================================
echo    INICIANDO - PREVISAO TEMPO PESCARIA
echo ==========================================================

REM ---------- Garantir MongoDB em execucao ----------
echo [INFO] Verificando MongoDB...
net start MongoDB >nul 2>nul
if errorlevel 1 (
    echo [AVISO] Nao consegui iniciar o servico "MongoDB" automaticamente.
    echo         Se ja estiver rodando, ignore. Caso contrario, inicie o MongoDB manualmente.
)

REM ---------- Backend em nova janela ----------
echo [INFO] Iniciando BACKEND (porta 8001)...
start "Backend - Pescaria" /d "%DEST%\backend" cmd /k "call venv\Scripts\activate.bat && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

REM ---------- Frontend em nova janela ----------
echo [INFO] Iniciando FRONTEND (porta 3000)...
start "Frontend - Pescaria" /d "%DEST%\frontend" cmd /k "yarn start"

echo.
echo    Backend:  http://localhost:8001/api
echo    Frontend: http://localhost:3000
echo.
echo [INFO] Aguardando o frontend subir para abrir o navegador...
timeout /t 12 >nul
start "" http://localhost:3000

echo.
echo Para PARAR o app, feche as duas janelas (Backend e Frontend).
pause
