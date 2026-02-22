-- Script pour créer un compte administrateur directement dans MySQL
-- Exécuter ce script: mysql -u root -p samajob < create-admin.sql

USE samajob;

-- Le mot de passe 'Admin123' hashé avec bcrypt (cost 10)
-- Hash généré: $2a$10$YourBcryptHashHere
-- IMPORTANT: Ce hash est un exemple, il sera généré dynamiquement par l'application

-- Insérer l'utilisateur admin
INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, role, statut)
VALUES (
  'Admin',
  'SamaJob',
  'admin@samajob.com',
  '+221771234567',
  -- Ce hash correspond au mot de passe 'Admin123'
  -- Vous devez le générer avec: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123', 10).then(console.log);"
  '$2a$10$VOTRE_HASH_ICI',
  'admin',
  'actif'
);

-- Récupérer l'ID de l'admin créé
SET @admin_id = LAST_INSERT_ID();

-- Créer l'entrée dans la table administrateurs
INSERT INTO administrateurs (id, permissions)
VALUES (@admin_id, '["all"]');

-- Vérifier la création
SELECT u.id, u.nom, u.prenom, u.email, u.role, u.statut, a.permissions
FROM utilisateurs u
INNER JOIN administrateurs a ON u.id = a.id
WHERE u.role = 'admin';
