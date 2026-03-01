/**
 * Contrôleur Message
 * Gère les conversations et messages entre utilisateurs
 */

const Message = require('../models/Message');

/**
 * Récupérer toutes les conversations de l'utilisateur connecté
 */
exports.obtenirConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Message.obtenirConversations(userId);

    // Mapper les champs pour le format attendu par le mobile
    const formattedConversations = conversations.map((conv) => ({
      utilisateur_id: conv.autre_utilisateur_id,
      nom_complet: `${conv.prenom} ${conv.nom}`,
      photo: conv.photo,
      role: conv.role,
      dernier_message: conv.dernier_message,
      derniere_activite: conv.dernier_message_date,
      non_lu: conv.messages_non_lus || 0,
    }));

    res.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: error.message,
    });
  }
};

/**
 * Récupérer les messages d'une conversation avec un utilisateur
 */
exports.obtenirConversation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { utilisateurId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.obtenirConversation(
      userId,
      parseInt(utilisateurId),
      parseInt(limit),
      parseInt(offset)
    );

    // Inverser pour afficher du plus ancien au plus récent
    messages.reverse();

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Erreur récupération conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la conversation',
      error: error.message,
    });
  }
};

/**
 * Envoyer un message
 */
exports.envoyerMessage = async (req, res) => {
  try {
    const expediteurId = req.user.userId;
    const { destinataire_id, contenu, type, mission_id } = req.body;

    if (!destinataire_id || !contenu) {
      return res.status(400).json({
        success: false,
        message: 'Destinataire et contenu sont requis',
      });
    }

    if (!contenu.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le message ne peut pas être vide',
      });
    }

    const message = await Message.envoyer({
      expediteur_id: expediteurId,
      destinataire_id: parseInt(destinataire_id),
      contenu: contenu.trim(),
      type: type || 'texte',
      mission_id: mission_id || null,
    });

    res.status(201).json({
      success: true,
      message: 'Message envoyé',
      data: message,
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'envoi du message',
      error: error.message,
    });
  }
};

/**
 * Marquer un message comme lu
 */
exports.marquerCommeLu = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.marquerCommeLu(parseInt(messageId));

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Message marqué comme lu',
      data: message,
    });
  } catch (error) {
    console.error('Erreur marquage message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage du message',
      error: error.message,
    });
  }
};

/**
 * Marquer tous les messages d'une conversation comme lus
 * Appelé quand l'utilisateur ouvre une conversation
 */
exports.marquerConversationCommeLue = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { utilisateurId } = req.params;

    await Message.marquerConversationCommeLue(userId, parseInt(utilisateurId));

    res.json({
      success: true,
      message: 'Conversation marquée comme lue',
    });
  } catch (error) {
    console.error('Erreur marquage conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la conversation',
      error: error.message,
    });
  }
};

/**
 * Compter les messages non lus
 */
exports.compterNonLus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const nombre = await Message.compterMessagesNonLus(userId);

    res.json({
      success: true,
      data: { nombre },
    });
  } catch (error) {
    console.error('Erreur comptage messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des messages non lus',
      error: error.message,
    });
  }
};
