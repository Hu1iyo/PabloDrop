@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js не найден. Установите Node.js и перезапустите VS Code.
    pause
    exit /b 1
)

where cloudflared >nul 2>nul
if errorlevel 1 (
    echo cloudflared установлен, но не найден в PATH.
    echo Закройте все окна VS Code и PowerShell, откройте заново и запустите этот файл.
    echo Если ошибка останется, проверьте команду: where.exe cloudflared
    pause
    exit /b 1
)

npm run cloudflare
if errorlevel 1 pause