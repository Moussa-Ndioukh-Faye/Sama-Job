/**
 * Modèle Mission
 * Gère les missions publiées par les clients
 * Basé sur le diagramme de cas d'utilisation
 */

const { query } = require('../config/database');

class Mission {
  /**
   * Créer une nouvelle mission
   */
  static async creer(missionData) {
    const {
      client_id,
      titre,
      description,
      domaine,
      budget,
      budget_negociable,
      lieu,
      ville,
      type_location,
      date_limite,
      date_debut,
      date_fin,
      duree,
      priorite,
      competences_requises,
      images
    } = missionData;

    const sql = `
      INSERT INTO missions 
      (client_id, titre, description, domaine, budget, budget_negociable, 
       lieu, ville, type_location, date_limite, date_debut, date_fin, duree, priorite, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ouverte')
    `;

    const result = await query(sql, [
      client_id,
      titre,
      description,
      domaine,
      budget,
      budget_negociable || false,
      lieu || null,
      ville || null,
      type_location || 'sur_place',
      date_limite || null,
      date_debut || null,
      date_fin || null,
      duree || null,
      priorite || 'normale'
    ]);

    const missionId = result.insertId;

    // Ajouter les compétences requises
    if (competences_requises && competences_requises.length > 0) {
      const sqlCompetence = `
        INSERT INTO mission_competences (mission_id, competence)
        VALUES (?, ?)
      `;

      for (const competence of competences_requises) {
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

    return missionId;
  }

  /**
   * Trouver une mission par ID
   */
  static async trouverParId(id) {
    const sql = `
      SELECT * FROM missions WHERE id = ?
    `;

    const missions = await query(sql, [id]);

    if (missions.length === 0) {
      return null;
    }

    const mission = missions[0];

    // Récupérer les compétences
    const sqlCompetences = `
      SELECT competence FROM mission_competences WHERE mission_id = ?
    `;
    const competences = await query(sqlCompetences, [id]);
    mission.competences_requises = competences.map(c => c.competence);

    // Récupérer les images
    const sqlImages = `
      SELECT url FROM mission_images WHERE mission_id = ? ORDER BY ordre
    `;
    const images = await query(sqlImages, [id]);
    mission.images = images.map(i => i.url);

    return mission;
  }

  /**
   * Consulter toutes les missions
   */
  static async listerToutes(filtres = {}) {
    let sql = `
      SELECT m.*, 
             u.nom as client_nom,
             u.prenom as client_prenom,
             u.photo as client_photo,
             COUNT(DISTINCT c.id) as nombre_candidatures,
             COUNT(DISTINCT mi.id) as nombre_images
      FROM missions m
      INNER JOIN utilisateurs u ON m.client_id = u.id
      LEFT JOIN candidatures c ON m.id = c.mission_id
      LEFT JOIN mission_images mi ON m.id = mi.mission_id
    `;

    const params = [];
    const conditions = ['m.statut = ?'];
    params.push(filtres.statut || 'ouverte');

    // Filtrer par domaine
    if (filtres.domaine) {
      conditions.push('m.domaine = ?');
      params.push(filtres.domaine);
    }

    // Filtrer par ville
    if (filtres.ville) {
      conditions.push('m.ville = ?');
      params.push(filtres.ville);
    }

    // Filtrer par budget min/max
    if (filtres.budget_min) {
      conditions.push('m.budget >= ?');
      params.push(filtres.budget_min);
    }

    if (filtres.budget_max) {
      conditions.push('m.budget <= ?');
      params.push(filtres.budget_max);
    }

    // Filtrer par type location
    if (filtres.type_location) {
      conditions.push('m.type_location = ?');
      params.push(filtres.type_location);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY m.id ORDER BY m.date_creation DESC';

    // Pagination
    if (filtres.limit) {
      sql += ' LIMIT ?';
      params.push(filtres.limit);

      if (filtres.offset) {
        sql += ' OFFSET ?';
        params.push(filtres.offset);
      }
    }

    return await query(sql, params);
  }

  /**
   * Lister les missions d'un client
   */
  static async listerParClient(clientId, statut = null) {
    let sql = `
      SELECT m.*, 
             COUNT(DISTINCT c.id) as nombre_candidatures
      FROM missions m
      LEFT JOIN candidatures c ON m.id = c.mission_id
      WHERE m.client_id = ?
    `;

    const params = [clientId];

    if (statut) {
      sql += ' AND m.statut = ?';
      params.push(statut);
    }

    sql += ' GROUP BY m.id ORDER BY m.date_creation DESC';

    return await query(sql, params);
  }

  /**
   * Mettre à jour une mission
   */
  static async mettreAJour(id, updates) {
    const {
      titre,
      description,
      domaine,
      budget,
      budget_negociable,
      lieu,
      ville,
      type_location,
      date_limite,
      date_debut,
      date_fin,
      duree,
      priorite,
      statut
    } = updates;

    const sql = `
      UPDATE missions 
      SET titre = COALESCE(?, titre),
          description = COALESCE(?, description),
          domaine = COALESCE(?, domaine),
          budget = COALESCE(?, budget),
          budget_negociable = COALESCE(?, budget_negociable),
          lieu = COALESCE(?, lieu),
          ville = COALESCE(?, ville),
          type_location = COALESCE(?, type_location),
          date_limite = COALESCE(?, date_limite),
          date_debut = COALESCE(?, date_debut),
          date_fin = COALESCE(?, date_fin),
          duree = COALESCE(?, duree),
          priorite = COALESCE(?, priorite),
          statut = COALESCE(?, statut),
          date_modification = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [
      titre,
      description,
      domaine,
      budget,
      budget_negociable,
      lieu,
      ville,
      type_location,
      date_limite,
      date_debut,
      date_fin,
      duree,
      priorite,
      statut,
      id
    ]);

    return await this.trouverParId(id);
  }

  /**
   * Supprimer une mission
   */
  static async supprimer(id) {
    // Supprimer les images
    let sql = 'DELETE FROM mission_images WHERE mission_id = ?';
    await query(sql, [id]);

    // Supprimer les compétences
    sql = 'DELETE FROM mission_competences WHERE mission_id = ?';
    await query(sql, [id]);

    // Supprimer les candidatures
    sql = 'DELETE FROM candidatures WHERE mission_id = ?';
    await query(sql, [id]);

    // Supprimer la mission
    sql = 'DELETE FROM missions WHERE id = ?';
    await query(sql, [id]);

    return true;
  }

  /**
   * Clôturer une mission
   */
  static async cloturer(id) {
    const sql = `
      UPDATE missions 
      SET statut = 'terminee', date_modification = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(sql, [id]);

    return await this.trouverParId(id);
  }

  /**
   * Rechercher des missions
   */
  static async rechercher(terme) {
    const sql = `
      SELECT m.*, 
             u.nom as client_nom,
             u.prenom as client_prenom,
             COUNT(DISTINCT c.id) as nombre_candidatures
      FROM missions m
      INNER JOIN utilisateurs u ON m.client_id = u.id
      LEFT JOIN candidatures c ON m.id = c.mission_id
      WHERE m.statut = 'ouverte' AND (
        m.titre LIKE ? OR 
        m.description LIKE ? OR 
        m.domaine LIKE ? OR
        m.ville LIKE ?
      )
      GROUP BY m.id
      ORDER BY m.date_creation DESC
      LIMIT 50
    `;

    const searchTerm = `%${terme}%`;
    return await query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
  }
}

module.exports = Mission;
