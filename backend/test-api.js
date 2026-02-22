/**
 * Script de Test API
 * Teste les endpoints principais du backend
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Fonction utilitaire pour faire les requêtes
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error('Erreur:', error);
    return { status: 0, error: error.message };
  }
}

/**
 * Tests d'authentification
 */
async function testAuthentication() {
  console.log('\n=== TEST AUTHENTIFICATION ===\n');

  // Test 1: Créer un compte prestataire
  console.log('1. Création compte prestataire...');
  const signupPrestataire = await apiRequest('POST', '/auth/creer-compte', {
    nom: 'TestPrestataire',
    prenom: 'Jean',
    email: 'test.prestataire@example.com',
    telephone: '+212612345678',
    motDePasse: 'TestPassword123',
    role: 'prestataire',
    domaine: 'Développement'
  });
  console.log(`Status: ${signupPrestataire.status}`);
  console.log('Response:', signupPrestataire.data);

  if (signupPrestataire.data?.success) {
    const prestataireToken = signupPrestataire.data.data.token;

    // Test 2: Connexion prestataire
    console.log('\n2. Connexion prestataire...');
    const loginPrestataire = await apiRequest('POST', '/auth/connexion', {
      identifier: 'test.prestataire@example.com',
      motDePasse: 'TestPassword123'
    });
    console.log(`Status: ${loginPrestataire.status}`);
    console.log('Response:', loginPrestataire.data);

    // Test 3: Récupérer profil
    if (loginPrestataire.data?.success) {
      const token = loginPrestataire.data.data.token;
      console.log('\n3. Récupération du profil...');
      const profil = await apiRequest('GET', '/auth/profil', null, token);
      console.log(`Status: ${profil.status}`);
      console.log('Response:', profil.data);
    }
  }

  // Test 4: Créer un compte client
  console.log('\n4. Création compte client...');
  const signupClient = await apiRequest('POST', '/auth/creer-compte', {
    nom: 'TestClient',
    prenom: 'Marie',
    email: 'test.client@example.com',
    telephone: '+212687654321',
    motDePasse: 'TestPassword123',
    role: 'client',
    entreprise: 'Test Company'
  });
  console.log(`Status: ${signupClient.status}`);
  console.log('Response:', signupClient.data);
}

/**
 * Tests missions (Prestataire)
 */
async function testMissions(token) {
  console.log('\n=== TEST MISSIONS ===\n');

  // Test 1: Lister les missions
  console.log('1. Lister les missions disponibles...');
  const missions = await apiRequest('GET', '/prestataire/missions', null, token);
  console.log(`Status: ${missions.status}`);
  console.log('Response:', missions.data);

  // Test 2: Rechercher des missions
  if (missions.data?.data?.length > 0) {
    const missionId = missions.data.data[0].id;

    console.log(`\n2. Détails d'une mission (ID: ${missionId})...`);
    const missionDetail = await apiRequest('GET', `/prestataire/missions/${missionId}`, null, token);
    console.log(`Status: ${missionDetail.status}`);
    console.log('Response:', missionDetail.data);
  }

  // Test 3: Recherche
  console.log('\n3. Recherche de missions...');
  const search = await apiRequest('GET', '/prestataire/missions/rechercher/developpement', null, token);
  console.log(`Status: ${search.status}`);
  console.log('Response:', search.data);
}

/**
 * Test complet
 */
async function runAllTests() {
  console.log('🚀 DÉMARRAGE DES TESTS API SAMAJOB\n');
  console.log(`URL: ${API_BASE_URL}\n`);

  // Test d'authentification
  await testAuthentication();

  console.log('\n✅ Tests complétés!');
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error('Erreur lors des tests:', error);
  process.exit(1);
});
