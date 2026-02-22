/**
 * Middleware de Validation
 * Règles de validation pour les différentes routes
 */

const { body, validationResult } = require('express-validator');

/**
 * Validation personnalisée: au moins email OU téléphone requis
 */
const emailOrPhoneRequired = (req, res, next) => {
  const { email, telephone } = req.body;
  if (!email && !telephone) {
    return res.status(422).json({
      success: false,
      message: 'Email ou numéro de téléphone requis',
      errors: [{ msg: 'Au moins un email ou un numéro de téléphone est requis' }]
    });
  }
  next();
};

/**
 * Règles de validation pour la création de compte
 */
exports.createAccountRules = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Nom requis')
    .isLength({ min: 2, max: 50 }).withMessage('Nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom contient des caractères invalides'),

  body('prenom')
    .trim()
    .notEmpty().withMessage('Prénom requis')
    .isLength({ min: 2, max: 50 }).withMessage('Prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Prénom contient des caractères invalides'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Format email invalide')
    .normalizeEmail(),

  body('telephone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+221)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide (format: +221XXXXXXXXX ou XXXXXXXXX)'),

  body('motDePasse')
    .isLength({ min: 8 }).withMessage('Mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),

  body('role')
    .isIn(['client', 'prestataire', 'admin']).withMessage('Rôle invalide'),

  // Validations spécifiques pour le rôle client
  body('entreprise')
    .if(body('role').equals('client'))
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Nom entreprise trop long'),

  body('adresse')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Adresse trop longue'),

  body('ville')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Nom ville trop long'),

  // Validations spécifiques pour le rôle prestataire
  body('domaine')
    .if(body('role').equals('prestataire'))
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Domaine trop long'),

  body('competences')
    .if(body('role').equals('prestataire'))
    .optional()
    .isArray().withMessage('Compétences doit être un tableau'),

  body('niveauEtude')
    .if(body('role').equals('prestataire'))
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Niveau étude trop long'),

  body('universite')
    .if(body('role').equals('prestataire'))
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Nom université trop long'),

  emailOrPhoneRequired
];

/**
 * Règles de validation pour la connexion
 */
exports.loginRules = [
  // L'API accepte maintenant soit `identifier` soit `email`/`telephone`
  body('identifier')
    .optional()
    .trim(),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Format email invalide')
    .normalizeEmail(),

  body('telephone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+221)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide'),

  body('motDePasse')
    .notEmpty().withMessage('Mot de passe requis'),

  // Middleware custom: au moins `identifier` ou `email` ou `telephone` requis
  (req, res, next) => {
    const { identifier, email, telephone } = req.body;
    if (!identifier && !email && !telephone) {
      return res.status(422).json({
        success: false,
        message: 'Identifiant (email ou téléphone) requis',
        errors: [{ msg: 'Au moins un identifiant (identifier, email ou telephone) est requis' }]
      });
    }
    next();
  }
];

/**
 * Règles de validation pour la mise à jour du profil
 */
exports.updateProfileRules = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom contient des caractères invalides'),

  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Prénom contient des caractères invalides'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Format email invalide')
    .normalizeEmail(),

  body('telephone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+221)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide')
];

/**
 * Règles de validation pour le token FCM
 */
exports.fcmTokenRules = [
  body('fcmToken')
    .notEmpty().withMessage('Token FCM requis')
    .isString().withMessage('Token FCM doit être une chaîne de caractères')
];

/**
 * Middleware de validation
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorsList = errors.array();

    // Créer des messages clairs pour l'utilisateur
    let userMessage = 'Erreur de validation';
    const fieldErrors = {};

    errorsList.forEach(err => {
      const field = err.path || err.param;
      fieldErrors[field] = err.msg;
    });

    // Messages spécifiques selon les erreurs
    if (fieldErrors.identifier && fieldErrors.motDePasse) {
      userMessage = 'Veuillez remplir tous les champs';
    } else if (fieldErrors.identifier) {
      userMessage = 'Veuillez entrer votre email ou numéro de téléphone';
    } else if (fieldErrors.motDePasse) {
      // Use the actual validation error (e.g. "Minimum 8 chars" or "uppercase required")
      userMessage = fieldErrors.motDePasse;
    } else if (fieldErrors.nom || fieldErrors.prenom) {
      userMessage = 'Veuillez remplir tous les champs requis';
    } else if (fieldErrors.email || fieldErrors.telephone) {
      userMessage = fieldErrors.email || fieldErrors.telephone;
    }

    return res.status(422).json({
      success: false,
      message: userMessage,
      errors: errorsList.map(err => ({
        field: err.path || err.param,
        message: err.msg
      })),
      // Message clair pour l'application mobile
      userMessage: userMessage,
      fieldErrors: fieldErrors
    });
  }
  next();
};

module.exports = exports;
