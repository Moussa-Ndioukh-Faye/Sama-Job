/**
 * Contrôleur Notifications
 */

const { query } = require('../config/database');

/**
 * Récupérer les notifications de l'utilisateur
 */
exports.obtenirNotifications = async (req, res) => {
  try {
    const utilisateurId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sql = `
      SELECT * FROM notifications
      WHERE utilisateur_id = ?
      ORDER BY date_creation DESC
      LIMIT ? OFFSET ?
    `;

    const notifications = await query(sql, [utilisateurId, parseInt(limit), offset]);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Erreur notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des notifications' });
  }
};

/**
 * Compter les notifications non lues
 */
exports.compterNonLues = async (req, res) => {
  try {
    const utilisateurId = req.user.userId;

    const sql = 'SELECT COUNT(*) as count FROM notifications WHERE utilisateur_id = ? AND lue = false';
    const result = await query(sql, [utilisateurId]);

    res.json({
      success: true,
      data: { count: result[0].count }
    });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};

/**
 * Marquer une notification comme lue
 */
exports.marquerCommeLue = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const utilisateurId = req.user.userId;

    await query(
      'UPDATE notifications SET lue = true, date_lecture = CURRENT_TIMESTAMP WHERE id = ? AND utilisateur_id = ?',
      [notificationId, utilisateurId]
    );

    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
exports.marquerToutesLues = async (req, res) => {
  try {
    const utilisateurId = req.user.userId;

    await query(
      'UPDATE notifications SET lue = true, date_lecture = CURRENT_TIMESTAMP WHERE utilisateur_id = ? AND lue = false',
      [utilisateurId]
    );

    res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
};
