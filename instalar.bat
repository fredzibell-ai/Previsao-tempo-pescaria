@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Instalador - Previsao Tempo Pescaria

REM =========================================================
REM   Previsao Tempo Pescaria - Instalador (Windows)
REM   Baixa do GitHub e instala em D:\Pescarias - previsao do tempo
REM =========================================================

set "REPO=https://github.com/fredzibell-ai/Previsao-tempo-pescaria.git"
set "DEST=D:\Pescarias - previsão do tempo"

echo ==========================================================
echo    PREVISAO TEMPO PESCARIA - INSTALADOR
echo ==========================================================
echo    Destino: %DEST%
echo.

REM ---------- Verificar pre-requisitos ----------
where git >nul 2>nul || (echo [ERRO] Git nao encontrado. Instale em https://git-scm.com/download/win && pause && exit /b 1)
where node >nul 2>nul || (echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org && pause && exit /b 1)
where python >nul 2>nul || (echo [ERRO] Python nao encontrado. Instale em https://www.python.org/downloads && pause && exit /b 1)
where yarn >nul 2>nul || (echo [INFO] yarn nao encontrado. Instalando via npm... && call npm install -g yarn)

if not exist "D:\" (echo [ERRO] Unidade D: nao encontrada. Edite a variavel DEST neste .bat. && pause && exit /b 1)

REM ---------- Clonar ou atualizar ----------
if exist "%DEST%\.git" (
    echo [INFO] Repositorio ja existe. Atualizando com git pull...
    cd /d "%DEST%"
    git pull
) else (
    echo [INFO] Clonando repositorio do GitHub...
    git clone "%REPO%" "%DEST%"
    if errorlevel 1 (echo [ERRO] Falha ao clonar o repositorio. && pause && exit /b 1)
    cd /d "%DEST%"
)

REM ---------- Backend ----------
echo.
echo === Configurando BACKEND (FastAPI) ===
cd /d "%DEST%\backend"
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip

REM Instala apenas o necessario para rodar o app (rapido e sem erros no Windows)
(
    echo fastapi==0.110.1
    echo uvicorn==0.25.0
    echo motor==3.3.1
    echo pymongo==4.6.3
    echo pydantic^>=2.6.4
    echo python-dotenv^>=1.0.1
    echo httpx==0.28.1
) > requirements-local.txt
pip install -r requirements-local.txt
if errorlevel 1 (echo [ERRO] Falha ao instalar dependencias do backend. && pause && exit /b 1)

REM Cria backend\.env para uso local
(
    echo MONGO_URL="mongodb://localhost:27017"
    echo DB_NAME="previsao_pescaria"
    echo CORS_ORIGINS="*"
) > .env
call venv\Scripts\deactivate.bat

REM ---------- Frontend ----------
echo.
echo === Configurando FRONTEND (React) ===
cd /d "%DEST%\frontend"

REM Aponta o frontend para o backend LOCAL (sobrescreve a URL do preview)
> .env echo REACT_APP_BACKEND_URL=http://localhost:8001

echo [INFO] Instalando dependencias do frontend (pode demorar alguns minutos)...
call yarn install
if errorlevel 1 (echo [ERRO] Falha no yarn install. && pause && exit /b 1)

echo.
echo ==========================================================
echo    INSTALACAO CONCLUIDA!
echo    Para iniciar o app, execute:  iniciar.bat
echo ==========================================================
echo.
echo    IMPORTANTE: o MongoDB precisa estar em execucao
echo    (servico "MongoDB" em localhost:27017).
echo.
pause
endlocal
