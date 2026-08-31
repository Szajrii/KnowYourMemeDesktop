@echo off
title Know Your Meme Desktop Launcher
echo ==============================================
echo   Know Your Meme Desktop - Uruchamianie...
echo ==============================================
echo.

where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    if not exist "node_modules" (
        echo Instalowanie zaleznosci za pomoca pnpm...
        call pnpm install
    )
    echo Uruchamianie aplikacji w trybie deweloperskim (pnpm)...
    call pnpm dev
) else (
    if not exist "node_modules" (
        echo Instalowanie zaleznosci za pomoca npm...
        call npm install
    )
    echo Uruchamianie aplikacji w trybie deweloperskim (npm)...
    call npm run dev
)
