/**
 * Application SamaJob
 * Point d'entrée principal de l'application mobile
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Composant interne pour accéder au thème
function AppContent() {
  const { theme, isDark } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppNavigator />
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}