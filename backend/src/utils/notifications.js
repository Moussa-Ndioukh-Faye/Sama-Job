/**
 * Utilitaire de création de notifications en base de données
 */

const { query } = require('../config/database');

/**
 * Créer une notification pour un utilisateur
 */
async function creerNotification(utilisateurId, type, titre, message, metadata = null) {
  try {
    await query(
      `INSERT INTO notifications (utilisateur_id, type, titre, message, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [utilisateurId, type, titre, message, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    // Ne jamais faire échouer la requête principale à cause d'une notification
    console.error('Erreur création notification:', error);
  }
}

module.exports = { creerNotification };
