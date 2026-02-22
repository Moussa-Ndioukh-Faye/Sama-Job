/**
 * Middleware de Rate Limiting
 * Protection contre les attaques par force brute
 */

// Stockage en mémoire des tentatives (en production, utilisez Redis)
const requestCounts = new Map();

// Nettoyer les anciennes entrées toutes les 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 0) {
      requestCounts.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Rate limiter générique
 * @param {number} maxRequests - Nombre maximum de requêtes
 * @param {number} windowMs - Fenêtre de temps en millisecondes
 * @param {string} message - Message d'erreur personnalisé
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000, message = 'Trop de requêtes') => {
  return (req, res, next) => {
    // Utiliser l'IP comme identifiant (en production, considérez l'authentification)
    const identifier = req.ip || req.connection.remoteAddress;
    const key = `${identifier}:${req.path}`;

    const now = Date.now();
    const requestData = requestCounts.get(key);

    if (!requestData) {
      // Première requête
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // Vérifier si la fenêtre a expiré
    if (now > requestData.resetTime) {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // Incrémenter le compteur
    if (requestData.count >= maxRequests) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);

      res.set('Retry-After', retryAfter);
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

      return res.status(429).json({
        success: false,
        message,
        retryAfter: `${retryAfter} secondes`
      });
    }

    requestData.count++;

    // Ajouter les headers de rate limit
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', maxRequests - requestData.count);
    res.set('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

    next();
  };
};

/**
 * Rate limiter strict pour les routes sensibles (login, signup)
 * En développement : 100 req/15 min (pas de blocage pendant les tests)
 * En production  : 5 req/15 min (protection anti-force brute)
 */
const strictRateLimiter = process.env.NODE_ENV === 'development'
  ? rateLimiter(100, 15 * 60 * 1000, 'Trop de tentatives.')
  : rateLimiter(5, 15 * 60 * 1000, 'Trop de tentatives. Veuillez réessayer dans quelques minutes.');

/**
 * Rate limiter modéré pour les routes API standards
 * 100 requêtes par 15 minutes
 */
const apiRateLimiter = rateLimiter(
  100,
  15 * 60 * 1000,
  'Limite de requêtes atteinte. Veuillez réessayer plus tard.'
);

/**
 * Rate limiter léger pour les routes publiques
 * 1000 requêtes par 15 minutes
 */
const publicRateLimiter = rateLimiter(
  1000,
  15 * 60 * 1000,
  'Limite de requêtes atteinte.'
);

module.exports = {
  rateLimiter,
  strictRateLimiter,
  apiRateLimiter,
  publicRateLimiter
};
