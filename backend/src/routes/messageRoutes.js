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

// Compter les messages non lus
router.get('/non-lus/count', messageController.compterNonLus);

// Marquer toute une conversation comme lue (quand l'utilisateur ouvre une conversation)
router.put('/conversations/:utilisateurId/lus', messageController.marquerConversationCommeLue);

// Marquer un message individuel comme lu
router.put('/:messageId/lu', messageController.marquerCommeLu);

module.exports = router;
