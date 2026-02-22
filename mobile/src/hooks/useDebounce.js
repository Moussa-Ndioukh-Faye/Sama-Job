/**
 * Hook useDebounce
 * Retarde la mise à jour d'une valeur jusqu'à ce qu'elle arrête de changer pendant un délai donné
 * Utile pour la recherche et l'autocomplétion
 */

import { useState, useEffect } from 'react';

/**
 * @param {any} value - La valeur à debouncer
 * @param {number} delay - Le délai en millisecondes (par défaut 500ms)
 * @returns {any} La valeur debouncée
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
