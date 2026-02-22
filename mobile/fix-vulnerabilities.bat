@echo off
echo ========================================
echo Correction des Vulnerabilites Mobile
echo ========================================
echo.

echo Etape 1: Audit des vulnerabilites...
echo.
call npm audit

echo.
echo ========================================
echo Etape 2: Correction automatique...
echo ========================================
echo.
call npm audit fix

echo.
echo ========================================
echo Etape 3: Verification post-correction...
echo ========================================
echo.
call npm audit

echo.
echo ========================================
echo Termine !
echo ========================================
echo.
echo Si des vulnerabilites persistent:
echo 1. Executez: npm audit fix --force
echo    (ATTENTION: peut casser certaines dependances)
echo 2. Ou mettez a jour manuellement les packages problematiques
echo.
pause
