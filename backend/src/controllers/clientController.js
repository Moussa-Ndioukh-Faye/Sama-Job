/**
 * Contrôleur Client
 * Gère les opérations spécifiques au rôle Client
 */

const { Client } = require('../models/Utilisateur');
const Mission = require('../models/Mission');
const { query } = require('../config/database');
const { creerNotification } = require('../utils/notifications');

/**
 * Publier une mission
 */
exports.publierMission = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const missionData = {
      client_id: clientId,
      ...req.body
    };

    const missionId = await Client.publierMission(clientId, req.body);

    const mission = await Mission.trouverParId(missionId);

    res.status(201).json({
      success: true,
      message: 'Mission publiée avec succès',
      data: mission
    });

  } catch (error) {
    console.error('Erreur publication mission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la publication de la mission',
      error: error.message
    });
  }
};

/**
 * Lister ses missions
 */
exports.listerMesMissions = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const { statut } = req.query;

    const missions = await Mission.listerParClient(clientId, statut);

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
 * Obtenir une mission spécifique
 */
exports.obtenirMission = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    const mission = await Mission.trouverParId(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Vérifier que la mission appartient au client
    if (mission.client_id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette mission'
      });
    }

    res.json({
      success: true,
      data: mission
    });

  } catch (error) {
    console.error('Erreur récupération mission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la mission',
      error: error.message
    });
  }
};

/**
 * Mettre à jour une mission
 */
exports.mettreAJourMission = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    const mission = await Mission.trouverParId(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Vérifier que la mission appartient au client
    if (mission.client_id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette mission'
      });
    }

    const miseAJour = await Mission.mettreAJour(id, req.body);

    res.json({
      success: true,
      message: 'Mission mise à jour avec succès',
      data: miseAJour
    });

  } catch (error) {
    console.error('Erreur mise à jour mission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la mission',
      error: error.message
    });
  }
};

/**
 * Supprimer une mission
 */
exports.supprimerMission = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    const mission = await Mission.trouverParId(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    // Vérifier que la mission appartient au client
    if (mission.client_id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette mission'
      });
    }

    // Bloquer la suppression si un prestataire travaille dessus
    if (!['ouverte', 'annulee'].includes(mission.statut)) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une mission en cours ou terminée'
      });
    }

    await Mission.supprimer(id);

    res.json({
      success: true,
      message: 'Mission supprimée avec succès'
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
 * Consulter les candidatures
 */
exports.consulterLesCandidatures = async (req, res) => {
  try {
    const clientId = req.user.userId;
    const { missionId } = req.query;

    const candidatures = await Client.consulterLesCandidatures(clientId, missionId);

    res.json({
      success: true,
      data: candidatures
    });

  } catch (error) {
    console.error('Erreur consultation candidatures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des candidatures',
      error: error.message
    });
  }
};

/**
 * Obtenir une candidature
 */
exports.obtenirCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    const candidature = await Client.obtenirCandidature(clientId, id);

    res.json({
      success: true,
      data: candidature
    });

  } catch (error) {
    console.error('Erreur récupération candidature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la candidature',
      error: error.message
    });
  }
};

/**
 * Accepter une candidature
 */
exports.accepterCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    const candidature = await Client.selectionnerUnPrestataire(clientId, id);

    // Notifier le prestataire
    await creerNotification(
      candidature.prestataire_id,
      'candidature',
      'Candidature acceptée !',
      'Votre candidature a été acceptée. Vous pouvez démarrer la mission.',
      { candidature_id: candidature.id, mission_id: candidature.mission_id }
    );

    res.json({
      success: true,
      message: 'Candidature acceptée'
    });

  } catch (error) {
    console.error('Erreur acceptation candidature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation de la candidature',
      error: error.message
    });
  }
};

/**
 * Rejeter une candidature
 */
exports.rejeterCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;
    const { motif_rejet } = req.body;

    // Récupérer la candidature avant de la rejeter pour avoir le prestataire_id
    const candidature = await Client.obtenirCandidature(clientId, id);
    await Client.rejeterCandidature(clientId, id, motif_rejet);

    // Notifier le prestataire
    await creerNotification(
      candidature.prestataire_id,
      'candidature',
      'Candidature non retenue',
      motif_rejet || 'Votre candidature n\'a pas été retenue pour cette mission.',
      { candidature_id: candidature.id, mission_id: candidature.mission_id }
    );

    res.json({
      success: true,
      message: 'Candidature rejetée'
    });

  } catch (error) {
    console.error('Erreur rejet candidature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet de la candidature',
      error: error.message
    });
  }
};

/**
 * Clôturer une mission
 */
exports.cloturerMission = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    const mission = await Mission.trouverParId(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
      });
    }

    if (mission.client_id !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cette mission'
      });
    }

    await Client.validerLaFinDeMission(clientId, id);

    res.json({
      success: true,
      message: 'Mission clôturée avec succès'
    });

  } catch (error) {
    console.error('Erreur clôture mission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la clôture de la mission',
      error: error.message
    });
  }
};

/**
 * Évaluer un prestataire
 */
exports.evaluerPrestataire = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId;

    // Récupérer le prestataire accepté pour cette mission
    const candidatures = await query(
      `SELECT prestataire_id FROM candidatures WHERE mission_id = ? AND statut = 'acceptee' LIMIT 1`,
      [id]
    );

    if (candidatures.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun prestataire accepté pour cette mission'
      });
    }

    const evaluationData = {
      missionId: id,
      clientId,
      prestataireId: candidatures[0].prestataire_id,
      ...req.body
    };

    const evaluationId = await Client.noterEtCommenterLePrestataire(evaluationData);

    res.json({
      success: true,
      message: 'Évaluation enregistrée',
      data: { id: evaluationId }
    });

  } catch (error) {
    console.error('Erreur évaluation prestataire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'évaluation du prestataire',
      error: error.message
    });
  }
};
