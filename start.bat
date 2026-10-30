@echo off
rem Avvia la demo in locale: installa le dipendenze se mancano e apre il browser
cd /d "%~dp0"

if not exist node_modules (
    echo Installazione delle dipendenze...
    call npm install
    if errorlevel 1 goto error
)

echo Avvio della demo, premi CTRL+C per fermarla
call npm run dev -- --open
if errorlevel 1 goto error
goto end

:error
echo.
echo Errore: verifica che Node.js sia installato (https://nodejs.org)
pause

:end
