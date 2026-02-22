/**
 * Service API Client
 * Gère toutes les requêtes HTTP vers le backend
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.8:3000/api';

// Créer une instance axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour ajouter le token aux requêtes
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lecture token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré - déconnecter l'utilisateur
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

/**
 * Service d'Authentification
 */
export const authAPI = {
  /**
   * Créer un compte
   */
  inscription: async (userData) => {
    try {
      const response = await apiClient.post('/auth/creer-compte', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Se connecter
   */
  connexion: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/connexion', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Déconnexion
   */
  deconnexion: async () => {
    try {
      // Juste supprimer côté client, pas de requête backend
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer le profil
   */
  getProfil: async () => {
    try {
      const response = await apiClient.get('/auth/profil');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mettre à jour le profil
   */
  mettreAJourProfil: async (updates) => {
    try {
      const response = await apiClient.put('/auth/profil', updates);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mettre à jour le token FCM
   */
  mettreAJourFCMToken: async (fcmToken) => {
    try {
      const response = await apiClient.put('/auth/fcm-token', { fcmToken });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer le profil public d'un utilisateur par ID
   */
  getUtilisateur: async (utilisateurId) => {
    try {
      const response = await apiClient.get(`/auth/utilisateurs/${utilisateurId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Service Mission
 */
export const missionAPI = {
  /**
   * Consulter les missions (Prestataire)
   */
  consulterMissions: async (filtres = {}) => {
    try {
      const params = new URLSearchParams(filtres).toString();
      const response = await apiClient.get(`/prestataire/missions?${params}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Détails d'une mission
   */
  obtenirMission: async (missionId) => {
    try {
      const response = await apiClient.get(`/prestataire/missions/${missionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Rechercher des missions
   */
  rechercher: async (terme) => {
    try {
      const response = await apiClient.get(`/prestataire/missions/rechercher/${terme}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Publier une mission (Client)
   */
  publierMission: async (missionData) => {
    try {
      const response = await apiClient.post('/client/missions', missionData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lister mes missions (Client)
   */
  listerMesMissions: async (statut = null) => {
    try {
      const params = statut ? `?statut=${statut}` : '';
      const response = await apiClient.get(`/client/missions${params}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mettre à jour une mission (Client)
   */
  mettreAJourMission: async (missionId, updates) => {
    try {
      const response = await apiClient.put(`/client/missions/${missionId}`, updates);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Supprimer une mission (Client)
   */
  supprimerMission: async (missionId) => {
    try {
      const response = await apiClient.delete(`/client/missions/${missionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clôturer une mission (Client)
   */
  cloturerMission: async (missionId) => {
    try {
      const response = await apiClient.post(`/client/missions/${missionId}/cloturer`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Évaluer le prestataire (Client)
   */
  evaluerPrestataire: async (missionId, evaluationData) => {
    try {
      const response = await apiClient.post(`/client/missions/${missionId}/evaluer`, evaluationData);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Service Prestataire
 */
export const prestataireAPI = {
  /**
   * Déposer un dossier
   */
  deposerDossier: async (dossierData) => {
    try {
      const response = await apiClient.post('/prestataire/dossier', dossierData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtenir mon dossier
   */
  obtenirDossier: async () => {
    try {
      const response = await apiClient.get('/prestataire/dossier');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Signaler la réalisation d'une mission
   */
  realiserMission: async (missionId) => {
    try {
      const response = await apiClient.post(`/prestataire/missions/${missionId}/realiser`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lister les missions réalisées (historique backend)
   */
  listerMissionsRealisees: async () => {
    try {
      const response = await apiClient.get('/prestataire/missions-realisees');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Service Notification
 */
export const notificationAPI = {
  /**
   * Récupérer mes notifications
   */
  obtenirNotifications: async (page = 1) => {
    try {
      const response = await apiClient.get(`/notifications?page=${page}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marquer comme lue
   */
  marquerCommeLue: async (notificationId) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/lue`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marquer toutes comme lues
   */
  marquerToutesLues: async () => {
    try {
      const response = await apiClient.put('/notifications/lues');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Compter non lues
   */
  compterNonLues: async () => {
    try {
      const response = await apiClient.get('/notifications/non-lues/count');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Service Candidature
 */
export const candidatureAPI = {
  /**
   * Postuler à une mission
   */
  postuler: async (missionId, clientId, candidatureData) => {
    try {
      const response = await apiClient.post('/prestataire/candidatures', {
        mission_id: missionId,
        client_id: clientId,
        ...candidatureData
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Consulter mes candidatures
   */
  consulterMesCandidatures: async () => {
    try {
      const response = await apiClient.get('/prestataire/candidatures');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Consulter les candidatures (Client)
   */
  consulterCandidatures: async (missionId = null) => {
    try {
      const params = missionId ? `?missionId=${missionId}` : '';
      const response = await apiClient.get(`/client/candidatures${params}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Accepter une candidature
   */
  accepter: async (candidatureId) => {
    try {
      const response = await apiClient.post(`/client/candidatures/${candidatureId}/accepter`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Rejeter une candidature
   */
  rejeter: async (candidatureId) => {
    try {
      const response = await apiClient.post(`/client/candidatures/${candidatureId}/rejeter`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Annuler une candidature (Prestataire)
   */
  annuler: async (candidatureId) => {
    try {
      const response = await apiClient.delete(`/prestataire/candidatures/${candidatureId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Service Message
 */
export const messageAPI = {
  /**
   * Récupérer les conversations
   */
  obtenirConversations: async () => {
    try {
      const response = await apiClient.get('/messages/conversations');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Récupérer une conversation
   */
  obtenirConversation: async (utilisateurId, limit = 50, offset = 0) => {
    try {
      const response = await apiClient.get(`/messages/conversations/${utilisateurId}?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Envoyer un message
   */
  envoyer: async (messageData) => {
    try {
      const response = await apiClient.post('/messages', messageData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Marquer comme lu
   */
  marquerCommeLu: async (messageId) => {
    try {
      const response = await apiClient.put(`/messages/${messageId}/lu`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

/**
 * Service Admin
 */
export const adminAPI = {
  // Dossiers
  listerDossiers: async () => {
    const response = await apiClient.get('/admin/dossiers');
    return response;
  },
  obtenirDossier: async (id) => {
    const response = await apiClient.get(`/admin/dossiers/${id}`);
    return response;
  },
  validerDossier: async (id) => {
    const response = await apiClient.post(`/admin/dossiers/${id}/valider`);
    return response;
  },
  rejeterDossier: async (id, motif_rejet) => {
    const response = await apiClient.post(`/admin/dossiers/${id}/rejeter`, { motif_rejet });
    return response;
  },

  // Utilisateurs
  listerUtilisateurs: async (filtres = {}) => {
    const params = new URLSearchParams(filtres).toString();
    const response = await apiClient.get(`/admin/utilisateurs?${params}`);
    return response;
  },
  obtenirUtilisateur: async (id) => {
    const response = await apiClient.get(`/admin/utilisateurs/${id}`);
    return response;
  },
  suspendreUtilisateur: async (id, raison) => {
    const response = await apiClient.post(`/admin/utilisateurs/${id}/suspendre`, { raison });
    return response;
  },
  reactiverUtilisateur: async (id) => {
    const response = await apiClient.post(`/admin/utilisateurs/${id}/reactiver`);
    return response;
  },

  // Missions
  listerMissions: async (filtres = {}) => {
    const params = new URLSearchParams(filtres).toString();
    const response = await apiClient.get(`/admin/missions?${params}`);
    return response;
  },
  signalerMission: async (id, raison) => {
    const response = await apiClient.post(`/admin/missions/${id}/signaler`, { raison });
    return response;
  },
  supprimerMission: async (id) => {
    const response = await apiClient.post(`/admin/missions/${id}/supprimer`);
    return response;
  },

  // Statistiques
  obtenirStatistiques: async () => {
    const response = await apiClient.get('/admin/statistiques');
    return response;
  },
  statistiquesUtilisateurs: async () => {
    const response = await apiClient.get('/admin/statistiques/utilisateurs');
    return response;
  },
  statistiquesMissions: async () => {
    const response = await apiClient.get('/admin/statistiques/missions');
    return response;
  },
  statistiquesRevenus: async () => {
    const response = await apiClient.get('/admin/statistiques/revenus');
    return response;
  }
};

export default apiClient;
