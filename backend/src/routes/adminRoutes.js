/**
 * Routes Admin
 * Gère la modération et les opérations administratives
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifierToken, verifierRole } = require('../middleware/auth');

// Toutes les routes admin nécessitent authentification et rôle admin
router.use(verifierToken);
router.use(verifierRole(['admin']));

// Routes pour gérer les dossiers
router.get('/dossiers', adminController.listerLesDossiers);
router.get('/dossiers/:id', adminController.obtenirDossier);
router.post('/dossiers/:id/valider', adminController.validerDossier);
router.post('/dossiers/:id/rejeter', adminController.rejeterDossier);

// Routes pour gérer les utilisateurs
router.get('/utilisateurs', adminController.listerLesUtilisateurs);
router.get('/utilisateurs/:id', adminController.obtenirUtilisateur);
router.post('/utilisateurs/:id/suspendre', adminController.suspendreUtilisateur);
router.post('/utilisateurs/:id/reactiver', adminController.reactiverUtilisateur);

// Routes pour modérer les contenus
router.get('/missions', adminController.listerToutesLesMissions);
router.post('/missions/:id/signaler', adminController.signalerMission);
router.post('/missions/:id/supprimer', adminController.supprimerMission);

// Routes pour consulter les statistiques
router.get('/statistiques', adminController.obtenirStatistiques);
router.get('/statistiques/utilisateurs', adminController.statistiquesUtilisateurs);
router.get('/statistiques/missions', adminController.statistiquesMissions);
router.get('/statistiques/revenus', adminController.statistiquesRevenus);

module.exports = router;
