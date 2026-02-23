/**
 * Routes d'Authentification
 * Gère l'inscription, la connexion, et la gestion du profil
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { createAccountRules, loginRules, updateProfileRules, fcmTokenRules, validate } = require('../middleware/validation');
const { verifierToken } = require('../middleware/auth');
const { strictRateLimiter } = require('../middleware/rateLimiter');

// Routes publiques avec rate limiting strict
router.post('/creer-compte', strictRateLimiter, createAccountRules, validate, authController.creerUnCompte);
// Normaliser `email`/`telephone` en `identifier` + mettre l'email en minuscules
// Doit s'exécuter AVANT loginRules pour que la validation porte sur le bon champ
const normalizeLoginIdentifier = (req, res, next) => {
  if (!req.body.identifier) {
    if (req.body.email) req.body.identifier = req.body.email;
    else if (req.body.telephone) req.body.identifier = req.body.telephone;
  }
  // Normaliser l'email en minuscules (cohérent avec createAccountRules → normalizeEmail)
  if (req.body.identifier && req.body.identifier.includes('@')) {
    req.body.identifier = req.body.identifier.trim().toLowerCase();
  }
  next();
};

router.post('/connexion', strictRateLimiter, normalizeLoginIdentifier, loginRules, validate, authController.seConnecter);

// Routes protégées
router.get('/profil', verifierToken, authController.getProfilUtilisateur);
router.put('/profil', verifierToken, updateProfileRules, validate, authController.gererSonProfil);
router.put('/fcm-token', verifierToken, fcmTokenRules, validate, authController.mettreAJourFCMToken);

// Profil public d'un utilisateur (pour afficher le profil d'un autre user)
router.get('/utilisateurs/:id', verifierToken, authController.getProfilPublic);

module.exports = router;
