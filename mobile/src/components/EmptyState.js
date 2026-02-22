/**
 * Composant EmptyState
 * Affichage d'un état vide avec icône, titre, description et action optionnelle
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Button from './Button';

const EmptyState = ({
  icon,
  iconSize = 64,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Illustration ou Icône */}
      {illustration ? (
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      ) : icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={colors.text.tertiary}
          style={styles.icon}
        />
      ) : null}

      {/* Titre */}
      {title && (
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      )}

      {/* Description */}
      {description && (
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onPress={onAction}
          style={styles.actionButton}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    marginTop: 8,
  },
});

export default EmptyState;
