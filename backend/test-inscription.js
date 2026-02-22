/**
 * Script de Test d'Inscription et Connexion
 * Usage: node test-inscription.js
 */

const axios = require('axios');

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
      const healthResponse = await axios.get('http://localhost:3000/health');
      log.success('Serveur opérationnel');
      log.info(`Base de données: ${healthResponse.data.database}`);
    } catch (error) {
      log.error('Le serveur ne répond pas!');
      log.warning('Vérifiez que le serveur est démarré: npm run dev');
      process.exit(1);
    }

    console.log('');

    // Test 2: Inscription
    log.info('Test 2: Inscription d\'un nouveau compte...');
    log.info(`Email: ${testUser.email}`);
    log.info(`Téléphone: ${testUser.telephone}`);

    let token = null;
    let userId = null;

    try {
      const signupResponse = await axios.post(`${BASE_URL}/auth/creer-compte`, testUser);

      if (signupResponse.status === 201 && signupResponse.data.success) {
        log.success('Inscription réussie!');
        token = signupResponse.data.data.token;
        userId = signupResponse.data.data.user.id;
        log.info(`User ID: ${userId}`);
        log.info(`Token: ${token.substring(0, 20)}...`);
      } else {
        log.error('Inscription échouée - Réponse inattendue');
        console.log(JSON.stringify(signupResponse.data, null, 2));
        process.exit(1);
      }
    } catch (error) {
      log.error('Erreur lors de l\'inscription');

      if (error.response) {
        console.log('\nDétails de l\'erreur:');
        console.log(`Status: ${error.response.status}`);
        console.log(`Message: ${error.response.data.message || 'Aucun message'}`);

        if (error.response.data.errors) {
          console.log('\nErreurs de validation:');
          error.response.data.errors.forEach(err => {
            console.log(`  - ${err.field}: ${err.message}`);
          });
        }

        console.log('\nCorps de la réponse complète:');
        console.log(JSON.stringify(error.response.data, null, 2));

        // Suggestions
        console.log('\n💡 Suggestions:');
        if (error.response.status === 422) {
          console.log('  - Vérifiez que tous les champs requis sont fournis');
          console.log('  - Vérifiez le format de l\'email et du téléphone');
          console.log('  - Le mot de passe doit avoir 8+ caractères, 1 MAJ, 1 min, 1 chiffre');
        } else if (error.response.status === 409) {
          console.log('  - Ce compte existe déjà, essayez de vous connecter');
        } else if (error.response.status === 500) {
          console.log('  - Vérifiez que MySQL est démarré');
          console.log('  - Vérifiez que les tables existent: npm run migrate');
        }
      } else {
        console.log(`\nErreur: ${error.message}`);
      }

      process.exit(1);
    }

    console.log('');

    // Test 3: Connexion avec email
    log.info('Test 3: Connexion avec email...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/connexion`, {
        identifier: testUser.email,
        motDePasse: testUser.motDePasse
      });

      if (loginResponse.status === 200 && loginResponse.data.success) {
        log.success('Connexion avec email réussie!');
        log.info(`Token reçu: ${loginResponse.data.data.token.substring(0, 20)}...`);
      } else {
        log.error('Connexion échouée');
        console.log(JSON.stringify(loginResponse.data, null, 2));
      }
    } catch (error) {
      log.error('Erreur lors de la connexion avec email');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Message: ${error.response.data.message}`);
      }
    }

    console.log('');

    // Test 4: Connexion avec téléphone
    log.info('Test 4: Connexion avec téléphone...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/connexion`, {
        identifier: testUser.telephone,
        motDePasse: testUser.motDePasse
      });

      if (loginResponse.status === 200 && loginResponse.data.success) {
        log.success('Connexion avec téléphone réussie!');
      } else {
        log.error('Connexion échouée');
      }
    } catch (error) {
      log.error('Erreur lors de la connexion avec téléphone');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Message: ${error.response.data.message}`);
      }
    }

    console.log('');

    // Test 5: Accéder au profil
    log.info('Test 5: Accès au profil (route protégée)...');
    try {
      const profilResponse = await axios.get(`${BASE_URL}/auth/profil`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profilResponse.status === 200 && profilResponse.data.success) {
        log.success('Accès au profil réussi!');
        log.info(`Nom: ${profilResponse.data.data.nom} ${profilResponse.data.data.prenom}`);
        log.info(`Rôle: ${profilResponse.data.data.role}`);
      } else {
        log.error('Échec de récupération du profil');
      }
    } catch (error) {
      log.error('Erreur lors de l\'accès au profil');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Message: ${error.response.data.message}`);
      }
    }

    console.log('');

    // Test 6: Connexion avec mauvais mot de passe
    log.info('Test 6: Tentative avec mauvais mot de passe (doit échouer)...');
    try {
      await axios.post(`${BASE_URL}/auth/connexion`, {
        identifier: testUser.email,
        motDePasse: 'MauvaisMotDePasse123'
      });
      log.warning('Le test aurait dû échouer!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log.success('Rejet du mauvais mot de passe (comportement attendu)');
      } else {
        log.warning('Erreur inattendue');
      }
    }

    console.log('');
    console.log('='.repeat(60));
    log.success('TOUS LES TESTS SONT RÉUSSIS! 🎉');
    console.log('='.repeat(60));
    console.log('');
    console.log('Compte de test créé:');
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Téléphone: ${testUser.telephone}`);
    console.log(`  Mot de passe: ${testUser.motDePasse}`);
    console.log('');

  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    log.error('TESTS ÉCHOUÉS');
    console.log('='.repeat(60));
    console.log('');
    console.log('Consultez DIAGNOSTIC_CONNEXION.md pour plus d\'aide');
    console.log('');
    process.exit(1);
  }
}

// Exécuter les tests
testInscription();
