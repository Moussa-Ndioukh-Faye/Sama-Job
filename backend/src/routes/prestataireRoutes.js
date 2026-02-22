/**
 * Routes Prestataire
 * Gère la consultation des missions et les postulations
 */

const express = require('express');
const router = express.Router();
const prestataireController = require('../controllers/prestataireController');
const { verifierToken, verifierRole } = require('../middleware/auth');

// Toutes les routes prestataire nécessitent authentification + rôle prestataire
router.use(verifierToken);
router.use(verifierRole(['prestataire']));

// Routes pour consulter les missions
router.get('/missions', prestataireController.consulterLesMissions);
router.get('/missions/rechercher/:terme', prestataireController.rechercherMissions);
router.get('/missions/:id', prestataireController.obtenirMissionDetail);

// Routes pour les postulations
router.post('/candidatures', prestataireController.postulerAUneMission);
router.get('/candidatures', prestataireController.listerMesCandidatures);
router.get('/candidatures/:id', prestataireController.obtenirCandidature);
router.delete('/candidatures/:id', prestataireController.annulerCandidature);

// Réaliser une mission (marquer comme terminée)
router.post('/missions/:id/realiser', prestataireController.realiserMission);

// Routes pour consulter l'historique
router.get('/missions-realisees', prestataireController.consulterHistorique);
router.get('/missions-realisees/:id', prestataireController.obtenirMissionRealisee);

// Routes pour le profil prestataire
router.get('/profil', prestataireController.obtenirProfil);
router.put('/profil', prestataireController.mettreAJourProfil);

// Routes pour le dossier de qualification
router.post('/dossier', prestataireController.deposerDossier);
router.get('/dossier', prestataireController.obtenirDossier);

module.exports = router;
