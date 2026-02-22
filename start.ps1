#!/usr/bin/env pwsh
# Script de démarrage de SamaJob
# Démarre le backend et le mobile

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Démarrage de SamaJob" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path ".\backend\server.js")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis la racine du projet SamaJob" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow

# Vérifier backend node_modules
if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "📥 Installation des dépendances backend..." -ForegroundColor Yellow
    Push-Location backend
    npm install --legacy-peer-deps
    Pop-Location
}

# Vérifier mobile node_modules
if (-not (Test-Path ".\mobile\node_modules")) {
    Write-Host "📥 Installation des dépendances mobile..." -ForegroundColor Yellow
    Push-Location mobile
    npm install --legacy-peer-deps
    Pop-Location
}

Write-Host "✅ Tous les fichiers sont prêts" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔧 Démarrage des services" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Démarrer le backend en arrière-plan
Write-Host "🌐 Démarrage du backend..." -ForegroundColor Blue
Push-Location backend
Start-Process npm -ArgumentList "run", "dev" -NoNewWindow
Pop-Location

Start-Sleep -Seconds 3

Write-Host "📱 Démarrage de l'app mobile..." -ForegroundColor Blue
Push-Location mobile
# Utiliser npx expo pour lancer sans installation globale
& npx expo start
Pop-Location
