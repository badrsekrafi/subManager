@echo off
chcp 65001 >nul
title SubManager - Initialisation des donnees de demonstration
color 0A

echo ======================================================================
echo   INITIALISATION DES DONNEES DE DEMONSTRATION (CLIENTS, ABONNEMENTS)
echo ======================================================================
echo.
cd /d "%~dp0server"
node scripts/seed.js

echo.
echo Operation terminee.
pause
