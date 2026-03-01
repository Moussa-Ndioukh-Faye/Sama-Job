/**
 * Modèle Mission (MySQL/MariaDB)
 */

const { query } = require('../config/database');

class Mission {
  static async creer(missionData) {
    const {
      client_id, titre, description, domaine, budget, budget_negociable,
      lieu, ville, type_location, date_limite, date_debut, date_fin,
      duree, priorite, competences_requises, images
    } = missionData;

    const sql = `
      INSERT INTO missions
      (client_id, titre, description, domaine, budget, budget_negociable,
       lieu, ville, type_location, date_limite, date_debut, date_fin, duree, priorite, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ouverte')
    `;

    const result = await query(sql, [
      client_id, titre, description, domaine, budget, budget_negociable || false,
      lieu || null, ville || null, type_location || 'sur_place',
      date_limite || null, date_debut || null, date_fin || null, duree || null, priorite || 'normale'
    ]);

    const missionId = result.insertId;

    if (competences_requises && competences_requises.length > 0) {
      for (const competence of competences_requises) {
        await query(`INSERT INTO mission_competences (mission_id, competence) VALUES (?, ?)`, [missionId, competence]);
      }
    }

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await query(`INSERT INTO mission_images (mission_id, url, ordre) VALUES (?, ?, ?)`, [missionId, images[i], i]);
      }
    }

    return missionId;
  }

  static async trouverParId(id) {
    const missions = await query(`SELECT * FROM missions WHERE id = ?`, [id]);
    if (missions.length === 0) return null;

    const mission = missions[0];

    const competences = await query(`SELECT competence FROM mission_competences WHERE mission_id = ?`, [id]);
    mission.competences_requises = competences.map(c => c.competence);

    const images = await query(`SELECT url FROM mission_images WHERE mission_id = ? ORDER BY ordre`, [id]);
    mission.images = images.map(i => i.url);

    return mission;
  }

  static async listerToutes(filtres = {}) {
    const conditions = ['m.statut = ?'];
    const params = [filtres.statut || 'ouverte'];

    if (filtres.domaine) { conditions.push('m.domaine = ?'); params.push(filtres.domaine); }
    if (filtres.ville) { conditions.push('m.ville = ?'); params.push(filtres.ville); }
    if (filtres.budget_min) { conditions.push('m.budget >= ?'); params.push(filtres.budget_min); }
    if (filtres.budget_max) { conditions.push('m.budget <= ?'); params.push(filtres.budget_max); }
    if (filtres.type_location) { conditions.push('m.type_location = ?'); params.push(filtres.type_location); }

    let sql = `
      SELECT m.*,
             u.nom as client_nom, u.prenom as client_prenom, u.photo as client_photo,
             (SELECT COUNT(*) FROM candidatures c WHERE c.mission_id = m.id) as nombre_candidatures,
             (SELECT COUNT(*) FROM mission_images mi WHERE mi.mission_id = m.id) as nombre_images
      FROM missions m
      INNER JOIN utilisateurs u ON m.client_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY m.date_creation DESC
    `;

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

  static async listerParClient(clientId, statut = null) {
    let sql = `
      SELECT m.*,
             (SELECT COUNT(*) FROM candidatures c WHERE c.mission_id = m.id) as nombre_candidatures
      FROM missions m
      WHERE m.client_id = ?
    `;
    const params = [clientId];

    if (statut) { sql += ' AND m.statut = ?'; params.push(statut); }
    sql += ' ORDER BY m.date_creation DESC';

    return await query(sql, params);
  }

  static async mettreAJour(id, updates) {
    const {
      titre, description, domaine, budget, budget_negociable, lieu, ville,
      type_location, date_limite, date_debut, date_fin, duree, priorite, statut
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
      titre, description, domaine, budget, budget_negociable, lieu, ville,
      type_location, date_limite, date_debut, date_fin, duree, priorite, statut, id
    ]);

    return await this.trouverParId(id);
  }

  static async supprimer(id) {
    await query(`DELETE FROM mission_images WHERE mission_id = ?`, [id]);
    await query(`DELETE FROM mission_competences WHERE mission_id = ?`, [id]);
    await query(`DELETE FROM candidatures WHERE mission_id = ?`, [id]);
    await query(`DELETE FROM missions WHERE id = ?`, [id]);
    return true;
  }

  static async cloturer(id) {
    await query(
      `UPDATE missions SET statut = 'terminee', date_modification = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    return await this.trouverParId(id);
  }

  static async rechercher(terme) {
    const sql = `
      SELECT m.*,
             u.nom as client_nom, u.prenom as client_prenom,
             (SELECT COUNT(*) FROM candidatures c WHERE c.mission_id = m.id) as nombre_candidatures
      FROM missions m
      INNER JOIN utilisateurs u ON m.client_id = u.id
      WHERE m.statut = 'ouverte' AND (
        m.titre LIKE ? OR
        m.description LIKE ? OR
        m.domaine LIKE ? OR
        m.ville LIKE ?
      )
      ORDER BY m.date_creation DESC
      LIMIT 50
    `;
    const searchTerm = `%${terme}%`;
    return await query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
  }
}

module.exports = Mission;
