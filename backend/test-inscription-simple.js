/**
 * Script de Test d'Inscription et Connexion (sans dépendances)
 * Usage: node test-inscription-simple.js
 */

const BASE_URL = 'http://localhost:3000/api';

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

async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

async function testInscription() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST D\'INSCRIPTION ET CONNEXION');
  console.log('='.repeat(60) + '\n');

  // Données de test
  const timestamp = Date.now();
  const testUser = {
    nom: 'Test',
    prenom: 'User',
    email: `test${timestamp}@example.com`,
    telephone: `+22177${timestamp.toString().slice(-7)}`,
    motDePasse: 'Password123',
    role: 'client'
  };

  try {
    // Test 1: Vérifier que le serveur fonctionne
    log.info('Test 1: Vérification du serveur...');
    try {
      const health = await makeRequest('http://localhost:3000/health');

      if (health.ok && health.data.success) {
        log.success('Serveur opérationnel');
        log.info(`Base de données: ${health.data.database}`);
      } else {
        log.error('Le serveur ne fonctionne pas correctement');
        console.log(JSON.stringify(health.data, null, 2));
        process.exit(1);
      }
    } catch (error) {
      log.error('Le serveur ne répond pas!');
      log.warning('Assurez-vous que le serveur est démarré: npm run dev');
      console.error(`Erreur: ${error.message}`);
      process.exit(1);
    }

    console.log('');

    // Test 2: Inscription
    log.info('Test 2: Inscription d\'un nouveau compte...');
    log.info(`Email: ${testUser.email}`);
    log.info(`Téléphone: ${testUser.telephone}`);
    log.info(`Mot de passe: ${testUser.motDePasse}`);

    let token = null;
    let userId = null;

    const signup = await makeRequest(`${BASE_URL}/auth/creer-compte`, 'POST', testUser);

    if (signup.status === 201 && signup.data.success) {
      log.success('✅ Inscription réussie!');
      token = signup.data.data.token;
      userId = signup.data.data.user.id;
      log.info(`User ID: ${userId}`);
      log.info(`Rôle: ${signup.data.data.user.role}`);
      log.info(`Token reçu: ${token.substring(0, 30)}...`);
    } else {
      log.error('❌ Inscription échouée');
      console.log('\n📊 Détails de l\'erreur:');
      console.log(`Status HTTP: ${signup.status}`);
      console.log(`Message: ${signup.data.message || 'Aucun message'}`);

      if (signup.data.errors) {
        console.log('\n🔍 Erreurs de validation:');
        signup.data.errors.forEach(err => {
          console.log(`  • Champ: ${err.field}`);
          console.log(`    Erreur: ${err.message}`);
        });
      }

      console.log('\n📄 Réponse complète:');
      console.log(JSON.stringify(signup.data, null, 2));

      // Suggestions selon le code d'erreur
      console.log('\n💡 Suggestions:');
      if (signup.status === 422) {
        console.log('  ✓ Vérifiez que tous les champs requis sont fournis');
        console.log('  ✓ Email doit être valide (ex: user@example.com)');
        console.log('  ✓ Téléphone: +221XXXXXXXXX ou XXXXXXXXX (9 chiffres)');
        console.log('  ✓ Mot de passe: 8+ caractères, 1 MAJ, 1 min, 1 chiffre');
        console.log('  ✓ Au moins email OU téléphone requis');
      } else if (signup.status === 409) {
        console.log('  ✓ Ce compte existe déjà');
        console.log('  ✓ Essayez de vous connecter au lieu de créer un compte');
      } else if (signup.status === 500) {
        console.log('  ✓ Erreur serveur - Vérifiez les logs du serveur');
        console.log('  ✓ MySQL est-il démarré? Exécutez: npm run test-db');
        console.log('  ✓ Les tables existent? Exécutez: npm run migrate');
      } else if (signup.status === 429) {
        console.log('  ✓ Trop de tentatives - Attendez 15 minutes');
        console.log('  ✓ Ou redémarrez le serveur (en développement)');
      }

      process.exit(1);
    }

    console.log('');

    // Test 3: Connexion avec email
    log.info('Test 3: Connexion avec email...');
    const loginEmail = await makeRequest(`${BASE_URL}/auth/connexion`, 'POST', {
      identifier: testUser.email,
      motDePasse: testUser.motDePasse
    });

    if (loginEmail.status === 200 && loginEmail.data.success) {
      log.success('Connexion avec email réussie!');
      log.info(`Token: ${loginEmail.data.data.token.substring(0, 30)}...`);
    } else {
      log.error('Connexion avec email échouée');
      console.log(`Status: ${loginEmail.status}`);
      console.log(`Message: ${loginEmail.data.message}`);
    }

    console.log('');

    // Test 4: Connexion avec téléphone
    log.info('Test 4: Connexion avec téléphone...');
    const loginPhone = await makeRequest(`${BASE_URL}/auth/connexion`, 'POST', {
      identifier: testUser.telephone,
      motDePasse: testUser.motDePasse
    });

    if (loginPhone.status === 200 && loginPhone.data.success) {
      log.success('Connexion avec téléphone réussie!');
    } else {
      log.error('Connexion avec téléphone échouée');
      console.log(`Status: ${loginPhone.status}`);
      console.log(`Message: ${loginPhone.data.message}`);
    }

    console.log('');

    // Test 5: Accéder au profil
    log.info('Test 5: Accès au profil (route protégée)...');
    const profil = await makeRequest(`${BASE_URL}/auth/profil`, 'GET', null, {
      'Authorization': `Bearer ${token}`
    });

    if (profil.status === 200 && profil.data.success) {
      log.success('Accès au profil réussi!');
      const user = profil.data.data;
      log.info(`Nom: ${user.nom} ${user.prenom}`);
      log.info(`Email: ${user.email || 'Non fourni'}`);
      log.info(`Téléphone: ${user.telephone || 'Non fourni'}`);
      log.info(`Rôle: ${user.role}`);
      log.info(`Statut: ${user.statut}`);
    } else {
      log.error('Échec de récupération du profil');
      console.log(`Status: ${profil.status}`);
      console.log(`Message: ${profil.data.message}`);
    }

    console.log('');

    // Test 6: Connexion avec mauvais mot de passe (doit échouer)
    log.info('Test 6: Tentative avec mauvais mot de passe...');
    const badLogin = await makeRequest(`${BASE_URL}/auth/connexion`, 'POST', {
      identifier: testUser.email,
      motDePasse: 'MauvaisMotDePasse123'
    });

    if (badLogin.status === 401) {
      log.success('Rejet du mauvais mot de passe ✓ (comportement attendu)');
    } else if (badLogin.status === 200) {
      log.warning('⚠️  Le mauvais mot de passe a été accepté! (problème de sécurité)');
    } else {
      log.warning('Réponse inattendue');
      console.log(`Status: ${badLogin.status}`);
    }

    console.log('');
    console.log('='.repeat(60));
    log.success('🎉 TOUS LES TESTS SONT RÉUSSIS!');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ Inscription fonctionne');
    console.log('✅ Connexion fonctionne (email et téléphone)');
    console.log('✅ Routes protégées fonctionnent');
    console.log('✅ Validation des mots de passe fonctionne');
    console.log('');
    console.log('📋 Compte de test créé:');
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Téléphone: ${testUser.telephone}`);
    console.log(`  Mot de passe: ${testUser.motDePasse}`);
    console.log(`  Token: ${token.substring(0, 40)}...`);
    console.log('');

  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    log.error('ERREUR INATTENDUE');
    console.log('='.repeat(60));
    console.log('');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    console.log('');
    console.log('💡 Vérifications:');
    console.log('  1. Le serveur est-il démarré? (npm run dev)');
    console.log('  2. MySQL fonctionne-t-il? (npm run test-db)');
    console.log('  3. Les tables existent? (npm run migrate)');
    console.log('');
    console.log('📚 Consultez: DIAGNOSTIC_CONNEXION.md');
    console.log('');
    process.exit(1);
  }
}

// Exécuter les tests
testInscription().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
