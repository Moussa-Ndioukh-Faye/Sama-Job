/**
 * Modèle Message
 * Gère les messages entre utilisateurs
 * Basé sur le diagramme de cas d'utilisation
 */

const { query } = require('../config/database');

class Message {
  /**
   * Envoyer un message
   */
  static async envoyer(messageData) {
    const {
      expediteur_id,
      destinataire_id,
      contenu,
      type = 'texte',
      fichier_url = null,
      mission_id = null
    } = messageData;

    // Vérifier que l'expéditeur et le destinataire ne sont pas les mêmes
    if (expediteur_id === destinataire_id) {
      throw new Error('Impossible d\'envoyer un message à soi-même');
    }

    const sql = `
      INSERT INTO messages 
      (expediteur_id, destinataire_id, contenu, type, fichier_url, mission_id, lu)
      VALUES (?, ?, ?, ?, ?, ?, false)
    `;

    const result = await query(sql, [
      expediteur_id,
      destinataire_id,
      contenu,
      type,
      fichier_url,
      mission_id
    ]);

    return await this.trouverParId(result.insertId);
  }

  /**
   * Trouver un message par ID
   */
  static async trouverParId(id) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom,
             u1.prenom as expediteur_prenom,
             u1.photo as expediteur_photo,
             u2.nom as destinataire_nom,
             u2.prenom as destinataire_prenom,
             u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE m.id = ?
    `;

    const messages = await query(sql, [id]);

    if (messages.length === 0) {
      return null;
    }

    return messages[0];
  }

  /**
   * Récupérer la conversation entre deux utilisateurs
   */
  static async obtenirConversation(utilisateur1_id, utilisateur2_id, limit = 50, offset = 0) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom,
             u1.prenom as expediteur_prenom,
             u1.photo as expediteur_photo,
             u2.nom as destinataire_nom,
             u2.prenom as destinataire_prenom,
             u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE (
        (m.expediteur_id = ? AND m.destinataire_id = ?) OR
        (m.expediteur_id = ? AND m.destinataire_id = ?)
      )
      ORDER BY m.date_envoi DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [
      utilisateur1_id,
      utilisateur2_id,
      utilisateur2_id,
      utilisateur1_id,
      limit,
      offset
    ]);
  }

  /**
   * Récupérer le dernier message d'une conversation
   */
  static async obtenirDernierMessage(utilisateur1_id, utilisateur2_id) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom,
             u1.prenom as expediteur_prenom,
             u1.photo as expediteur_photo,
             u2.nom as destinataire_nom,
             u2.prenom as destinataire_prenom,
             u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE (
        (m.expediteur_id = ? AND m.destinataire_id = ?) OR
        (m.expediteur_id = ? AND m.destinataire_id = ?)
      )
      ORDER BY m.date_envoi DESC
      LIMIT 1
    `;

    const messages = await query(sql, [
      utilisateur1_id,
      utilisateur2_id,
      utilisateur2_id,
      utilisateur1_id
    ]);

    return messages.length > 0 ? messages[0] : null;
  }

  /**
   * Récupérer toutes les conversations d'un utilisateur
   */
  static async obtenirConversations(utilisateur_id) {
    const sql = `
      SELECT DISTINCT 
             IF(m.expediteur_id = ?, m.destinataire_id, m.expediteur_id) as autre_utilisateur_id,
             u.nom,
             u.prenom,
             u.photo,
             u.role,
             m.contenu as dernier_message,
             m.date_envoi as dernier_message_date,
             m.lu,
             COUNT(CASE WHEN m.lu = false AND m.destinataire_id = ? THEN 1 END) as messages_non_lus
      FROM messages m
      INNER JOIN utilisateurs u ON (
        CASE 
          WHEN m.expediteur_id = ? THEN m.destinataire_id = u.id
          ELSE m.expediteur_id = u.id
        END
      )
      WHERE m.expediteur_id = ? OR m.destinataire_id = ?
      GROUP BY autre_utilisateur_id
      ORDER BY m.date_envoi DESC
    `;

    return await query(sql, [
      utilisateur_id,
      utilisateur_id,
      utilisateur_id,
      utilisateur_id,
      utilisateur_id
    ]);
  }

  /**
   * Marquer un message comme lu
   */
  static async marquerCommeLu(id) {
    const sql = `
      UPDATE messages 
      SET lu = true, date_lecture = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [id]);

    return await this.trouverParId(id);
  }

  /**
   * Marquer tous les messages comme lus pour une conversation
   */
  static async marquerConversationCommeLue(utilisateur_id, autre_utilisateur_id) {
    const sql = `
      UPDATE messages 
      SET lu = true, date_lecture = CURRENT_TIMESTAMP
      WHERE destinataire_id = ? AND expediteur_id = ?
    `;

    await query(sql, [utilisateur_id, autre_utilisateur_id]);

    return true;
  }

  /**
   * Compter les messages non lus
   */
  static async compterMessagesNonLus(utilisateur_id) {
    const sql = `
      SELECT COUNT(*) as nombre FROM messages 
      WHERE destinataire_id = ? AND lu = false
    `;

    const result = await query(sql, [utilisateur_id]);

    return result[0].nombre;
  }

  /**
   * Supprimer un message
   */
  static async supprimer(id) {
    const sql = 'DELETE FROM messages WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  /**
   * Rechercher des messages
   */
  static async rechercher(utilisateur_id, terme) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom,
             u1.prenom as expediteur_prenom,
             u1.photo as expediteur_photo,
             u2.nom as destinataire_nom,
             u2.prenom as destinataire_prenom,
             u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE (m.expediteur_id = ? OR m.destinataire_id = ?) 
      AND m.contenu LIKE ?
      ORDER BY m.date_envoi DESC
      LIMIT 50
    `;

    const searchTerm = `%${terme}%`;
    return await query(sql, [utilisateur_id, utilisateur_id, searchTerm]);
  }

  /**
   * Récupérer les messages d'une mission
   */
  static async obtenirMessagesMission(mission_id) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom,
             u1.prenom as expediteur_prenom,
             u1.photo as expediteur_photo,
             u2.nom as destinataire_nom,
             u2.prenom as destinataire_prenom,
             u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE m.mission_id = ?
      ORDER BY m.date_envoi ASC
    `;

    return await query(sql, [mission_id]);
  }
}

module.exports = Message;
