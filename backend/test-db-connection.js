/**
 * Script de Test de Connexion à la Base de Données
 * Exécutez ce script pour vérifier que MySQL est correctement configuré
 *
 * Usage: node test-db-connection.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}🔍 ${msg}${colors.reset}`)
};

async function testDatabaseConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST DE CONNEXION À LA BASE DE DONNÉES MYSQL');
  console.log('='.repeat(60) + '\n');

  // Afficher la configuration
  log.info('Configuration:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   User: ${process.env.DB_USER || 'root'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'samajob'}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : '(vide)'}`);
  console.log('');

  let connection = null;

  try {
    // Test 1: Connexion au serveur MySQL (sans spécifier la base de données)
    log.step('Test 1: Connexion au serveur MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    log.success('Connexion au serveur MySQL réussie');

    // Test 2: Vérifier la version de MySQL
    log.step('Test 2: Vérification de la version MySQL...');
    const [versionResult] = await connection.query('SELECT VERSION() as version');
    log.success(`Version MySQL: ${versionResult[0].version}`);

    // Test 3: Vérifier si la base de données existe
    log.step(`Test 3: Vérification de la base de données '${process.env.DB_NAME || 'samajob'}'...`);
    const [databases] = await connection.query(
      'SHOW DATABASES LIKE ?',
      [process.env.DB_NAME || 'samajob']
    );

    if (databases.length === 0) {
      log.warning(`La base de données '${process.env.DB_NAME || 'samajob'}' n'existe pas`);
      log.info('Création de la base de données...');

      await connection.query(
        `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'samajob'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      log.success('Base de données créée avec succès');
    } else {
      log.success('Base de données trouvée');
    }

    // Test 4: Se connecter à la base de données spécifique
    log.step('Test 4: Connexion à la base de données...');
    await connection.end();

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'samajob'
    });
    log.success('Connexion à la base de données réussie');

    // Test 5: Vérifier les tables
    log.step('Test 5: Vérification des tables...');
    const [tables] = await connection.query('SHOW TABLES');

    if (tables.length === 0) {
      log.warning('Aucune table trouvée dans la base de données');
      log.info('Exécutez "npm run migrate" pour créer les tables');
    } else {
      log.success(`${tables.length} table(s) trouvée(s):`);
      tables.forEach((table) => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    }

    // Test 6: Test de requête simple
    log.step('Test 6: Test d\'une requête simple...');
    const [result] = await connection.query('SELECT 1 + 1 AS result');
    log.success(`Résultat de la requête: ${result[0].result}`);

    // Résumé final
    console.log('\n' + '='.repeat(60));
    log.success('TOUS LES TESTS ONT RÉUSSI !');
    console.log('='.repeat(60) + '\n');

    console.log('📋 Prochaines étapes:');
    if (tables.length === 0) {
      console.log('   1. Exécutez "npm run migrate" pour créer les tables');
      console.log('   2. Optionnel: "npm run seed" pour ajouter des données de test');
    }
    console.log('   3. Démarrez le serveur avec "npm run dev"');
    console.log('   4. Testez l\'API à http://localhost:3000/health\n');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log.error('ÉCHEC DES TESTS');
    console.log('='.repeat(60) + '\n');

    log.error(`Erreur: ${error.message}`);
    console.log('');

    // Diagnostics
    console.log('🔧 Diagnostics et Solutions:\n');

    if (error.code === 'ECONNREFUSED') {
      log.warning('MySQL n\'est pas en cours d\'exécution');
      console.log('\n   Solutions:');
      console.log('   • Windows: Démarrez MySQL depuis Services ou XAMPP');
      console.log('   • Linux/Mac: sudo service mysql start');
      console.log('   • Vérifiez que MySQL écoute sur le bon port (3306)\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log.warning('Accès refusé - Mauvais identifiants');
      console.log('\n   Solutions:');
      console.log('   • Vérifiez DB_USER et DB_PASSWORD dans le fichier .env');
      console.log('   • Commande pour réinitialiser le mot de passe MySQL:');
      console.log('     mysql -u root');
      console.log('     ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'nouveau_password\';');
      console.log('     FLUSH PRIVILEGES;\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      log.warning('Base de données inexistante');
      console.log('\n   Solution: La base sera créée automatiquement au prochain lancement\n');
    } else {
      console.log('\n   Erreur inattendue. Vérifiez:');
      console.log('   • Que MySQL est installé et démarré');
      console.log('   • Les paramètres dans le fichier .env');
      console.log('   • Les logs MySQL pour plus de détails\n');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le test
testDatabaseConnection().catch((error) => {
  log.error('Erreur critique: ' + error.message);
  process.exit(1);
});
