/**
 * Composant LoadingSpinner
 * Spinner de chargement avec variants (fullscreen, inline, overlay)
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LoadingSpinner = ({
  variant = 'inline', // fullscreen, inline, overlay
  size = 'large', // small, large
  text,
  color,
  style,
}) => {
  const { colors, opacity: opacityTheme } = useTheme();
  const spinnerColor = color || colors.primary;

  // Variant inline - juste le spinner
  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, style]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {text && (
          <Text style={[styles.text, { color: colors.text.secondary }]}>{text}</Text>
        )}
      </View>
    );
  }

  // Variant fullscreen - prend tout l'écran
  if (variant === 'fullscreen') {
    return (
      <View style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {text && (
          <Text style={[styles.text, { color: colors.text.secondary }]}>{text}</Text>
        )}
      </View>
    );
  }

  // Variant overlay - modal avec fond semi-transparent
  if (variant === 'overlay') {
    return (
      <Modal transparent visible animationType="fade">
        <View
          style={[
            styles.overlayContainer,
            { backgroundColor: `rgba(0, 0, 0, ${opacityTheme.overlay})` },
          ]}
        >
          <View
            style={[
              styles.overlayContent,
              {
                backgroundColor: colors.surface,
                ...styles.overlayContentShadow,
              },
            ]}
          >
            <ActivityIndicator size={size} color={spinnerColor} />
            {text && (
              <Text style={[styles.overlayText, { color: colors.text.primary }]}>
                {text}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  inlineContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  overlayContentShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingSpinner;
