/**
 * Contrôleur d'Authentification
 * Gère toutes les opérations d'authentification
 * Basé sur le diagramme de cas d'utilisation
 */

const jwt = require('jsonwebtoken');
const { Utilisateur, Client, Prestataire, Administrateur } = require('../models/Utilisateur');

/**
 * Créer un compte (Cas d'utilisation: Utilisateur)
 */
exports.creerUnCompte = async (req, res) => {
  try {
    const { role, ...userData } = req.body;

    let userId;

    // Créer selon le rôle
    switch (role) {
      case 'client':
        userId = await Client.creerCompte(userData);
        break;
      case 'prestataire':
        userId = await Prestataire.creerCompte(userData);
        break;
      case 'admin':
        userId = await Administrateur.creerCompte(userData);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Rôle invalide'
        });
    }

    // Récupérer l'utilisateur créé
    const user = await Utilisateur.trouverParId(userId);

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Erreur création compte:', error);

    // Gestion spécifique des erreurs de duplication
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email ou téléphone existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
      ...(process.env.NODE_ENV === 'development' ? { error: error.message } : {})
    });
  }
};

/**
 * Se connecter (Cas d'utilisation: Utilisateur)
 */
exports.seConnecter = async (req, res) => {
  try {
    const { identifier, motDePasse } = req.body;

    const user = await Utilisateur.seConnecter(identifier, motDePasse);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      ...(process.env.NODE_ENV === 'development' ? { error: error.message } : {})
    });
  }
};

/**
 * Gérer son profil (Cas d'utilisation: Utilisateur)
 */
exports.gererSonProfil = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const user = await Utilisateur.gererSonProfil(userId, updates);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: user
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      ...(process.env.NODE_ENV === 'development' ? { error: error.message } : {})
    });
  }
};

/**
 * Récupérer son profil
 */
exports.getProfilUtilisateur = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await Utilisateur.trouverParId(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      ...(process.env.NODE_ENV === 'development' ? { error: error.message } : {})
    });
  }
};

/**
 * Récupérer le profil public d'un utilisateur par ID
 */
exports.getProfilPublic = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Utilisateur.trouverParId(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne retourner que les champs publics (pas email/telephone)
    const profilPublic = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      photo: user.photo,
      role: user.role,
      date_creation: user.date_creation
    };

    res.json({
      success: true,
      data: profilPublic
    });

  } catch (error) {
    console.error('Erreur récupération profil public:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      ...(process.env.NODE_ENV === 'development' ? { error: error.message } : {})
    });
  }
};

/**
 * Mettre à jour le token FCM
 */
exports.mettreAJourFCMToken = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fcmToken } = req.body;

    await Utilisateur.mettreAJourFCMToken(userId, fcmToken);

    res.json({
      success: true,
      message: 'Token FCM mis à jour'
    });

  } catch (error) {
    console.error('Erreur mise à jour FCM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du token FCM',
      ...(process.env.NODE_ENV === 'development' ? { error: error.message } : {})
    });
  }
};