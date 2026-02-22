/**
 * Contrôleur Prestataire
 * Gère les opérations spécifiques au rôle Prestataire
 */

const { Prestataire } = require('../models/Utilisateur');
const Mission = require('../models/Mission');
const { query } = require('../config/database');
const { creerNotification } = require('../utils/notifications');

/**
 * Consulter les missions
 */
exports.consulterLesMissions = async (req, res) => {
  try {
    const { domaine, ville, budget_min, budget_max, type_location, page = 1, limit = 20 } = req.query;

    const missions = await Prestataire.consulterLesMissions(req.user.userId, {
      domaine,
      ville,
        budgetMin: budget_min, // en Franc CFA (XOF)
        budgetMax: budget_max, // en Franc CFA (XOF)
      typeLocation: type_location,
      page,
      limit
    });

    res.json({
      success: true,
      data: missions
    });

  } catch (error) {
    console.error('Erreur consultation missions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la consultation des missions',
      error: error.message
    });
  }
};

/**
 * Obtenir les détails d'une mission
 */
exports.obtenirMissionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const mission = await Mission.trouverParId(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission non trouvée'
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
 * Rechercher des missions
 */
exports.rechercherMissions = async (req, res) => {
  try {
    const { terme } = req.params;

    const missions = await Mission.rechercher(terme);

    res.json({
      success: true,
      data: missions
    });

  } catch (error) {
    console.error('Erreur recherche missions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
};

/**
 * Postuler à une mission
 */
exports.postulerAUneMission = async (req, res) => {
  try {
    const prestataireId = req.user.userId;
    const { mission_id, client_id, message, proposition_prix, delai_propose } = req.body; // proposition_prix en Franc CFA (XOF)

    const candidatureId = await Prestataire.postulerAUneMission({
      missionId: mission_id,
      prestataireId,
      clientId: client_id,
      message,
      propositionPrix: proposition_prix, // en Franc CFA (XOF)
      delaiPropose: delai_propose
    });

    res.status(201).json({
      success: true,
      message: 'Candidature envoyée',
      data: { id: candidatureId }
    });

  } catch (error) {
    console.error('Erreur postulation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la postulation',
      error: error.message
    });
  }
};

/**
 * Lister mes candidatures
 */
exports.listerMesCandidatures = async (req, res) => {
  try {
    const prestataireId = req.user.userId;
    const candidatures = await Prestataire.listerMesCandidatures(prestataireId);
    // Les prix des candidatures sont en Franc CFA (XOF)
    res.json({ success: true, data: candidatures });

  } catch (error) {
    console.error('Erreur listage candidatures:', error);
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
    const prestataireId = req.user.userId;
    const candidature = await Prestataire.obtenirCandidaturePrestataire(prestataireId, id);
    // Les prix de la candidature sont en Franc CFA (XOF)
    res.json({ success: true, data: candidature });

  } catch (error) {
    console.error('Erreur récupération candidature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

/**
 * Annuler une candidature
 */
exports.annulerCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const prestataireId = req.user.userId;
    await Prestataire.annulerCandidature(prestataireId, id);
    res.json({ success: true, message: 'Candidature annulée' });

  } catch (error) {
    console.error('Erreur annulation candidature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation',
      error: error.message
    });
  }
};

/**
 * Consulter l'historique des missions réalisées
 */
exports.consulterHistorique = async (req, res) => {
  try {
    const prestataireId = req.user.userId;

    const missions = await Prestataire.consulterSonHistorique(prestataireId);

    res.json({
      success: true,
      data: missions
    });

  } catch (error) {
    console.error('Erreur consultation historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

/**
 * Obtenir une mission réalisée
 */
exports.obtenirMissionRealisee = async (req, res) => {
  try {
    const { id } = req.params;

    const mission = await Mission.trouverParId(id);

    res.json({
      success: true,
      data: mission
    });

  } catch (error) {
    console.error('Erreur récupération mission réalisée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
};

/**
 * Obtenir mon profil prestataire
 */
exports.obtenirProfil = async (req, res) => {
  try {
    const prestataireId = req.user.userId;

    // Utiliser Utilisateur.trouverParId qui fonctionne pour tous les rôles
    const { Utilisateur } = require('../models/Utilisateur');
    const user = await Utilisateur.trouverParId(prestataireId);

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

/**
 * Mettre à jour mon profil prestataire
 */
exports.mettreAJourProfil = async (req, res) => {
  try {
    const prestataireId = req.user.userId;
    const { Utilisateur } = require('../models/Utilisateur');

    const user = await Utilisateur.gererSonProfil(prestataireId, req.body);

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: user
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

/**
 * Déposer un dossier de qualification
 */
exports.deposerDossier = async (req, res) => {
  try {
    const prestataireId = req.user.userId;
    const { domaine, niveau_etude, universite } = req.body;

    const path = require('path');
    const fs = require('fs');

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'dossiers');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let carteEtudiantPath = null;
    let cvPath = null;

    // Handle carte_etudiant file upload
    if (req.files && req.files.carte_etudiant) {
      const carteFile = req.files.carte_etudiant;
      const carteExt = path.extname(carteFile.name);
      const carteName = `carte_${prestataireId}_${Date.now()}${carteExt}`;
      const carteDest = path.join(uploadsDir, carteName);
      await carteFile.mv(carteDest);
      carteEtudiantPath = `/uploads/dossiers/${carteName}`;
    }

    // Handle cv file upload
    if (req.files && req.files.cv) {
      const cvFile = req.files.cv;
      const cvExt = path.extname(cvFile.name);
      const cvName = `cv_${prestataireId}_${Date.now()}${cvExt}`;
      const cvDest = path.join(uploadsDir, cvName);
      await cvFile.mv(cvDest);
      cvPath = `/uploads/dossiers/${cvName}`;
    }

    await Prestataire.deposerUnDossier(prestataireId, {
      carteEtudiant: carteEtudiantPath,
      cv: cvPath,
      domaine,
      niveauEtude: niveau_etude,
      universite
    });

    res.json({
      success: true,
      message: 'Dossier déposé avec succès',
      data: {
        carte_etudiant: carteEtudiantPath,
        cv: cvPath
      }
    });

  } catch (error) {
    console.error('Erreur depot dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du dépôt du dossier',
      error: error.message
    });
  }
};

/**
 * Obtenir mon dossier
 */
exports.obtenirDossier = async (req, res) => {
  try {
    const prestataireId = req.user.userId;
    const dossier = await Prestataire.obtenirDossierPrestataire(prestataireId);
    res.json({ success: true, data: dossier });

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
 * Signaler la réalisation d'une mission
 */
exports.realiserMission = async (req, res) => {
  try {
    const prestataireId = req.user.userId;
    const { id } = req.params;

    // Vérifier que la mission existe et est assignée à ce prestataire
    const mission = await Mission.trouverParId(id);
    if (!mission) {
      return res.status(404).json({ success: false, message: 'Mission non trouvée' });
    }
    if (mission.prestataire_selectionne_id !== prestataireId) {
      return res.status(403).json({ success: false, message: 'Vous n\'êtes pas assigné à cette mission' });
    }
    if (mission.statut !== 'en_cours') {
      return res.status(400).json({ success: false, message: 'Cette mission n\'est pas en cours' });
    }

    // Mettre à jour le statut de la mission vers terminee (en attente de validation client)
    await query('UPDATE missions SET statut = ? WHERE id = ?', ['terminee', id]);

    // Logger dans l'historique
    await query(
      'INSERT INTO historique (utilisateur_id, action, table_concernee, enregistrement_id, details) VALUES (?, ?, ?, ?, ?)',
      [prestataireId, 'realiser_mission', 'missions', id, JSON.stringify({ titre: mission.titre })]
    );

    // Notifier le client
    await creerNotification(
      mission.client_id,
      'mission',
      'Mission terminée',
      `Le prestataire a signalé la fin de la mission "${mission.titre}". Veuillez valider la réalisation.`,
      { mission_id: mission.id }
    );

    res.json({ success: true, message: 'Mission marquée comme réalisée' });
  } catch (error) {
    console.error('Erreur réalisation mission:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la réalisation', error: error.message });
  }
};
