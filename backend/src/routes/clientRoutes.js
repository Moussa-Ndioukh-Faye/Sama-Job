/**
 * Routes Client
 * Gère les missions, candidatures, et opérations client
 */

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifierToken, verifierRole } = require('../middleware/auth');

// Toutes les routes client nécessitent authentification + rôle client
router.use(verifierToken);
router.use(verifierRole(['client']));

// Routes pour les missions
router.post('/missions', clientController.publierMission);
router.get('/missions', clientController.listerMesMissions);
router.get('/missions/:id', clientController.obtenirMission);
router.put('/missions/:id', clientController.mettreAJourMission);
router.delete('/missions/:id', clientController.supprimerMission);

// Routes pour les candidatures
router.get('/candidatures', clientController.consulterLesCandidatures);
router.get('/candidatures/:id', clientController.obtenirCandidature);
router.post('/candidatures/:id/accepter', clientController.accepterCandidature);
router.post('/candidatures/:id/rejeter', clientController.rejeterCandidature);

// Routes pour clôturer une mission
router.post('/missions/:id/cloturer', clientController.cloturerMission);

// Routes pour évaluer un prestataire
router.post('/missions/:id/evaluer', clientController.evaluerPrestataire);

module.exports = router;
