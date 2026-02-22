/**
 * Configuration de la Base de Données MySQL
 * Pool de connexions pour optimiser les performances
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration du pool de connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'samajob',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Test de connexion à la base de données
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return false;
  }
};

/**
 * Exécuter une requête SQL
 */
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    throw error;
  }
};

/**
 * Obtenir une connexion du pool
 */
const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = {
  pool,
  query,
  getConnection,
  testConnection
};