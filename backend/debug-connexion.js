/**
 * Script de Debug de Connexion
 * Vérifie pourquoi la connexion échoue avec des données valides
 * Usage: node debug-connexion.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

async function debugConnexion() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DEBUG - PROBLÈME DE CONNEXION');
  console.log('='.repeat(60) + '\n');

  try {
    // Étape 1: Lister tous les comptes
    log.info('Étape 1: Liste de tous les comptes...');
    const allUsers = await query('SELECT id, nom, prenom, email, telephone, role, statut FROM utilisateurs ORDER BY id DESC LIMIT 5');

    if (allUsers.length === 0) {
      log.error('Aucun compte dans la base de données!');
      log.info('Créez un compte d\'abord avec: npm run test-auth');
      process.exit(1);
    }

    console.log('\n📋 Comptes disponibles:\n');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Nom: ${user.nom} ${user.prenom}`);
      console.log(`   Email: ${user.email || 'Non renseigné'}`);
      console.log(`   Téléphone: ${user.telephone || 'Non renseigné'}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Statut: ${user.statut}`);
      console.log('');
    });

    // Demander quel compte tester
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Entrez le numéro du compte à tester (ou ID): ', async (answer) => {
      readline.close();

      let userId;
      const num = parseInt(answer);

      if (num > 0 && num <= allUsers.length) {
        userId = allUsers[num - 1].id;
      } else {
        userId = num;
      }

      console.log('');
      log.info(`Test du compte ID: ${userId}\n`);

      // Récupérer le compte complet
      const users = await query('SELECT * FROM utilisateurs WHERE id = ?', [userId]);

      if (users.length === 0) {
        log.error('Compte non trouvé!');
        process.exit(1);
      }

      const user = users[0];

      console.log('📊 Informations du compte:\n');
      console.log(`ID: ${user.id}`);
      console.log(`Nom: ${user.nom} ${user.prenom}`);
      console.log(`Email: ${user.email || 'Non renseigné'}`);
      console.log(`Téléphone: ${user.telephone || 'Non renseigné'}`);
      console.log(`Rôle: ${user.role}`);
      console.log(`Statut: ${user.statut}`);
      console.log(`Hash du mot de passe: ${user.mot_de_passe.substring(0, 20)}...`);
      console.log('');

      // Vérifications
      console.log('🔍 Vérifications:\n');

      // 1. Vérifier le statut
      if (user.statut !== 'actif') {
        log.error(`Statut du compte: ${user.statut} (doit être "actif")`);
        log.info('Pour activer: UPDATE utilisateurs SET statut = \'actif\' WHERE id = ' + userId);
        process.exit(1);
      } else {
        log.success('Statut: actif ✓');
      }

      // 2. Vérifier qu'il a au moins email OU téléphone
      if (!user.email && !user.telephone) {
        log.error('Ni email ni téléphone renseigné!');
        process.exit(1);
      } else {
        log.success('Email ou téléphone: présent ✓');
      }

      // 3. Tester différents mots de passe
      console.log('\n🧪 Test de mots de passe:\n');

      const passwords = [
        'Password123',
        'Admin123',
        'password',
        'admin',
        '12345678',
        'Test123'
      ];

      let foundPassword = null;

      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, user.mot_de_passe);
        if (match) {
          log.success(`Mot de passe trouvé: "${pwd}"`);
          foundPassword = pwd;
          break;
        } else {
          console.log(`   ❌ "${pwd}" - incorrect`);
        }
      }

      console.log('');

      if (foundPassword) {
        console.log('='.repeat(60));
        log.success('SOLUTION TROUVÉE!');
        console.log('='.repeat(60));
        console.log('');
        console.log('🔑 Utilisez ces identifiants pour vous connecter:\n');

        if (user.email) {
          console.log('Option 1 - Avec Email:');
          console.log(`  Email: ${user.email}`);
          console.log(`  Mot de passe: ${foundPassword}`);
          console.log('');
          console.log('PowerShell:');
          console.log(`$body = @{`);
          console.log(`    identifier = "${user.email}"`);
          console.log(`    motDePasse = "${foundPassword}"`);
          console.log(`} | ConvertTo-Json`);
          console.log('Invoke-RestMethod -Uri "http://localhost:3000/api/auth/connexion" -Method Post -Body $body -ContentType "application/json"');
          console.log('');
        }

        if (user.telephone) {
          console.log('Option 2 - Avec Téléphone:');
          console.log(`  Téléphone: ${user.telephone}`);
          console.log(`  Mot de passe: ${foundPassword}`);
          console.log('');
          console.log('PowerShell:');
          console.log(`$body = @{`);
          console.log(`    identifier = "${user.telephone}"`);
          console.log(`    motDePasse = "${foundPassword}"`);
          console.log(`} | ConvertTo-Json`);
          console.log('Invoke-RestMethod -Uri "http://localhost:3000/api/auth/connexion" -Method Post -Body $body -ContentType "application/json"');
          console.log('');
        }
      } else {
        console.log('='.repeat(60));
        log.error('MOT DE PASSE INCONNU');
        console.log('='.repeat(60));
        console.log('');
        log.info('Solutions:\n');
        console.log('1. Créer un nouveau compte:');
        console.log('   npm run test-auth');
        console.log('');
        console.log('2. Réinitialiser le mot de passe de ce compte:');
        console.log('   node -e "const bcrypt = require(\'bcryptjs\'); bcrypt.hash(\'Password123\', 10).then(hash => console.log(hash));"');
        console.log('   Puis: UPDATE utilisateurs SET mot_de_passe = \'HASH_ICI\' WHERE id = ' + userId);
        console.log('');
        console.log('3. Ou utiliser un autre compte de la liste ci-dessus');
        console.log('');
      }

      process.exit(0);
    });

  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    log.error('ERREUR');
    console.log('='.repeat(60));
    console.log('');
    console.error('Erreur:', error.message);
    console.log('');
    log.info('Vérifiez que:');
    console.log('  1. MySQL est démarré');
    console.log('  2. Les tables existent (npm run migrate)');
    console.log('  3. Le serveur backend fonctionne');
    console.log('');
    process.exit(1);
  }
}

debugConnexion();
