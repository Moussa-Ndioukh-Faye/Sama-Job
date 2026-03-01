/**
 * Modèle Utilisateur (MySQL/MariaDB)
 * Gère les utilisateurs avec héritage (Client, Prestataire, Administrateur)
 */

const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class Utilisateur {
  static async creer(userData) {
    const { nom, prenom, email, telephone, motDePasse, role, photo } = userData;
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    const sql = `
      INSERT INTO utilisateurs
      (nom, prenom, email, telephone, mot_de_passe, role, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      nom, prenom, email || null, telephone || null,
      motDePasseHash, role, photo || null
    ]);

    return result.insertId;
  }

  static async seConnecter(identifier, motDePasse) {
    const sql = `
      SELECT u.*, p.statut_validation, p.domaine, p.disponibilite,
             p.note_globale AS prestataire_note, p.nombre_missions_realisees
      FROM utilisateurs u
      LEFT JOIN prestataires p ON u.id = p.id AND u.role = 'prestataire'
      WHERE (u.email = ? OR u.telephone = ?) AND u.statut = 'actif'
    `;

    const users = await query(sql, [identifier, identifier]);
    if (users.length === 0) return null;

    const user = users[0];
    const match = await bcrypt.compare(motDePasse, user.mot_de_passe);
    if (!match) return null;

    delete user.mot_de_passe;
    return user;
  }

  static async trouverParId(id) {
    const sql = `
      SELECT u.*, p.statut_validation, p.domaine, p.disponibilite,
             p.note_globale AS prestataire_note, p.nombre_missions_realisees
      FROM utilisateurs u
      LEFT JOIN prestataires p ON u.id = p.id AND u.role = 'prestataire'
      WHERE u.id = ?
    `;
    const users = await query(sql, [id]);
    if (users.length === 0) return null;
    const user = users[0];
    delete user.mot_de_passe;
    return user;
  }

  static async trouverParEmail(email) {
    const users = await query('SELECT * FROM utilisateurs WHERE email = ?', [email]);
    return users.length === 0 ? null : users[0];
  }

  static async gererSonProfil(id, updates) {
    const { nom, prenom, email, telephone, photo } = updates;

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

  static async mettreAJourFCMToken(id, fcmToken) {
    await query(
      `UPDATE utilisateurs SET fcm_token = ?, date_modification = CURRENT_TIMESTAMP WHERE id = ?`,
      [fcmToken, id]
    );
  }

  static async reactiverUtilisateur(id) {
    await query(`UPDATE utilisateurs SET statut = 'actif' WHERE id = ?`, [id]);
    return true;
  }
}

class Client extends Utilisateur {
  static async creerCompte(clientData) {
    const { entreprise, adresse, ville, ...userData } = clientData;
    userData.role = 'client';
    const userId = await Utilisateur.creer(userData);

    await query(
      `INSERT INTO clients (id, entreprise, adresse, ville) VALUES (?, ?, ?, ?)`,
      [userId, entreprise || null, adresse || null, ville || null]
    );

    return userId;
  }

  static async publierMission(clientId, missionData) {
    const {
      titre, description, domaine, competencesRequises, budget, budgetNegociable,
      lieu, ville, typeLocation, dateLimite, dateDebut, dateFin, duree, priorite, images
    } = missionData;

    const sqlMission = `
      INSERT INTO missions
      (client_id, titre, description, domaine, budget, budget_negociable,
       lieu, ville, type_location, date_limite, date_debut, date_fin, duree, priorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const missionResult = await query(sqlMission, [
      clientId, titre, description, domaine, budget, budgetNegociable || false,
      lieu, ville, typeLocation || 'sur_place',
      dateLimite || null, dateDebut || null, dateFin || null, duree || null, priorite || 'normale'
    ]);

    const missionId = missionResult.insertId;

    if (competencesRequises && competencesRequises.length > 0) {
      for (const competence of competencesRequises) {
        await query(`INSERT INTO mission_competences (mission_id, competence) VALUES (?, ?)`, [missionId, competence]);
      }
    }

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await query(`INSERT INTO mission_images (mission_id, url, ordre) VALUES (?, ?, ?)`, [missionId, images[i], i]);
      }
    }

    await query(`UPDATE clients SET nombre_missions = nombre_missions + 1 WHERE id = ?`, [clientId]);

    return missionId;
  }

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

  static async selectionnerUnPrestataire(clientId, candidatureId) {
    const candidatures = await query(
      `SELECT * FROM candidatures WHERE id = ? AND client_id = ? AND statut = 'en_attente'`,
      [candidatureId, clientId]
    );

    if (candidatures.length === 0) throw new Error('Candidature non trouvée ou déjà traitée');
    const candidature = candidatures[0];

    await query(
      `UPDATE candidatures SET statut = 'acceptee', date_reponse = CURRENT_TIMESTAMP WHERE id = ?`,
      [candidatureId]
    );

    await query(
      `UPDATE missions SET prestataire_selectionne_id = ?, statut = 'en_cours' WHERE id = ?`,
      [candidature.prestataire_id, candidature.mission_id]
    );

    await query(
      `UPDATE candidatures SET statut = 'refusee', date_reponse = CURRENT_TIMESTAMP,
       motif_refus = 'Un autre prestataire a été sélectionné'
       WHERE mission_id = ? AND id != ? AND statut = 'en_attente'`,
      [candidature.mission_id, candidatureId]
    );

    return candidature;
  }

  static async validerLaFinDeMission(clientId, missionId) {
    const missions = await query(
      `SELECT * FROM missions WHERE id = ? AND client_id = ? AND statut IN ('en_cours', 'terminee')`,
      [missionId, clientId]
    );

    if (missions.length === 0) throw new Error('Mission non trouvée ou déjà terminée/annulée');

    await query(`UPDATE missions SET statut = 'terminee' WHERE id = ?`, [missionId]);
    return true;
  }

  static async noterEtCommenterLePrestataire(evaluationData) {
    const {
      missionId, clientId, prestataireId, note, commentaire,
      qualite, communication, ponctualite, professionnalisme
    } = evaluationData;

    const sql = `
      INSERT INTO evaluations
      (mission_id, evaluateur_id, evalue_id, type_evaluateur, note, commentaire,
       qualite, communication, ponctualite, professionnalisme)
      VALUES (?, ?, ?, 'client', ?, ?, ?, ?, ?, ?)
    `;

    const evalResult = await query(sql, [
      missionId, clientId, prestataireId, note, commentaire,
      qualite || null, communication || null, ponctualite || null, professionnalisme || null
    ]);

    await this.mettreAJourNoteGlobalePrestataire(prestataireId);
    return evalResult.insertId;
  }

  static async mettreAJourNoteGlobalePrestataire(prestataireId) {
    await query(
      `UPDATE prestataires
       SET note_globale = (SELECT AVG(note) FROM evaluations WHERE evalue_id = ?),
           nombre_evaluations = (SELECT COUNT(*) FROM evaluations WHERE evalue_id = ?)
       WHERE id = ?`,
      [prestataireId, prestataireId, prestataireId]
    );
  }

  static async obtenirCandidature(clientId, candidatureId) {
    const rows = await query(
      `SELECT c.*, u.nom as prestataire_nom, u.prenom as prestataire_prenom
       FROM candidatures c
       INNER JOIN utilisateurs u ON c.prestataire_id = u.id
       WHERE c.id = ? AND c.client_id = ?`,
      [candidatureId, clientId]
    );
    if (rows.length === 0) throw new Error('Candidature non trouvée');
    return rows[0];
  }

  static async rejeterCandidature(clientId, candidatureId, motif) {
    const cand = await query(
      `SELECT * FROM candidatures WHERE id = ? AND client_id = ? AND statut = 'en_attente'`,
      [candidatureId, clientId]
    );
    if (cand.length === 0) throw new Error('Candidature non trouvée ou déjà traitée');
    await query(
      `UPDATE candidatures SET statut = 'refusee', motif_refus = ?, date_reponse = CURRENT_TIMESTAMP WHERE id = ?`,
      [motif || 'Refusé par le client', candidatureId]
    );
    return true;
  }
}

