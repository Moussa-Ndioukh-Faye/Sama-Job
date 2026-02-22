/**
 * Middleware d'Authentification
 * Vérifie les tokens JWT
 */

const jwt = require('jsonwebtoken');

/**
 * Vérifier le token JWT
 */
exports.verifierToken = (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    // Format: Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Format de token invalide'
      });
    }
    const token = parts[1];

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter les données du token à la requête
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    console.error('Erreur vérification token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token'
    });
  }
};

/**
 * Vérifier que l'utilisateur a un rôle spécifique
 */
exports.verifierRole = (rolesAutorises) => {
  return (req, res, next) => {
    // Le middleware verifierToken doit être appelé avant
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: rôle insuffisant'
      });
    }

    next();
  };
};

/**
 * Vérifier que c'est la même ressource ou un admin
 */
exports.verifierProprietaire = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  // Récupérer l'ID de la ressource (généralement dans les params)
  const ressourceId = parseInt(req.params.id || req.params.userId);
  const utilisateurId = req.user.userId;

  if (utilisateurId !== ressourceId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Vous n\'avez pas accès à cette ressource'
    });
  }

  next();
};

/**
 * Optionnel: Vérifier le token mais ne pas rejeter si absent
 */
exports.verifierTokenOptionnel = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
        req.user = {
          userId: decoded.userId,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    // Ne pas rejeter, continuer sans authentification
    next();
  }
};
