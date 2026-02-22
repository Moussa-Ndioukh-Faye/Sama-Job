/**
 * Routes Message
 * Gère les conversations et la messagerie entre utilisateurs
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifierToken } = require('../middleware/auth');

// Toutes les routes messages nécessitent authentification
router.use(verifierToken);

// Récupérer toutes les conversations
router.get('/conversations', messageController.obtenirConversations);

// Récupérer les messages d'une conversation spécifique
router.get('/conversations/:utilisateurId', messageController.obtenirConversation);

// Envoyer un message
router.post('/', messageController.envoyerMessage);

// Marquer un message comme lu
router.put('/:messageId/lu', messageController.marquerCommeLu);

// Compter les messages non lus
router.get('/non-lus/count', messageController.compterNonLus);

module.exports = router;
