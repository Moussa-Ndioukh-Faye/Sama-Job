/**
 * Modèle Utilisateur
 * Gère les utilisateurs avec héritage (Client, Prestataire, Administrateur)
 * Basé sur le diagramme de cas d'utilisation
 */

const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class Utilisateur {
  /**
   * Créer un nouvel utilisateur
   */
  static async creer(userData) {
    const {
      nom,
      prenom,
      email,
      telephone,
      motDePasse,
      role,
      photo
    } = userData;

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    const sql = `
      INSERT INTO utilisateurs 
      (nom, prenom, email, telephone, mot_de_passe, role, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      nom,
      prenom,
      email || null,
      telephone || null,
      motDePasseHash,
      role,
      photo || null
    ]);

    return result.insertId;
  }

  /**
   * Se connecter
   */
  static async seConnecter(identifier, motDePasse) {
    // Identifier peut être email ou téléphone
    // JOIN prestataires pour inclure statut_validation dans la réponse
    const sql = `
      SELECT u.*, p.statut_validation, p.domaine, p.disponibilite,
             p.note_globale AS prestataire_note, p.nombre_missions_realisees
      FROM utilisateurs u
      LEFT JOIN prestataires p ON u.id = p.id AND u.role = 'prestataire'
      WHERE (u.email = ? OR u.telephone = ?) AND u.statut = 'actif'
    `;

    const users = await query(sql, [identifier, identifier]);

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Vérifier le mot de passe
    const match = await bcrypt.compare(motDePasse, user.mot_de_passe);

    if (!match) {
      return null;
    }

    // Ne pas retourner le mot de passe
    delete user.mot_de_passe;

    return user;
  }

  /**
   * Trouver par ID
   */
  static async trouverParId(id) {
    // JOIN prestataires pour inclure statut_validation dans la réponse
    const sql = `
      SELECT u.*, p.statut_validation, p.domaine, p.disponibilite,
             p.note_globale AS prestataire_note, p.nombre_missions_realisees
      FROM utilisateurs u
      LEFT JOIN prestataires p ON u.id = p.id AND u.role = 'prestataire'
      WHERE u.id = ?
    `;
    const users = await query(sql, [id]);

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    delete user.mot_de_passe;

    return user;
  }

  /**
   * Trouver par email
   */
  static async trouverParEmail(email) {
    const sql = 'SELECT * FROM utilisateurs WHERE email = ?';
    const users = await query(sql, [email]);

    if (users.length === 0) {
      return null;
    }

    return users[0];
  }

  /**
   * Gérer son profil (Cas d'utilisation: Utilisateur)
   */
  static async gererSonProfil(id, updates) {
    const {
      nom,
      prenom,
      email,
      telephone,
      photo
    } = updates;

    const sql = `
      UPDATE utilisateurs 
      SET nom = COALESCE(?, nom),
          prenom = COALESCE(?, prenom),
          email = COALESCE(?, email),
          telephone = COALESCE(?, telephone),
          photo = COALESCE(?, photo),
          date_modification = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [nom, prenom, email, telephone, photo, id]);

    return await this.trouverParId(id);
  }

  /**
   * Mettre à jour le token FCM
   */
  static async mettreAJourFCMToken(id, fcmToken) {
    const sql = `
      UPDATE utilisateurs 
      SET fcm_token = ?,
          date_modification = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [fcmToken, id]);
  }

  static async reactiverUtilisateur(id) {
    const sql = `UPDATE utilisateurs SET statut = 'actif' WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }
}

/**
 * Modèle Client
 * Hérite de Utilisateur
 */
class Client extends Utilisateur {
  /**
   * Créer un compte client
   */
  static async creerCompte(clientData) {
    const { entreprise, adresse, ville, ...userData } = clientData;

    // Créer l'utilisateur de base
    userData.role = 'client';
    const userId = await Utilisateur.creer(userData);

    // Créer l'entrée client
    const sql = `
      INSERT INTO clients (id, entreprise, adresse, ville)
      VALUES (?, ?, ?, ?)
    `;

    await query(sql, [userId, entreprise || null, adresse || null, ville || null]);

    return userId;
  }

