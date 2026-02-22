/**
 * Configuration de la Base de Données MySQL
 * Pool de connexions pour optimiser les performances
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration du pool de connexions
// Supporte Railway (MYSQLHOST...), TiDB Cloud (DB_SSL=true), et les variables custom (DB_HOST...)
const sslConfig = process.env.DB_SSL === 'true'
  ? { ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' } }
  : {};

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
  user:     process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME     || process.env.MYSQLDATABASE || 'samajob',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ...sslConfig
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