class Prestataire extends Utilisateur {
  static async creerCompte(prestataireData) {
    const { competences, domaine, niveauEtude, universite, ...userData } = prestataireData;
    userData.role = 'prestataire';
    const userId = await Utilisateur.creer(userData);

    await query(
      `INSERT INTO prestataires (id, domaine, niveau_etude, universite) VALUES (?, ?, ?, ?)`,
      [userId, domaine || null, niveauEtude || null, universite || null]
    );

    if (competences && competences.length > 0) {
      for (const competence of competences) {
        await query(
          `INSERT INTO prestataire_competences (prestataire_id, competence) VALUES (?, ?)`,
          [userId, competence]
        );
      }
    }

    return userId;
  }

  static async consulterLesMissions(prestataireId, filtres = {}) {
    const { domaine, ville, budgetMin, budgetMax, typeLocation, page = 1, limit = 20 } = filtres;

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

    if (domaine) { sql += ' AND m.domaine = ?'; params.push(domaine); }
    if (ville) { sql += ' AND m.ville = ?'; params.push(ville); }
    if (budgetMin) { sql += ' AND m.budget >= ?'; params.push(budgetMin); }
    if (budgetMax) { sql += ' AND m.budget <= ?'; params.push(budgetMax); }
    if (typeLocation) { sql += ' AND m.type_location = ?'; params.push(typeLocation); }

    sql += ' ORDER BY m.date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return await query(sql, params);
  }

