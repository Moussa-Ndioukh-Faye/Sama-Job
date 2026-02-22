/**
 * Point d'entrée pour le déploiement en production (Railway, Render...)
 * Lance les migrations puis démarre le serveur Express
 */

const path = require('path');

async function main() {
  // 1. Exécuter les migrations
  try {
    console.log('🔄 Exécution des migrations...');
    const { runMigrations } = require('./src/database/migrate');
    await runMigrations();
    console.log('✅ Migrations terminées\n');
  } catch (err) {
    console.error('❌ Échec des migrations:', err.message);
    process.exit(1);
  }

  // 2. Vider le cache du pool MySQL (fermé par migrate.js)
  //    pour que server.js crée un nouveau pool opérationnel
  const dbConfigPath = path.resolve(__dirname, './src/config/database');
  delete require.cache[dbConfigPath];

  // 3. Démarrer le serveur Express
  require('./server');
}

main();
