/**
 * Modèle Message (MySQL / MariaDB)
 */

const { query } = require('../config/database');

class Message {
  static async envoyer(messageData) {
    const {
      expediteur_id, destinataire_id, contenu,
      type = 'texte', fichier_url = null, mission_id = null
    } = messageData;

    if (expediteur_id === destinataire_id) {
      throw new Error('Impossible d\'envoyer un message à soi-même');
    }

    const sql = `
      INSERT INTO messages
      (expediteur_id, destinataire_id, contenu, type, fichier_url, mission_id, lu)
      VALUES (?, ?, ?, ?, ?, ?, FALSE)
    `;

    const result = await query(sql, [
      expediteur_id, destinataire_id, contenu, type, fichier_url, mission_id
    ]);

    return await this.trouverParId(result.insertId);
  }

  static async trouverParId(id) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom, u1.prenom as expediteur_prenom, u1.photo as expediteur_photo,
             u2.nom as destinataire_nom, u2.prenom as destinataire_prenom, u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE m.id = ?
    `;
    const messages = await query(sql, [id]);
    return messages.length === 0 ? null : messages[0];
  }

  static async obtenirConversation(utilisateur1_id, utilisateur2_id, limit = 50, offset = 0) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom, u1.prenom as expediteur_prenom, u1.photo as expediteur_photo,
             u2.nom as destinataire_nom, u2.prenom as destinataire_prenom, u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE (m.expediteur_id = ? AND m.destinataire_id = ?)
         OR (m.expediteur_id = ? AND m.destinataire_id = ?)
      ORDER BY m.date_envoi DESC
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [utilisateur1_id, utilisateur2_id, utilisateur2_id, utilisateur1_id, limit, offset]);
  }

  static async obtenirDernierMessage(utilisateur1_id, utilisateur2_id) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom, u1.prenom as expediteur_prenom, u1.photo as expediteur_photo,
             u2.nom as destinataire_nom, u2.prenom as destinataire_prenom, u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE (m.expediteur_id = ? AND m.destinataire_id = ?)
         OR (m.expediteur_id = ? AND m.destinataire_id = ?)
      ORDER BY m.date_envoi DESC
      LIMIT 1
    `;
    const messages = await query(sql, [utilisateur1_id, utilisateur2_id, utilisateur2_id, utilisateur1_id]);
    return messages.length > 0 ? messages[0] : null;
  }

  static async obtenirConversations(utilisateur_id) {
    // MySQL: utilise un JOIN sur la date max par paire de conversation (équivalent de DISTINCT ON PostgreSQL)
    const sql = `
      SELECT
        IF(m.expediteur_id = ?, m.destinataire_id, m.expediteur_id) as autre_utilisateur_id,
        u.nom, u.prenom, u.photo, u.role,
        m.contenu as dernier_message,
        m.date_envoi as dernier_message_date,
        m.lu,
        (
          SELECT COUNT(*) FROM messages sub
          WHERE sub.lu = FALSE
            AND sub.destinataire_id = ?
            AND sub.expediteur_id = IF(m.expediteur_id = ?, m.destinataire_id, m.expediteur_id)
        ) as messages_non_lus
      FROM messages m
      INNER JOIN (
        SELECT
          LEAST(expediteur_id, destinataire_id) as pair_min,
          GREATEST(expediteur_id, destinataire_id) as pair_max,
          MAX(date_envoi) as max_date
        FROM messages
        WHERE expediteur_id = ? OR destinataire_id = ?
        GROUP BY pair_min, pair_max
      ) conv ON LEAST(m.expediteur_id, m.destinataire_id) = conv.pair_min
             AND GREATEST(m.expediteur_id, m.destinataire_id) = conv.pair_max
             AND m.date_envoi = conv.max_date
      INNER JOIN utilisateurs u ON u.id = IF(m.expediteur_id = ?, m.destinataire_id, m.expediteur_id)
      ORDER BY m.date_envoi DESC
    `;
    return await query(sql, [
      utilisateur_id, utilisateur_id, utilisateur_id,
      utilisateur_id, utilisateur_id,
      utilisateur_id
    ]);
  }

  static async marquerCommeLu(id) {
    await query(
      `UPDATE messages SET lu = TRUE, date_lecture = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return await this.trouverParId(id);
  }

  static async marquerConversationCommeLue(utilisateur_id, autre_utilisateur_id) {
    await query(
      `UPDATE messages SET lu = TRUE, date_lecture = CURRENT_TIMESTAMP
       WHERE destinataire_id = ? AND expediteur_id = ?`,
      [utilisateur_id, autre_utilisateur_id]
    );
    return true;
  }

  static async compterMessagesNonLus(utilisateur_id) {
    const result = await query(
      `SELECT COUNT(*) as nombre FROM messages WHERE destinataire_id = ? AND lu = FALSE`,
      [utilisateur_id]
    );
    return Number(result[0].nombre || 0);
  }

  static async supprimer(id) {
    await query(`DELETE FROM messages WHERE id = ?`, [id]);
    return true;
  }

  static async rechercher(utilisateur_id, terme) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom, u1.prenom as expediteur_prenom, u1.photo as expediteur_photo,
             u2.nom as destinataire_nom, u2.prenom as destinataire_prenom, u2.photo as destinataire_photo
      FROM messages m
      INNER JOIN utilisateurs u1 ON m.expediteur_id = u1.id
      INNER JOIN utilisateurs u2 ON m.destinataire_id = u2.id
      WHERE (m.expediteur_id = ? OR m.destinataire_id = ?) AND m.contenu LIKE ?
      ORDER BY m.date_envoi DESC
      LIMIT 50
    `;
    return await query(sql, [utilisateur_id, utilisateur_id, `%${terme}%`]);
  }

  static async obtenirMessagesMission(mission_id) {
    const sql = `
      SELECT m.*,
             u1.nom as expediteur_nom, u1.prenom as expediteur_prenom, u1.photo as expediteur_photo,
             u2.nom as destinataire_nom, u2.prenom as destinataire_prenom, u2.photo as destinataire_photo
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