  /**
   * Publier une mission (Cas d'utilisation: Entreprise/Particulier)
   */
  static async publierMission(clientId, missionData) {
    const {
      titre,
      description,
      domaine,
      competencesRequises,
      budget,
      budgetNegociable,
      lieu,
      ville,
      typeLocation,
      dateLimite,
      dateDebut,
      dateFin,
      duree,
      priorite,
      images
    } = missionData;

    // Créer la mission
    const sqlMission = `
      INSERT INTO missions 
      (client_id, titre, description, domaine, budget, budget_negociable, 
       lieu, ville, type_location, date_limite, date_debut, date_fin, duree, priorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sqlMission, [
      clientId,
      titre,
      description,
      domaine,
      budget,
      budgetNegociable || false,
      lieu,
      ville,
      typeLocation || 'sur_place',
      dateLimite || null,
      dateDebut || null,
      dateFin || null,
      duree || null,
      priorite || 'normale'
    ]);

    const missionId = result.insertId;

    // Ajouter les compétences requises
    if (competencesRequises && competencesRequises.length > 0) {
      const sqlCompetence = `
        INSERT INTO mission_competences (mission_id, competence)
        VALUES (?, ?)
      `;

      for (const competence of competencesRequises) {
        await query(sqlCompetence, [missionId, competence]);
      }
    }

    // Ajouter les images
    if (images && images.length > 0) {
      const sqlImage = `
        INSERT INTO mission_images (mission_id, url, ordre)
        VALUES (?, ?, ?)
      `;

      for (let i = 0; i < images.length; i++) {
        await query(sqlImage, [missionId, images[i], i]);
      }
    }

    // Incrémenter le compteur de missions du client
    const sqlUpdate = `
      UPDATE clients 
      SET nombre_missions = nombre_missions + 1 
      WHERE id = ?
    `;
    await query(sqlUpdate, [clientId]);

    return missionId;
  }

  /**
   * Consulter les candidatures (Cas d'utilisation: Entreprise/Particulier)
   */
  static async consulterLesCandidatures(clientId, missionId = null) {
    let sql = `
      SELECT c.*, 
             u.nom, u.prenom, u.photo,
             p.domaine, p.note_globale, p.nombre_missions_realisees,
             m.titre as mission_titre
      FROM candidatures c
      INNER JOIN utilisateurs u ON c.prestataire_id = u.id
      INNER JOIN prestataires p ON c.prestataire_id = p.id
      INNER JOIN missions m ON c.mission_id = m.id
      WHERE c.client_id = ?
    `;

    const params = [clientId];

    if (missionId) {
      sql += ' AND c.mission_id = ?';
      params.push(missionId);
    }

    sql += ' ORDER BY c.date_postulation DESC';

    return await query(sql, params);
  }

  /**
   * Sélectionner un prestataire (Cas d'utilisation: Entreprise/Particulier)
   */
  static async selectionnerUnPrestataire(clientId, candidatureId) {
    // Récupérer la candidature
    const sqlCandidature = `
      SELECT * FROM candidatures 
      WHERE id = ? AND client_id = ? AND statut = 'en_attente'
    `;

    const candidatures = await query(sqlCandidature, [candidatureId, clientId]);

    if (candidatures.length === 0) {
      throw new Error('Candidature non trouvée ou déjà traitée');
    }

    const candidature = candidatures[0];

    // Mettre à jour la candidature
    const sqlUpdate = `
      UPDATE candidatures 
      SET statut = 'acceptee', date_reponse = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await query(sqlUpdate, [candidatureId]);

    // Mettre à jour la mission
    const sqlMission = `
      UPDATE missions 
      SET prestataire_selectionne_id = ?,
          statut = 'en_cours'
      WHERE id = ?
    `;
    await query(sqlMission, [candidature.prestataire_id, candidature.mission_id]);

    // Refuser les autres candidatures
    const sqlRefuser = `
      UPDATE candidatures 
      SET statut = 'refusee', 
          date_reponse = CURRENT_TIMESTAMP,
          motif_refus = 'Un autre prestataire a été sélectionné'
      WHERE mission_id = ? AND id != ? AND statut = 'en_attente'
    `;
    await query(sqlRefuser, [candidature.mission_id, candidatureId]);

    return candidature;
  }

  /**
   * Valider la fin de mission (Cas d'utilisation: Entreprise/Particulier)
   */
  static async validerLaFinDeMission(clientId, missionId) {
    // Vérifier que la mission appartient au client
    const sqlCheck = `
      SELECT * FROM missions
      WHERE id = ? AND client_id = ? AND statut IN ('en_cours', 'terminee')
    `;

    const missions = await query(sqlCheck, [missionId, clientId]);

    if (missions.length === 0) {
      throw new Error('Mission non trouvée ou déjà terminée/annulée');
    }

    // Mettre à jour le statut
    const sql = `
      UPDATE missions 
      SET statut = 'terminee'
      WHERE id = ?
    `;

    await query(sql, [missionId]);

    return true;
  }