  static async postulerAUneMission(candidatureData) {
    const { missionId, prestataireId, clientId, message, propositionPrix, delaiPropose } = candidatureData;

    const prestataires = await query(
      `SELECT statut_validation FROM prestataires WHERE id = ?`,
      [prestataireId]
    );

    if (prestataires.length === 0 || prestataires[0].statut_validation !== 'valide') {
      throw new Error('Votre dossier doit être validé pour postuler');
    }

    const sql = `
      INSERT INTO candidatures
      (mission_id, prestataire_id, client_id, message, proposition_prix, delai_propose)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const candResult = await query(sql, [
      missionId, prestataireId, clientId, message, propositionPrix, delaiPropose || null
    ]);

    await query(
      `UPDATE missions SET nombre_candidatures = nombre_candidatures + 1 WHERE id = ?`,
      [missionId]
    );

    return candResult.insertId;
  }

  static async realiserLaMission(prestataireId, missionId, details = {}) {
    await query(
      `INSERT INTO historique (utilisateur_id, action, table_concernee, enregistrement_id, details)
       VALUES (?, 'realiser_mission', 'missions', ?, ?)`,
      [prestataireId, missionId, JSON.stringify(details)]
    );
    return true;
  }

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

  static async deposerUnDossier(prestataireId, dossierData) {
    const { carteEtudiant, cv, domaine, niveauEtude, universite } = dossierData;

    await query(
      `UPDATE prestataires
       SET carte_etudiant = ?, cv = ?, domaine = ?, niveau_etude = ?, universite = ?,
           statut_validation = 'en_attente'
       WHERE id = ?`,
      [carteEtudiant || null, cv || null, domaine || null, niveauEtude || null, universite || null, prestataireId]
    );

    return true;
  }

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
    if (candidatures.length === 0) throw new Error('Candidature non trouvée');
    return candidatures[0];
  }

  static async annulerCandidature(prestataireId, candidatureId) {
    const candidatures = await query(
      `SELECT * FROM candidatures WHERE id = ? AND prestataire_id = ? AND statut = 'en_attente'`,
      [candidatureId, prestataireId]
    );
    if (candidatures.length === 0) throw new Error('Candidature non trouvée ou déjà traitée');
    await query(`DELETE FROM candidatures WHERE id = ?`, [candidatureId]);
    return true;
  }

  static async obtenirDossierPrestataire(prestataireId) {
    const dossiers = await query(
      `SELECT p.carte_etudiant, p.cv, p.statut_validation, p.motif_rejet, p.date_validation,
              p.domaine, p.niveau_etude, p.universite
       FROM prestataires p WHERE p.id = ?`,
      [prestataireId]
    );
    if (dossiers.length === 0) throw new Error('Dossier non trouvé');
    return dossiers[0];
  }
}

class Administrateur extends Utilisateur {
  static async creerCompte(adminData) {
    const { permissions, ...userData } = adminData;
    userData.role = 'admin';
    const userId = await Utilisateur.creer(userData);

    await query(
      `INSERT INTO administrateurs (id, permissions) VALUES (?, ?)`,
      [userId, JSON.stringify(permissions || ['all'])]
    );

    return userId;
  }

  static async verifierLeDossier(adminId) {
    return await query(
      `SELECT p.*, u.nom, u.prenom, u.email, u.telephone, u.photo, u.date_creation
       FROM prestataires p
       INNER JOIN utilisateurs u ON p.id = u.id
       WHERE p.statut_validation = 'en_attente'
       ORDER BY u.date_creation ASC`
    );
  }

  static async validerLeDossier(adminId, prestataireId) {
    await query(
      `UPDATE prestataires SET statut_validation = 'valide', date_validation = CURRENT_TIMESTAMP WHERE id = ?`,
      [prestataireId]
    );
    await query(
      `UPDATE administrateurs SET nombre_validations = nombre_validations + 1 WHERE id = ?`,
      [adminId]
    );
    return true;
  }

  static async rejeterLeDossier(adminId, prestataireId, motifRejet) {
    await query(
      `UPDATE prestataires SET statut_validation = 'rejete', motif_rejet = ? WHERE id = ?`,
      [motifRejet, prestataireId]
    );
    return true;
  }

  static async modererLesContenus(adminId, type, id, action) {
    await query(
      `INSERT INTO historique (utilisateur_id, action, table_concernee, enregistrement_id, details)
       VALUES (?, 'moderation', ?, ?, ?)`,
      [adminId, type, id, JSON.stringify({ action })]
    );
    await query(
      `UPDATE administrateurs SET nombre_moderations = nombre_moderations + 1 WHERE id = ?`,
      [adminId]
    );
    return true;
  }

  static async suspendreUnCompte(adminId, utilisateurId, raison) {
    await query(`UPDATE utilisateurs SET statut = 'suspendu' WHERE id = ?`, [utilisateurId]);
    await query(
      `INSERT INTO historique (utilisateur_id, action, table_concernee, enregistrement_id, details)
       VALUES (?, 'suspendre_compte', 'utilisateurs', ?, ?)`,
      [adminId, utilisateurId, JSON.stringify({ raison })]
    );
    return true;
  }

  static async consulterLesStatistiques() {
    const stats = {};
    stats.utilisateurs = await query(
      `SELECT role, COUNT(*) as total FROM utilisateurs WHERE statut = 'actif' GROUP BY role`
    );
    stats.missions = await query(
      `SELECT statut, COUNT(*) as total FROM missions GROUP BY statut`
    );
    stats.candidatures = await query(
      `SELECT statut, COUNT(*) as total FROM candidatures GROUP BY statut`
    );
    stats.prestataires = await query(
      `SELECT statut_validation, COUNT(*) as total FROM prestataires GROUP BY statut_validation`
    );
    stats.revenus = await query(
      `SELECT SUM(revenu_total) as total_revenus FROM prestataires`
    );
    return stats;
  }

  static async gererLesUtilisateurs(filtres = {}) {
    const { role, statut, page = 1, limit = 20 } = filtres;
    let sql = `SELECT * FROM utilisateurs WHERE 1=1`;
    const params = [];

    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (statut) { sql += ' AND statut = ?'; params.push(statut); }

    sql += ' ORDER BY date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return await query(sql, params);
  }

  static async gererLesMissions(filtres = {}) {
    const { statut, page = 1, limit = 20 } = filtres;
    let sql = `
      SELECT m.*, u.nom as client_nom, u.prenom as client_prenom
      FROM missions m
      INNER JOIN clients c ON m.client_id = c.id
      INNER JOIN utilisateurs u ON c.id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (statut) { sql += ' AND m.statut = ?'; params.push(statut); }

    sql += ' ORDER BY m.date_creation DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return await query(sql, params);
  }

  static async obtenirLeDossier(adminId, prestataireId) {
    const rows = await query(
      `SELECT p.*, u.nom, u.prenom, u.email, u.telephone, u.photo, u.date_creation
       FROM prestataires p
       INNER JOIN utilisateurs u ON p.id = u.id
       WHERE p.id = ?`,
      [prestataireId]
    );
    return rows.length ? rows[0] : null;
  }
}

module.exports = { Utilisateur, Client, Prestataire, Administrateur };
