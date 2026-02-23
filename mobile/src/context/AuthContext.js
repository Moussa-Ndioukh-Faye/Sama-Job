/**
 * Contexte d'Authentification
 * Gère l'état global de l'utilisateur connecté
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

// Créer le contexte
const AuthContext = createContext({});

/**
 * Provider d'authentification
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Vérifier si l'utilisateur est connecté au démarrage
   */
  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  /**
   * Vérifier si un utilisateur est déjà connecté
   */
  const checkUserLoggedIn = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (userToken && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur vérification utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inscription
   */
  const inscription = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.inscription(userData);

      if (response.success) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }

      // Réponse 2xx mais success=false (cas anormal)
      const msg = response.message || 'Erreur lors de l\'inscription';
      setError(msg);
      return { success: false, error: msg };
    } catch (error) {
      console.error('Erreur inscription:', error);
      // Erreur réseau : le serveur est inaccessible
      if (!error.response) {
        const message = 'Serveur inaccessible. Vérifiez que le backend est démarré et que l\'IP est correcte.';
        setError(message);
        return { success: false, error: message, networkError: true };
      }
      const data = error.response?.data;
      // Priorité : userMessage (spécifique) > message > fallback
      const message = data?.userMessage || data?.message || 'Erreur lors de l\'inscription';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion
   */
  const connexion = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.connexion(credentials);

      if (response.success) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }

      // Réponse 2xx mais success=false (cas anormal)
      const msg = response.message || 'Erreur lors de la connexion';
      setError(msg);
      return { success: false, error: msg };
    } catch (error) {
      console.error('Erreur connexion:', error);
      if (!error.response) {
        const message = 'Serveur inaccessible. Vérifiez que le backend est démarré et que l\'IP est correcte.';
        setError(message);
        return { success: false, error: message, networkError: true };
      }
      const data = error.response?.data;
      const message = data?.userMessage || data?.message || 'Erreur lors de la connexion';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const deconnexion = async () => {
    try {
      setLoading(true);

      // Notifier le backend
      try {
        await authAPI.deconnexion();
      } catch (error) {
        console.error('Erreur déconnexion backend:', error);
      }

      // Supprimer les données locales
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');

      setUser(null);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour le profil
   */
  const mettreAJourProfil = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.mettreAJourProfil(updates);

      if (response.success) {
        const updatedUser = { ...user, ...updates };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }

      const msg = response.message || 'Erreur lors de la mise à jour';
      setError(msg);
      return { success: false, error: msg };
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchir les données utilisateur
   */
  const rafraichirUtilisateur = async () => {
    try {
      const response = await authAPI.getProfil();
      if (response.success) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
        setUser(response.data);
      }
    } catch (error) {
      console.error('Erreur rafraîchissement utilisateur:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    inscription,
    connexion,
    deconnexion,
    mettreAJourProfil,
    rafraichirUtilisateur,
    isAuthenticated: !!user,
    isClient: user?.role === 'client',
    isPrestataire: user?.role === 'prestataire',
    isAdmin: user?.role === 'admin',
    isPrestataireValide: user?.role === 'prestataire' && user?.statut_validation === 'valide',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook pour utiliser le contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