  /**
   * Noter et commenter le prestataire (Cas d'utilisation: Entreprise/Particulier)
   */
  static async noterEtCommenterLePrestataire(evaluationData) {
    const {
      missionId,
      clientId,
      prestataireId,
      note,
      commentaire,
      qualite,
      communication,
      ponctualite,
      professionnalisme
    } = evaluationData;

    const sql = `
      INSERT INTO evaluations 
      (mission_id, evaluateur_id, evalue_id, type_evaluateur, note, commentaire,
       qualite, communication, ponctualite, professionnalisme)
      VALUES (?, ?, ?, 'client', ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      missionId,
      clientId,
      prestataireId,
      note,
      commentaire,
      qualite || null,
      communication || null,
      ponctualite || null,
      professionnalisme || null
    ]);

    // Mettre à jour la note globale du prestataire
    await this.mettreAJourNoteGlobalePrestataire(prestataireId);

    return result.insertId;
  }

  /**
   * Mettre à jour la note globale d'un prestataire
   */
  static async mettreAJourNoteGlobalePrestataire(prestataireId) {
    const sql = `
      UPDATE prestataires 
      SET note_globale = (
        SELECT AVG(note) FROM evaluations WHERE evalue_id = ?
      ),
      nombre_evaluations = (
        SELECT COUNT(*) FROM evaluations WHERE evalue_id = ?
      )
      WHERE id = ?
    `;

    await query(sql, [prestataireId, prestataireId, prestataireId]);
  }

  static async obtenirCandidature(clientId, candidatureId) {
    const sql = `
      SELECT c.*, u.nom as prestataire_nom, u.prenom as prestataire_prenom
      FROM candidatures c
      INNER JOIN utilisateurs u ON c.prestataire_id = u.id
      WHERE c.id = ? AND c.client_id = ?
    `;
    const rows = await query(sql, [candidatureId, clientId]);
    if (rows.length === 0) throw new Error('Candidature non trouvée');
    return rows[0];
  }

  static async rejeterCandidature(clientId, candidatureId, motif) {
    const sqlCheck = `SELECT * FROM candidatures WHERE id = ? AND client_id = ? AND statut = 'en_attente'`;
    const cand = await query(sqlCheck, [candidatureId, clientId]);
    if (cand.length === 0) throw new Error('Candidature non trouvée ou déjà traitée');
    const sql = `UPDATE candidatures SET statut = 'refusee', motif_refus = ?, date_reponse = CURRENT_TIMESTAMP WHERE id = ?`;
    await query(sql, [motif || 'Refusé par le client', candidatureId]);
    return true;
  }
}

/**
 * Modèle Prestataire
 * Hérite de Utilisateur
 */
class Prestataire extends Utilisateur {
  /**
   * Créer un compte prestataire
   */
  static async creerCompte(prestataireData) {
    const {
      competences,
      domaine,
      niveauEtude,
      universite,
      ...userData
    } = prestataireData;

    // Créer l'utilisateur de base
    userData.role = 'prestataire';
    const userId = await Utilisateur.creer(userData);

    // Créer l'entrée prestataire
    const sql = `
      INSERT INTO prestataires (id, domaine, niveau_etude, universite)
      VALUES (?, ?, ?, ?)
    `;

    await query(sql, [
      userId,
      domaine || null,
      niveauEtude || null,
      universite || null
    ]);

    // Ajouter les compétences
    if (competences && competences.length > 0) {
      const sqlCompetence = `
        INSERT INTO prestataire_competences (prestataire_id, competence)
        VALUES (?, ?)
      `;

      for (const competence of competences) {
        await query(sqlCompetence, [userId, competence]);
      }
    }

    return userId;
  }

  /**
   * Consulter les missions (Cas d'utilisation: Étudiant/Prestataire)
   */
  static async consulterLesMissions(prestataireId, filtres = {}) {
    const {
      domaine,
      ville,
      budgetMin,
      budgetMax,
      typeLocation,
      page = 1,
      limit = 20
    } = filtres;

    let sql = `
      SELECT m.*, 
             u.nom as client_nom, u.prenom as client_prenom, u.photo as client_photo,
             c.note_globale as client_note,
             (SELECT GROUP_CONCAT(competence SEPARATOR ',') 
              FROM mission_competences 
              WHERE mission_id = m.id) as competences_requises
      FROM missions m
      INNER JOIN clients c ON m.client_id = c.id
      INNER JOIN utilisateurs u ON c.id = u.id
      WHERE m.statut = 'ouverte'
    `;

    const params = [];

    if (domaine) {
      sql += ' AND m.domaine = ?';
      params.push(domaine);
    }

    if (ville) {
      sql += ' AND m.ville = ?';
      params.push(ville);
    }

    if (budgetMin) {
      sql += ' AND m.budget >= ?';
      params.push(budgetMin);
    }

    if (budgetMax) {
      sql += ' AND m.budget <= ?';
      params.push(budgetMax);
    }

    if (typeLocation) {
      sql += ' AND m.type_location = ?';
      params.push(typeLocation);
    }

    sql += ' ORDER BY m.date_creation DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return await query(sql, params);
  }

  /**
   * Postuler à une mission (Cas d'utilisation: Étudiant/Prestataire)
   */
  static async postulerAUneMission(candidatureData) {
    const {
      missionId,
      prestataireId,
      clientId,
      message,
      propositionPrix,
      delaiPropose
    } = candidatureData;

    // Vérifier que le prestataire est validé
    const sqlCheck = `
      SELECT statut_validation FROM prestataires WHERE id = ?
    `;
    const prestataires = await query(sqlCheck, [prestataireId]);

    if (prestataires.length === 0 || prestataires[0].statut_validation !== 'valide') {
      throw new Error('Votre dossier doit être validé pour postuler');
    }

    // Créer la candidature
    const sql = `
      INSERT INTO candidatures 
      (mission_id, prestataire_id, client_id, message, proposition_prix, delai_propose)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      missionId,
      prestataireId,
      clientId,
      message,
      propositionPrix,
      delaiPropose || null
    ]);

    // Incrémenter le compteur de candidatures de la mission
    const sqlUpdate = `
      UPDATE missions 
      SET nombre_candidatures = nombre_candidatures + 1 
      WHERE id = ?
    `;
    await query(sqlUpdate, [missionId]);

    return result.insertId;
  }

  /**
   * Réaliser la mission (Cas d'utilisation: Étudiant/Prestataire)
   */
  static async realiserLaMission(prestataireId, missionId, details = {}) {
    // Enregistrer dans l'historique
    const sql = `
      INSERT INTO historique 
      (utilisateur_id, action, table_concernee, enregistrement_id, details)
      VALUES (?, 'realiser_mission', 'missions', ?, ?)
    `;

    await query(sql, [prestataireId, missionId, JSON.stringify(details)]);

    return true;
  }

  /**
   * Consulter son historique (Cas d'utilisation: Étudiant/Prestataire)
   */
  static async consulterSonHistorique(prestataireId) {
    const sql = `
      SELECT m.*, 
             u.nom as client_nom, u.prenom as client_prenom,
             c.proposition_prix,
             e.note as evaluation_note, e.commentaire as evaluation_commentaire
      FROM missions m
      INNER JOIN clients cl ON m.client_id = cl.id
      INNER JOIN utilisateurs u ON cl.id = u.id
      LEFT JOIN candidatures c ON m.id = c.mission_id AND c.prestataire_id = ?
      LEFT JOIN evaluations e ON m.id = e.mission_id AND e.evalue_id = ?
      WHERE m.prestataire_selectionne_id = ?
      ORDER BY m.date_creation DESC
    `;

    return await query(sql, [prestataireId, prestataireId, prestataireId]);
  }

  /**
   * Déposer un dossier (Cas d'utilisation: Étudiant/Prestataire)
   */
  static async deposerUnDossier(prestataireId, dossierData) {
    const { carteEtudiant, cv, domaine, niveauEtude, universite } = dossierData;

    const sql = `
      UPDATE prestataires
      SET carte_etudiant = ?,
          cv = ?,
          domaine = ?,
          niveau_etude = ?,
          universite = ?,
          statut_validation = 'en_attente'
      WHERE id = ?
    `;

    await query(sql, [carteEtudiant || null, cv || null, domaine || null, niveauEtude || null, universite || null, prestataireId]);

    return true;
  }

  /**
   * Lister mes candidatures
   */
  static async listerMesCandidatures(prestataireId) {
    const sql = `
      SELECT c.*,
             m.titre as mission_titre, m.description as mission_description,
             m.budget, m.statut as mission_statut,
             m.ville as mission_ville, m.date_fin,
             u.nom as client_nom, u.prenom as client_prenom,
             e.note as note_client, e.commentaire as commentaire_client
      FROM candidatures c
      INNER JOIN missions m ON c.mission_id = m.id
      INNER JOIN clients cl ON c.client_id = cl.id
      INNER JOIN utilisateurs u ON cl.id = u.id
      LEFT JOIN evaluations e ON m.id = e.mission_id AND e.evalue_id = ?
      WHERE c.prestataire_id = ?
      ORDER BY c.date_postulation DESC
    `;

    return await query(sql, [prestataireId, prestataireId]);
  }

  /**
   * Obtenir une candidature spécifique du prestataire
   */
  static async obtenirCandidaturePrestataire(prestataireId, candidatureId) {
    const sql = `
      SELECT c.*,
             m.titre as mission_titre, m.description as mission_description,
             m.budget, m.statut as mission_statut,
             u.nom as client_nom, u.prenom as client_prenom
      FROM candidatures c
      INNER JOIN missions m ON c.mission_id = m.id
      INNER JOIN clients cl ON c.client_id = cl.id
      INNER JOIN utilisateurs u ON cl.id = u.id
      WHERE c.id = ? AND c.prestataire_id = ?
    `;

    const candidatures = await query(sql, [candidatureId, prestataireId]);

    if (candidatures.length === 0) {
      throw new Error('Candidature non trouvée');
    }

    return candidatures[0];
  }

  /**
   * Annuler une candidature
   */
  static async annulerCandidature(prestataireId, candidatureId) {
    // Vérifier que la candidature appartient au prestataire et est en attente
    const sqlCheck = `
      SELECT * FROM candidatures
      WHERE id = ? AND prestataire_id = ? AND statut = 'en_attente'
    `;

    const candidatures = await query(sqlCheck, [candidatureId, prestataireId]);

    if (candidatures.length === 0) {
      throw new Error('Candidature non trouvée ou déjà traitée');
    }

    // Supprimer la candidature
    const sql = `DELETE FROM candidatures WHERE id = ?`;
    await query(sql, [candidatureId]);

    return true;
  }

  /**
   * Obtenir le dossier du prestataire
   */
  static async obtenirDossierPrestataire(prestataireId) {
    const sql = `
      SELECT p.carte_etudiant, p.cv, p.statut_validation, p.motif_rejet, p.date_validation,
             p.domaine, p.niveau_etude, p.universite
      FROM prestataires p
      WHERE p.id = ?
    `;

    const dossiers = await query(sql, [prestataireId]);

    if (dossiers.length === 0) {
      throw new Error('Dossier non trouvé');
    }

    return dossiers[0];
  }
}

