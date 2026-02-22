/**
 * Serveur Principal SamaJob Backend MySQL
 * Point d'entrée de l'application Express
 * Basé sur le diagramme de cas d'utilisation
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');

// Configuration Database
const { testConnection } = require('./src/config/database');

// Middleware
const { publicRateLimiter } = require('./src/middleware/rateLimiter');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const prestataireRoutes = require('./src/routes/prestataireRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Initialisation de l'app Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE GLOBAUX =====

// Sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuré de manière sécurisée
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression des réponses
app.use(compression());

// Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Upload de fichiers (cross-platform temp dir)
const os = require('os');
const path = require('path');
const fs = require('fs');
const tempUploadDir = path.join(os.tmpdir(), 'samajob');
if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: tempUploadDir
}));

// Logging des requêtes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting global pour toutes les routes
app.use('/api', publicRateLimiter);

// ===== ROUTE DE SANTÉ =====
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    success: true,
    message: 'SamaJob API MySQL est opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbConnected ? 'Connectée' : 'Déconnectée'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API SamaJob avec MySQL',
    version: '1.0.0',
    documentation: '/api/docs',
    casUtilisation: {
      utilisateur: [
        'Créer un compte',
        'Se connecter',
        'Gérer son profil',
        'Discuter via chat'
      ],
      prestataire: [
        'Consulter les missions',
        'Postuler à une mission',
        'Réaliser la mission',
        'Consulter son historique',
        'Déposer un dossier'
      ],
      client: [
        'Publier une mission',
        'Consulter les candidatures',
        'Sélectionner un prestataire',
        'Valider la fin de mission',
        'Noter et commenter le prestataire'
      ],
      administrateur: [
        'Vérifier le dossier',
        'Valider le dossier',
        'Rejeter le dossier',
        'Modérer les contenus',
        'Suspendre un compte',
        'Consulter les statistiques',
        'Gérer les utilisateurs',
        'Gérer les missions'
      ]
    }
  });
});

// ===== ROUTES API =====
const API_VERSION = '/api';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/client`, clientRoutes);
app.use(`${API_VERSION}/prestataire`, prestataireRoutes);
app.use(`${API_VERSION}/admin`, adminRoutes);
app.use(`${API_VERSION}/messages`, messageRoutes);
app.use(`${API_VERSION}/notifications`, notificationRoutes);

// ===== GESTION DES ERREURS =====

// Route non trouvée
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Ne pas exposer les détails des erreurs en production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Une erreur est survenue' : err.message || 'Erreur serveur interne',
    ...(isProduction ? {} : { error: err.stack, details: err.details })
  });
});

// ===== DÉMARRAGE DU SERVEUR =====
async function startServer() {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de se connecter à MySQL');
      console.log('💡 Vérifiez votre configuration dans .env');
      process.exit(1);
    }

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('🚀 SamaJob Backend MySQL démarré !');
      console.log(`📡 Serveur: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 API: http://localhost:${PORT}${API_VERSION}`);
      console.log(`💾 Base de données: ${process.env.DB_NAME}`);
      console.log('========================================');
      console.log('');
      console.log('📚 Documentation: BACKEND_DOCUMENTATION.md');
      console.log('🔧 Configuration: .env');
      console.log('🗄️  Migrations: npm run migrate');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
}

startServer();

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

module.exports = app;