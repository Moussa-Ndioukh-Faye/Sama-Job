/**
 * Script pour créer un compte administrateur
 * Usage: node create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

const adminData = {
  nom: 'Admin',
  prenom: 'SamaJob',
  email: 'admin@samajob.com',
  telephone: '+221771234567',
  motDePasse: 'Admin123', // Changez ce mot de passe!
  role: 'admin'
};

async function createAdmin() {
  console.log('========================================');
  console.log('🔧 Création d\'un compte administrateur');
  console.log('========================================\n');

  try {
    // Vérifier si l'admin existe déjà
    console.log('Vérification de l\'existence du compte...');
    const checkSql = 'SELECT * FROM utilisateurs WHERE email = ? OR telephone = ?';
    const existing = await query(checkSql, [adminData.email, adminData.telephone]);

    if (existing.length > 0) {
      console.log('\n❌ Un compte avec cet email ou téléphone existe déjà!\n');
      console.log('Détails du compte existant:');
      console.log(`  - ID: ${existing[0].id}`);
      console.log(`  - Nom: ${existing[0].nom} ${existing[0].prenom}`);
      console.log(`  - Email: ${existing[0].email}`);
      console.log(`  - Rôle: ${existing[0].role}`);
      console.log(`  - Statut: ${existing[0].statut}\n`);

      console.log('💡 Pour vous connecter, utilisez:');
      console.log(`  - Email: ${existing[0].email}`);
      console.log(`  - Mot de passe: (celui que vous avez défini)\n`);

      process.exit(0);
    }

    // Hasher le mot de passe
    console.log('Hashage du mot de passe...');
    const motDePasseHash = await bcrypt.hash(adminData.motDePasse, 10);

    // Créer l'utilisateur
    console.log('Création de l\'utilisateur...');
    const sqlUser = `
      INSERT INTO utilisateurs
      (nom, prenom, email, telephone, mot_de_passe, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sqlUser, [
      adminData.nom,
      adminData.prenom,
      adminData.email,
      adminData.telephone,
      motDePasseHash,
      adminData.role
    ]);

    const userId = result.insertId;

    // Créer l'entrée administrateur
    console.log('Création de l\'entrée administrateur...');
    const sqlAdmin = `
      INSERT INTO administrateurs (id, permissions)
      VALUES (?, ?)
    `;

    await query(sqlAdmin, [userId, JSON.stringify(['all'])]);

    console.log('\n========================================');
    console.log('✅ Compte administrateur créé avec succès!');
    console.log('========================================\n');

    console.log('Informations de connexion:');
    console.log(`  📧 Email: ${adminData.email}`);
    console.log(`  📱 Téléphone: ${adminData.telephone}`);
    console.log(`  🔑 Mot de passe: ${adminData.motDePasse}`);
    console.log(`  👤 Rôle: ${adminData.role}`);
    console.log(`  🆔 ID: ${userId}\n`);

    console.log('🧪 Pour tester la connexion:');
    console.log('\nAvec cURL:');
    console.log(`curl -X POST http://localhost:3000/api/auth/connexion \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d "{\\"identifier\\":\\"${adminData.email}\\",\\"motDePasse\\":\\"${adminData.motDePasse}\\"}"`);

    console.log('\nAvec Postman/Insomnia:');
    console.log('POST http://localhost:3000/api/auth/connexion');
    console.log('Body: {');
    console.log(`  "identifier": "${adminData.email}",`);
    console.log(`  "motDePasse": "${adminData.motDePasse}"`);
    console.log('}\n');

    console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la création:', error.message);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 Les tables n\'existent pas encore.');
      console.log('   Exécutez d\'abord: npm run migrate\n');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.log('\n💡 Ce compte existe déjà.\n');
    }

    process.exit(1);
  }

  process.exit(0);
}

// Exécuter la création
createAdmin();
