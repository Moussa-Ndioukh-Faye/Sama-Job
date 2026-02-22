/**
 * Contrôleur Admin
 * Gère les opérations administratives
 */

const { Administrateur, Utilisateur } = require('../models/Utilisateur');
const Mission = require('../models/Mission');
const { query } = require('../config/database');
const { creerNotification } = require('../utils/notifications');

/**
 * Lister tous les dossiers
 */
exports.listerLesDossiers = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { statut, page = 1, limit = 20 } = req.query;

    const dossiers = await Administrateur.verifierLeDossier(adminId);

    res.json({
      success: true,
      data: dossiers
    });

  } catch (error) {
    console.error('Erreur listage dossiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dossiers',
      error: error.message
    });
  }
};

/**
 * Obtenir un dossier spécifique
 */
exports.obtenirDossier = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;

    const dossier = await Administrateur.obtenirLeDossier(adminId, id);

    if (!dossier) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    res.json({
      success: true,
      data: dossier
    });

  } catch (error) {
    console.error('Erreur récupération dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dossier',
      error: error.message
    });
  }
};

/**
 * Valider un dossier
 */
exports.validerDossier = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;

    await Administrateur.validerLeDossier(adminId, id);

    // Notifier le prestataire
    await creerNotification(
      id,
      'validation',
      'Dossier validé !',
      'Félicitations ! Votre dossier a été validé. Vous pouvez désormais postuler aux missions.',
      { statut: 'valide' }
    );

    res.json({
      success: true,
      message: 'Dossier validé'
    });

  } catch (error) {
    console.error('Erreur validation dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du dossier',
      error: error.message
    });
  }
};

/**
 * Rejeter un dossier
 */
exports.rejeterDossier = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { motif_rejet } = req.body;

    await Administrateur.rejeterLeDossier(adminId, id, motif_rejet);

    // Notifier le prestataire
    await creerNotification(
      id,
      'validation',
      'Dossier non validé',
      motif_rejet || 'Votre dossier a été rejeté. Veuillez le corriger et le soumettre à nouveau.',
      { statut: 'rejete', motif: motif_rejet }
    );

    res.json({
      success: true,
      message: 'Dossier rejeté'
    });

  } catch (error) {
    console.error('Erreur rejet dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet du dossier',
      error: error.message
    });
  }
};

/**
 * Lister tous les utilisateurs
 */
exports.listerLesUtilisateurs = async (req, res) => {
  try {
    const { role, statut, page = 1, limit = 20 } = req.query;

    const utilisateurs = await Administrateur.gererLesUtilisateurs({
      role,
      statut,
      page,
      limit
    });

    res.json({
      success: true,
      data: utilisateurs
    });

  } catch (error) {
    console.error('Erreur listage utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

/**
 * Obtenir un utilisateur spécifique
 */
exports.obtenirUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Utilisateur.trouverParId(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Suspendre un utilisateur
 */
exports.suspendreUtilisateur = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { raison } = req.body;

    await Administrateur.suspendreUnCompte(adminId, id, raison);

    res.json({
      success: true,
      message: 'Utilisateur suspendu'
    });

  } catch (error) {
    console.error('Erreur suspension utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suspension de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Réactiver un utilisateur
 */
exports.reactiverUtilisateur = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;

    const user = await Utilisateur.trouverParId(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    await query('UPDATE utilisateurs SET statut = ? WHERE id = ?', ['actif', id]);

    await query(
      'INSERT INTO historique (utilisateur_id, action, table_concernee, enregistrement_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'reactiver_compte', 'utilisateurs', id, JSON.stringify({ utilisateur_id: id })]
    );

    res.json({
      success: true,
      message: 'Utilisateur réactivé'
    });

  } catch (error) {
    console.error('Erreur réactivation utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réactivation de l\'utilisateur',
      error: error.message
    });
  }
};

/**
 * Lister toutes les missions
 */
exports.listerToutesLesMissions = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;

    const missions = await Administrateur.gererLesMissions({
      statut,
      page,
      limit
    });

    res.json({
      success: true,
      data: missions
    });

  } catch (error) {
    console.error('Erreur listage missions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des missions',
      error: error.message
    });
  }
};

/**
 * Signaler une mission
 */
exports.signalerMission = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { raison } = req.body;

    await Administrateur.modererLesContenus(adminId, 'mission', id, 'signaler');

    res.json({
      success: true,
      message: 'Mission signalée'
    });

  } catch (error) {
    console.error('Erreur signalement mission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement de la mission',
      error: error.message
    });
  }
};

/**
 * Supprimer une mission
 */
exports.supprimerMission = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;

    const mission = await Mission.trouverParId(id);
    if (!mission) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }

    await query('DELETE FROM mission_competences WHERE mission_id = ?', [id]);
    await query('DELETE FROM mission_images WHERE mission_id = ?', [id]);
    await query('DELETE FROM candidatures WHERE mission_id = ?', [id]);
    await query('DELETE FROM missions WHERE id = ?', [id]);

    await query(
      'INSERT INTO historique (utilisateur_id, action, table_concernee, enregistrement_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'supprimer_mission', 'missions', id, JSON.stringify({ titre: mission.titre })]
    );

    await query(
      'UPDATE administrateurs SET nombre_moderations = nombre_moderations + 1 WHERE id = ?',
      [adminId]
    );

    res.json({
      success: true,
      message: 'Mission supprimée'
    });

  } catch (error) {
    console.error('Erreur suppression mission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la mission',
      error: error.message
    });
  }
};

/**
 * Obtenir les statistiques
 */
exports.obtenirStatistiques = async (req, res) => {
  try {
    const stats = await Administrateur.consulterLesStatistiques();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Statistiques utilisateurs
 */
exports.statistiquesUtilisateurs = async (req, res) => {
  try {
    const stats = await Administrateur.consulterLesStatistiques();

    res.json({
      success: true,
      data: stats.utilisateurs
    });

  } catch (error) {
    console.error('Erreur statistiques utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Statistiques missions
 */
exports.statistiquesMissions = async (req, res) => {
  try {
    const stats = await Administrateur.consulterLesStatistiques();

    res.json({
      success: true,
      data: stats.missions
    });

  } catch (error) {
    console.error('Erreur statistiques missions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

/**
 * Statistiques revenus
 */
exports.statistiquesRevenus = async (req, res) => {
  try {
    const stats = await Administrateur.consulterLesStatistiques();

    res.json({
      success: true,
      data: stats.revenus
    });

  } catch (error) {
    console.error('Erreur statistiques revenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
