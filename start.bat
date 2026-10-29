@echo off
chcp 65001 >nul
title SubManager - Demarrage de l'application
color 0B

echo ======================================================================
echo          SUBMANAGER - GESTION DES ABONNEMENTS NUMERIQUES
echo ======================================================================
echo.
echo [1/3] Verification de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou pas dans le PATH.
    echo Veuillez installer Node.js depuis https://nodejs.org
    pause
    exit /b 1
)
echo   --^> Node.js detecte avec succes.

echo.
echo [2/3] Lancement du Serveur Backend (Port 5000)...
start "SubManager Backend API" cmd /k "cd /d "%~dp0server" && npm start"

echo.
echo [3/3] Lancement de l'Application Frontend (Vite Port 5173)...
start "SubManager Frontend React" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo Patientez pendant l'initialisation des services...
timeout /t 3 >nul

echo.
echo Ouverture du tableau de bord dans votre navigateur...
start http://localhost:5173

echo.
echo ======================================================================
echo   APPLICATION EN COURS D'EXECUTION !
echo   - Frontend : http://localhost:5173
echo   - Backend  : http://localhost:5000/api
echo.
echo   Identifiants administrateur :
echo   Voir ADMIN_EMAIL et ADMIN_INITIAL_PASSWORD dans server\.env
echo ======================================================================
echo.
echo (Vous pouvez fermer cette fenetre principale, les deux serveurs tournent)
timeout /t 5 >nul
exit
