/**
 * Hook useApiQuery
 * Gestion des requêtes API avec états loading, error, retry
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @param {function} queryFn - Fonction qui retourne une Promise (requête API)
 * @param {object} options - Options de configuration
 * @param {boolean} options.enabled - Activer la requête automatique (défaut: true)
 * @param {boolean} options.autoRefresh - Auto-refresh périodique (défaut: false)
 * @param {number} options.refreshInterval - Intervalle de refresh en ms (défaut: 30000)
 * @param {string} options.cacheKey - Clé pour le cache (optionnel)
 * @param {function} options.onSuccess - Callback succès
 * @param {function} options.onError - Callback erreur
 * @returns {object} État et méthodes de la requête
 */
export const useApiQuery = (
  queryFn,
  {
    enabled = true,
    autoRefresh = false,
    refreshInterval = 30000,
    cacheKey = null,
    onSuccess = null,
    onError = null,
  } = {}
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);
  const refreshIntervalRef = useRef(null);

  /**
   * Exécuter la requête
   */
  const executeQuery = useCallback(async (showLoading = true) => {
    if (!queryFn) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const result = await queryFn();

      // Vérifier si le composant est toujours monté
      if (!isMountedRef.current) return;

      // Extraire les données de la réponse
      const responseData = result?.data || result;
      setData(responseData);

      // Callback succès
      if (onSuccess) {
        onSuccess(responseData);
      }

      return responseData;
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue';
      setError(errorMessage);

      // Callback erreur
      if (onError) {
        onError(err);
      }

      console.error('Erreur useApiQuery:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryFn, onSuccess, onError]);

  /**
   * Refetch - recharger les données
   */
  const refetch = useCallback(async () => {
    return await executeQuery(true);
  }, [executeQuery]);

  /**
   * Retry - réessayer après une erreur
   */
  const retry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    return await executeQuery(true);
  }, [executeQuery]);

  /**
   * Effet initial - charger les données si enabled
   */
  useEffect(() => {
    if (enabled) {
      executeQuery(true);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, retryCount]);

  /**
   * Effet auto-refresh
   */
  useEffect(() => {
    if (autoRefresh && enabled && !error) {
      refreshIntervalRef.current = setInterval(() => {
        executeQuery(false); // Refresh silencieux sans loading
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, enabled, error, refreshInterval, executeQuery]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
    isLoading: loading,
  };
};

/**
 * Hook useApiMutation
 * Pour les mutations (POST, PUT, DELETE)
 */
export const useApiMutation = (mutationFn, { onSuccess = null, onError = null } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (variables) => {
    try {
      setLoading(true);
      setError(null);

      const result = await mutationFn(variables);
      const responseData = result?.data || result;
      setData(responseData);

      if (onSuccess) {
        onSuccess(responseData);
      }

      return { success: true, data: responseData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue';
      setError(errorMessage);

      if (onError) {
        onError(err);
      }

      console.error('Erreur useApiMutation:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
    isLoading: loading,
  };
};

export default useApiQuery;
