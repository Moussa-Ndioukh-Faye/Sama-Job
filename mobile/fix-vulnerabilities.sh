cl#!/bin/bash

echo "========================================"
echo "Correction des Vulnérabilités Mobile"
echo "========================================"
echo ""

echo "Étape 1: Audit des vulnérabilités..."
echo ""
npm audit

echo ""
echo "========================================"
echo "Étape 2: Correction automatique..."
echo "========================================"
echo ""
npm audit fix

echo ""
echo "========================================"
echo "Étape 3: Vérification post-correction..."
echo "========================================"
echo ""
npm audit

echo ""
echo "========================================"
echo "Terminé !"
echo "========================================"
echo ""
echo "Si des vulnérabilités persistent:"
echo "1. Exécutez: npm audit fix --force"
echo "   (ATTENTION: peut casser certaines dépendances)"
echo "2. Ou mettez à jour manuellement les packages problématiques"
echo ""
