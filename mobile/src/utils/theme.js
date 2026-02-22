/**
 * Thème SamaJob
 * Palette extraite du logo : vert (croissance), bleu marine (confiance), or (excellence)
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// === Palette SamaJob (basée sur le logo) ===
const palette = {
  green: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#66BB6A',
    400: '#43A047',
    500: '#2E7D32', // Primary — vert logo
    600: '#27692A',
    700: '#1B5E20',
    800: '#145218',
    900: '#0D3B10',
  },
  navy: {
    50: '#E8EDF4',
    100: '#C5D1E3',
    200: '#9FB3D0',
    300: '#7895BD',
    400: '#5A7EAF',
    500: '#1A3C6E', // Secondary — bleu marine logo
    600: '#163460',
    700: '#122B52',
    800: '#0E2244',
    900: '#0A1836',
  },
  gold: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#F7C948', // Accent — étoile du drapeau
    600: '#F0B429',
    700: '#E5A100',
    800: '#D69E00',
    900: '#C49000',
  },
  red: {
    400: '#EF5350',
    500: '#D32F2F', // Drapeau sénégalais
    600: '#C62828',
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.green[500],
    secondary: palette.navy[500],
    tertiary: palette.gold[500],
    error: palette.red[500],
    warning: palette.gold[600],
    success: palette.green[500],
    info: palette.navy[500],
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#64748B',
    border: '#E2E8F0',
  },
  dark: false,
};

// Constantes de couleur — light
export const colors = {
  primary: palette.green[500],
  primaryLight: palette.green[100],
  primaryDark: palette.green[700],
  secondary: palette.navy[500],
  secondaryLight: palette.navy[100],
  tertiary: palette.gold[500],
  tertiaryLight: palette.gold[100],
  accent: palette.gold[500],
  success: palette.green[400],
  error: palette.red[500],
  warning: palette.gold[600],
  info: palette.navy[400],
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  text: {
    primary: '#1A1A2E',
    secondary: '#64748B',
    tertiary: '#94A3B8',
  },
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  statusBg: {
    warning: palette.gold[50],
    success: palette.green[50],
    error: '#FFF5F5',
    info: palette.navy[50],
  },
  shadow: {
    light: 'rgba(26, 60, 110, 0.06)',
    medium: 'rgba(26, 60, 110, 0.12)',
    dark: 'rgba(26, 60, 110, 0.20)',
  },
  gradient: {
    primary: [palette.green[500], palette.green[700]],
    secondary: [palette.navy[500], palette.navy[700]],
    accent: [palette.gold[400], palette.gold[600]],
  },
};

// Espacements
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Tailles de police
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Rayons de bordure
export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

// Niveaux d'élévation
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: palette.navy[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: palette.navy[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: palette.navy[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: palette.navy[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Opacité
export const opacity = {
  disabled: 0.4,
  hover: 0.8,
  pressed: 0.6,
  overlay: 0.5,
};

// Durées d'animation (en ms)
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Typographie
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
};

// Coins arrondis fluides
export const borderRadiusFluid = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 9999,
};

// Espacements étendus
export const spacingExtended = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
};

// === Thème sombre ===
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.green[300],
    secondary: palette.navy[300],
    tertiary: palette.gold[300],
    error: palette.red[400],
    warning: palette.gold[400],
    success: palette.green[300],
    info: palette.navy[300],
    background: '#0F1118',
    surface: '#1A1D2E',
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      tertiary: '#64748B',
    },
    border: '#2D3348',
  },
  dark: true,
};

// Couleurs sombres
export const darkColors = {
  primary: palette.green[300],
  primaryLight: palette.green[800],
  primaryDark: palette.green[200],
  secondary: palette.navy[300],
  secondaryLight: palette.navy[800],
  tertiary: palette.gold[300],
  tertiaryLight: palette.gold[800],
  accent: palette.gold[300],
  success: palette.green[300],
  error: palette.red[400],
  warning: palette.gold[400],
  info: palette.navy[300],
  background: '#0F1118',
  surface: '#1A1D2E',
  surfaceVariant: '#242838',
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
  },
  onPrimary: '#0D3B10',
  onSecondary: '#0A1836',
  border: '#2D3348',
  borderLight: '#242838',
  statusBg: {
    warning: '#3D2E00',
    success: '#0D3B10',
    error: '#3E1A1A',
    info: '#0A1836',
  },
  shadow: {
    light: 'rgba(0,0,0,0.3)',
    medium: 'rgba(0,0,0,0.4)',
    dark: 'rgba(0,0,0,0.6)',
  },
  gradient: {
    primary: [palette.green[700], palette.green[900]],
    secondary: [palette.navy[700], palette.navy[900]],
    accent: [palette.gold[700], palette.gold[900]],
  },
};
