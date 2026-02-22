/**
 * Script de Migration de la Base de Données
 * Crée toutes les tables nécessaires pour SamaJob
 * Basé sur le diagramme de cas d'utilisation
 */

const { pool } = require('../config/database');

const migrations = [
  // Table Utilisateurs (parent avec héritage)
  `CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(20) UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('client', 'prestataire', 'admin') NOT NULL DEFAULT 'client',
    photo VARCHAR(255),
    statut ENUM('actif', 'suspendu', 'supprime') NOT NULL DEFAULT 'actif',
    fcm_token TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_telephone (telephone),
    INDEX idx_role (role),
    INDEX idx_statut (statut)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Clients (extension de Utilisateurs)
  `CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY,
    entreprise VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    nombre_missions INT DEFAULT 0,
    note_globale DECIMAL(2,1) DEFAULT 0.0,
    nombre_evaluations INT DEFAULT 0,
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_ville (ville)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Prestataires (extension de Utilisateurs)
  `CREATE TABLE IF NOT EXISTS prestataires (
    id INT PRIMARY KEY,
    domaine VARCHAR(100),
    niveau_etude VARCHAR(100),
    universite VARCHAR(255),
    carte_etudiant VARCHAR(255),
    cv VARCHAR(255),
    statut_validation ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
    motif_rejet TEXT,
    nombre_missions_realisees INT DEFAULT 0,
    note_globale DECIMAL(2,1) DEFAULT 0.0,
    nombre_evaluations INT DEFAULT 0,
    revenu_total DECIMAL(12,2) DEFAULT 0.00,
    disponibilite BOOLEAN DEFAULT TRUE,
    date_validation TIMESTAMP NULL,
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_domaine (domaine),
    INDEX idx_statut_validation (statut_validation),
    INDEX idx_disponibilite (disponibilite)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Compétences des Prestataires
  `CREATE TABLE IF NOT EXISTS prestataire_competences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prestataire_id INT NOT NULL,
    competence VARCHAR(100) NOT NULL,
    FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE,
    INDEX idx_prestataire (prestataire_id),
    INDEX idx_competence (competence)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Administrateurs (extension de Utilisateurs)
  `CREATE TABLE IF NOT EXISTS administrateurs (
    id INT PRIMARY KEY,
    permissions JSON,
    nombre_validations INT DEFAULT 0,
    nombre_moderations INT DEFAULT 0,
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Missions
  `CREATE TABLE IF NOT EXISTS missions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    domaine VARCHAR(100) NOT NULL,
    budget DECIMAL(12,2) NOT NULL,
    budget_negociable BOOLEAN DEFAULT FALSE,
    lieu VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    type_location ENUM('sur_place', 'a_distance', 'hybride') DEFAULT 'sur_place',
    date_limite DATE,
    date_debut DATE,
    date_fin DATE,
    duree VARCHAR(50),
    statut ENUM('ouverte', 'en_cours', 'terminee', 'annulee') DEFAULT 'ouverte',
    prestataire_selectionne_id INT,
    nombre_candidatures INT DEFAULT 0,
    priorite ENUM('basse', 'normale', 'haute', 'urgente') DEFAULT 'normale',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (prestataire_selectionne_id) REFERENCES prestataires(id) ON DELETE SET NULL,
    INDEX idx_client (client_id),
    INDEX idx_domaine (domaine),
    INDEX idx_ville (ville),
    INDEX idx_statut (statut),
    INDEX idx_date_limite (date_limite),
    FULLTEXT idx_recherche (titre, description)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Compétences requises pour les Missions
  `CREATE TABLE IF NOT EXISTS mission_competences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mission_id INT NOT NULL,
    competence VARCHAR(100) NOT NULL,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    INDEX idx_mission (mission_id),
    INDEX idx_competence (competence)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Images des Missions
  `CREATE TABLE IF NOT EXISTS mission_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mission_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    ordre INT DEFAULT 0,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    INDEX idx_mission (mission_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Candidatures
  `CREATE TABLE IF NOT EXISTS candidatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mission_id INT NOT NULL,
    prestataire_id INT NOT NULL,
    client_id INT NOT NULL,
    message TEXT NOT NULL,
    proposition_prix DECIMAL(12,2) NOT NULL,
    delai_propose VARCHAR(100),
    statut ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente',
    date_postulation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse TIMESTAMP NULL,
    motif_refus TEXT,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (prestataire_id) REFERENCES prestataires(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_mission (mission_id),
    INDEX idx_prestataire (prestataire_id),
    INDEX idx_client (client_id),
    INDEX idx_statut (statut)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Conversations
  `CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant1_id INT NOT NULL,
    participant2_id INT NOT NULL,
    mission_id INT,
    dernier_message TEXT,
    date_dernier_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    messages_non_lus_1 INT DEFAULT 0,
    messages_non_lus_2 INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL,
    INDEX idx_participant1 (participant1_id),
    INDEX idx_participant2 (participant2_id),
    INDEX idx_mission (mission_id),
    UNIQUE KEY unique_conversation (participant1_id, participant2_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Messages
  `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expediteur_id INT NOT NULL,
    destinataire_id INT NOT NULL,
    contenu TEXT NOT NULL,
    type ENUM('texte', 'image', 'fichier') DEFAULT 'texte',
    fichier_url VARCHAR(255),
    mission_id INT,
    lu BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMP NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE SET NULL,
    INDEX idx_expediteur (expediteur_id),
    INDEX idx_destinataire (destinataire_id),
    INDEX idx_mission (mission_id),
    INDEX idx_lu (lu),
    INDEX idx_date (date_envoi)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Notifications
  `CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    type ENUM('info', 'mission', 'candidature', 'message', 'validation', 'evaluation') DEFAULT 'info',
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lue BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMP NULL,
    metadata JSON,
    envoyee_push BOOLEAN DEFAULT FALSE,
    date_envoi_push TIMESTAMP NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_type (type),
    INDEX idx_lue (lue),
    INDEX idx_date (date_creation)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Évaluations
  `CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mission_id INT NOT NULL,
    evaluateur_id INT NOT NULL,
    evalue_id INT NOT NULL,
    type_evaluateur ENUM('client', 'prestataire') NOT NULL,
    note INT NOT NULL CHECK (note >= 1 AND note <= 5),
    commentaire TEXT NOT NULL,
    qualite INT CHECK (qualite >= 1 AND qualite <= 5),
    communication INT CHECK (communication >= 1 AND communication <= 5),
    ponctualite INT CHECK (ponctualite >= 1 AND ponctualite <= 5),
    professionnalisme INT CHECK (professionnalisme >= 1 AND professionnalisme <= 5),
    date_evaluation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (evalue_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_mission (mission_id),
    INDEX idx_evaluateur (evaluateur_id),
    INDEX idx_evalue (evalue_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Table Historique des actions
  `CREATE TABLE IF NOT EXISTS historique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_concernee VARCHAR(50),
    enregistrement_id INT,
    details JSON,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_action (action),
    INDEX idx_date (date_action)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

/**
 * Exécuter les migrations
 */
async function runMigrations() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🚀 Démarrage des migrations...\n');
    
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      const tableName = migration.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      
      console.log(`📋 Migration ${i + 1}/${migrations.length}: Création de la table "${tableName}"...`);
      
      await connection.query(migration);
      
      console.log(`✅ Table "${tableName}" créée avec succès\n`);
    }
    
    console.log('🎉 Toutes les migrations ont été exécutées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };