@echo off
chcp 65001 >nul
title SubManager - Arret des serveurs
color 0C

echo ======================================================================
echo          ARRET DES SERVEURS SUBMANAGER (PORT 5000 ET 5173)
echo ======================================================================
echo.

echo Arret des processus Node sur les ports 5000 et 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo Les serveurs ont ete arretes avec succes.
timeout /t 3 >nul
exit
