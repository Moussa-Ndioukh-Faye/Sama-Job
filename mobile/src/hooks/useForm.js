/**
 * Hook useForm
 * Gestion d'état de formulaire avec validation temps réel
 */

import { useState, useCallback } from 'react';

/**
 * Valide une valeur selon les règles données
 * @param {string} value - La valeur à valider
 * @param {object} rules - Les règles de validation
 * @returns {string|null} Message d'erreur ou null si valide
 */
const validateField = (value, rules) => {
  if (!rules) return null;

  // Règle: required
  if (rules.required && (!value || value.toString().trim() === '')) {
    return rules.requiredMessage || 'Ce champ est requis';
  }

  // Si la valeur est vide et pas required, pas besoin de valider les autres règles
  if (!value || value.toString().trim() === '') {
    return null;
  }

  // Règle: email
  if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return rules.emailMessage || 'Email invalide';
  }

  // Règle: phone (format international)
  if (rules.phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(value)) {
    return rules.phoneMessage || 'Numéro de téléphone invalide';
  }

  // Règle: minLength
  if (rules.minLength && value.length < rules.minLength) {
    return rules.minLengthMessage || `Minimum ${rules.minLength} caractères requis`;
  }

  // Règle: maxLength
  if (rules.maxLength && value.length > rules.maxLength) {
    return rules.maxLengthMessage || `Maximum ${rules.maxLength} caractères autorisés`;
  }

  // Règle: pattern (regex)
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.patternMessage || 'Format invalide';
  }

  // Règle: min (nombre)
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    return rules.minMessage || `La valeur minimale est ${rules.min}`;
  }

  // Règle: max (nombre)
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    return rules.maxMessage || `La valeur maximale est ${rules.max}`;
  }

  // Règle: match (comparaison avec un autre champ)
  if (rules.match !== undefined && value !== rules.match) {
    return rules.matchMessage || 'Les valeurs ne correspondent pas';
  }

  // Règle: custom validation function
  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value);
    if (customError) return customError;
  }

  return null;
};

/**
 * Hook useForm
 * @param {object} config - Configuration du formulaire
 * @param {object} config.initialValues - Valeurs initiales des champs
 * @param {object} config.validationRules - Règles de validation par champ
 * @param {function} config.onSubmit - Fonction appelée à la soumission
 * @param {boolean} config.validateOnChange - Valider en temps réel (défaut: false)
 * @param {boolean} config.validateOnBlur - Valider au blur (défaut: true)
 * @returns {object} Méthodes et états du formulaire
 */
export const useForm = ({
  initialValues = {},
  validationRules = {},
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Gérer le changement d'un champ
   */
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Validation en temps réel si activée
    if (validateOnChange && validationRules[name]) {
      const error = validateField(value, validationRules[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    } else if (errors[name]) {
      // Effacer l'erreur si le champ change et pas de validation temps réel
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [validateOnChange, validationRules, errors]);

  /**
   * Gérer le blur d'un champ
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validation au blur si activée
    if (validateOnBlur && validationRules[name]) {
      const error = validateField(values[name], validationRules[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateOnBlur, validationRules, values]);

  /**
   * Valider tous les champs
   */
  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(values[fieldName], validationRules[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = useCallback(async () => {
    // Marquer tous les champs comme touchés
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Valider le formulaire
    const isValid = validate();

    if (isValid && onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Erreur soumission formulaire:', error);
      } finally {
        setIsSubmitting(false);
      }
    }

    return isValid;
  }, [values, validate, onSubmit]);

  /**
   * Réinitialiser le formulaire
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Définir une erreur manuellement
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  /**
   * Définir une valeur manuellement
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Vérifier si le formulaire est valide
   */
  const isValid = Object.keys(errors).every(key => !errors[key]);

  /**
   * Vérifier si le formulaire a été modifié
   */
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    resetForm,
    setFieldError,
    setFieldValue,
  };
};

export default useForm;
