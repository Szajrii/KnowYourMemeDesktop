@echo off
title Know Your Meme Desktop Launcher
echo ==============================================
echo   Know Your Meme Desktop - Uruchamianie...
echo ==============================================
echo.

if not exist "node_modules" (
    echo Instalowanie zaleznosci...
    call npm install
)

echo Uruchamianie aplikacji w trybie deweloperskim...
npm run dev
