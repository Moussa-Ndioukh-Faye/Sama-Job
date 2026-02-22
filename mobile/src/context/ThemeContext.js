/**
 * ThemeContext - Gestion du thème clair/sombre
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as lightTheme, darkTheme, colors, darkColors, spacing, fontSize, borderRadius, elevation, opacity, animation, typography } from '../utils/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la préférence de thème au démarrage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Erreur chargement préférence thème:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur sauvegarde préférence thème:', error);
    }
  };

  // Construire l'objet thème complet
  const currentTheme = {
    ...(isDark ? darkTheme : lightTheme),
    colors: isDark ? darkColors : colors,
    spacing,
    fontSize,
    borderRadius,
    elevation,
    opacity,
    animation,
    dark: isDark,
  };

  const value = {
    theme: currentTheme,
    isDark,
    toggleTheme,
    isLoading,
    colors: isDark ? darkColors : colors,
    spacing,
    fontSize,
    borderRadius,
    elevation,
    opacity,
    animation,
    typography,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le thème
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
