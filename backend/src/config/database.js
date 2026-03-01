/**
 * Configuration de la Base de Données MySQL (MariaDB local)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'samajob',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Retourner les BIGINT (COUNT, SUM) comme nombres JS, pas BigInt
  supportBigNumbers: true,
  bigNumberStrings: false,
  // Retourner les DECIMAL/FLOAT comme nombres JS, pas strings
  decimalNumbers: true,
  // SSL requis pour les bases cloud (Railway, TiDB, PlanetScale...)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

/**
 * Test de connexion
 */
const testConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connexion MySQL reussie');
    return true;
  } catch (error) {
    console.error('Erreur de connexion MySQL:', error.message);
    return false;
  }
};

/**
 * Exécuter une requête SQL
 * Retourne les rows pour SELECT, OkPacket pour INSERT/UPDATE/DELETE
 */
const query = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    console.error('SQL:', sql);
    throw error;
  }
};

/**
 * Obtenir une connexion du pool
 */
const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = { pool, query, getConnection, testConnection };