/**
 * Modèle Administrateur
 * Hérite de Utilisateur
 */
class Administrateur extends Utilisateur {
  /**
   * Créer un compte admin
   */
  static async creerCompte(adminData) {
    const { permissions, ...userData } = adminData;

    // Créer l'utilisateur de base
    userData.role = 'admin';
    const userId = await Utilisateur.creer(userData);

    // Créer l'entrée admin
    const sql = `
      INSERT INTO administrateurs (id, permissions)
      VALUES (?, ?)
    `;

    await query(sql, [
      userId,
      JSON.stringify(permissions || ['all'])
    ]);

    return userId;
  }

  /**
   * Vérifier le dossier (Cas d'utilisation: Administrateur)
   */
  static async verifierLeDossier(adminId) {
    const sql = `
      SELECT p.*, 
             u.nom, u.prenom, u.email, u.telephone, u.photo, u.date_creation
      FROM prestataires p
      INNER JOIN utilisateurs u ON p.id = u.id
      WHERE p.statut_validation = 'en_attente'
      ORDER BY u.date_creation ASC
    `;

    return await query(sql);
  }

  /**
   * Valider le dossier (Cas d'utilisation: Administrateur - extend)
   */
  static async validerLeDossier(adminId, prestataireId) {
    const sql = `
      UPDATE prestataires 
      SET statut_validation = 'valide',
          date_validation = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [prestataireId]);

    // Incrémenter le compteur de validations de l'admin
    const sqlAdmin = `
      UPDATE administrateurs 
      SET nombre_validations = nombre_validations + 1 
      WHERE id = ?
    `;
    await query(sqlAdmin, [adminId]);

    return true;
  }

  /**
   * Rejeter le dossier (Cas d'utilisation: Administrateur - extend)
   */
  static async rejeterLeDossier(adminId, prestataireId, motifRejet) {
    const sql = `
      UPDATE prestataires 
      SET statut_validation = 'rejete',
          motif_rejet = ?
      WHERE id = ?
    `;

    await query(sql, [motifRejet, prestataireId]);

    return true;
  }

  /**
   * Modérer les contenus (Cas d'utilisation: Administrateur)
   */
  static async modererLesContenus(adminId, type, id, action) {
    // type: 'mission', 'message', 'evaluation'
    // action: 'supprimer', 'suspendre', 'valider'

    const sql = `
      INSERT INTO historique 
      (utilisateur_id, action, table_concernee, enregistrement_id, details)
      VALUES (?, 'moderation', ?, ?, ?)
    `;

    await query(sql, [
      adminId,
      type,
      id,
      JSON.stringify({ action })
    ]);

    // Incrémenter le compteur de modérations
    const sqlAdmin = `
      UPDATE administrateurs 
      SET nombre_moderations = nombre_moderations + 1 
      WHERE id = ?
    `;
    await query(sqlAdmin, [adminId]);

    return true;
  }

  /**
   * Suspendre un compte (Cas d'utilisation: Administrateur)
   */
  static async suspendreUnCompte(adminId, utilisateurId, raison) {
    const sql = `
      UPDATE utilisateurs 
      SET statut = 'suspendu'
      WHERE id = ?
    `;

    await query(sql, [utilisateurId]);

    // Enregistrer dans l'historique
    const sqlHisto = `
      INSERT INTO historique 
      (utilisateur_id, action, table_concernee, enregistrement_id, details)
      VALUES (?, 'suspendre_compte', 'utilisateurs', ?, ?)
    `;

    await query(sqlHisto, [adminId, utilisateurId, JSON.stringify({ raison })]);

    return true;
  }

  /**
   * Consulter les statistiques (Cas d'utilisation: Administrateur)
   */
  static async consulterLesStatistiques() {
    const stats = {};

    // Nombre total d'utilisateurs par rôle
    const sqlUsers = `
      SELECT role, COUNT(*) as total 
      FROM utilisateurs 
      WHERE statut = 'actif'
      GROUP BY role
    `;
    stats.utilisateurs = await query(sqlUsers);

    // Missions par statut
    const sqlMissions = `
      SELECT statut, COUNT(*) as total 
      FROM missions 
      GROUP BY statut
    `;
    stats.missions = await query(sqlMissions);

    // Candidatures par statut
    const sqlCandidatures = `
      SELECT statut, COUNT(*) as total 
      FROM candidatures 
      GROUP BY statut
    `;
    stats.candidatures = await query(sqlCandidatures);

    // Prestataires par statut de validation
    const sqlPrestataires = `
      SELECT statut_validation, COUNT(*) as total 
      FROM prestataires 
      GROUP BY statut_validation
    `;
    stats.prestataires = await query(sqlPrestataires);

    // Total revenus générés
    const sqlRevenus = `
      SELECT SUM(revenu_total) as total_revenus 
      FROM prestataires
    `;
    stats.revenus = await query(sqlRevenus);

    return stats;
  }

  /**
   * Gérer les utilisateurs (Cas d'utilisation: Administrateur)
   */
  static async gererLesUtilisateurs(filtres = {}) {
    const { role, statut, page = 1, limit = 20 } = filtres;

    let sql = `
      SELECT * FROM utilisateurs 
      WHERE 1=1
    `;

    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (statut) {
      sql += ' AND statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY date_creation DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return await query(sql, params);
  }

  /**
   * Gérer les missions (Cas d'utilisation: Administrateur)
   */
  static async gererLesMissions(filtres = {}) {
    const { statut, page = 1, limit = 20 } = filtres;

    let sql = `
      SELECT m.*, 
             u.nom as client_nom, u.prenom as client_prenom
      FROM missions m
      INNER JOIN clients c ON m.client_id = c.id
      INNER JOIN utilisateurs u ON c.id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (statut) {
      sql += ' AND m.statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY m.date_creation DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return await query(sql, params);
  }

  static async obtenirLeDossier(adminId, prestataireId) {
    const sql = `
      SELECT p.*, u.nom, u.prenom, u.email, u.telephone, u.photo, u.date_creation
      FROM prestataires p
      INNER JOIN utilisateurs u ON p.id = u.id
      WHERE p.id = ?
    `;
    const rows = await query(sql, [prestataireId]);
    return rows.length ? rows[0] : null;
  }
}

module.exports = {
  Utilisateur,
  Client,
  Prestataire,
  Administrateur
};