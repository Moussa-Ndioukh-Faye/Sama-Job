/**
 * Composant Card
 * Carte avec élévation cohérente, border accent et animations fluides
 */

import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const Card = ({
  children,
  onPress,
  elevation: elevationLevel = 'sm', // none, xs, sm, md, lg
  padding: paddingSize = 'md', // none, sm, md, lg
  borderAccent = false,
  borderAccentColor,
  borderAccentPosition = 'left', // left, right, top, bottom
  style,
  animated = false,
  hapticFeedback = false,
  ...props
}) => {
  const { colors, borderRadius, elevation: elevationStyles, spacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Obtenir le padding selon la taille
  const getPadding = () => {
    switch (paddingSize) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'md':
        return spacing.md;
      case 'lg':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  // Obtenir les styles de border accent
  const getBorderAccentStyles = () => {
    if (!borderAccent) return {};

    const accentColor = borderAccentColor || colors.primary;
    const accentWidth = 4;

    switch (borderAccentPosition) {
      case 'left':
        return {
          borderLeftWidth: accentWidth,
          borderLeftColor: accentColor,
        };
      case 'right':
        return {
          borderRightWidth: accentWidth,
          borderRightColor: accentColor,
        };
      case 'top':
        return {
          borderTopWidth: accentWidth,
          borderTopColor: accentColor,
        };
      case 'bottom':
        return {
          borderBottomWidth: accentWidth,
          borderBottomColor: accentColor,
        };
      default:
        return {
          borderLeftWidth: accentWidth,
          borderLeftColor: accentColor,
        };
    }
  };

  const handleCardPress = () => {
    if (onPress && animated) {
      // Animation de pression
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onPress) {
      onPress();
    }
  };

  const cardStyles = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: getPadding(),
    ...elevationStyles[elevationLevel],
    ...getBorderAccentStyles(),
  };

  const animatedStyle = animated ? {
    transform: [{ scale: scaleAnim }],
  } : {};

  // Si onPress est défini, utiliser TouchableOpacity
  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.card, cardStyles, style]}
          onPress={handleCardPress}
          activeOpacity={0.7}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Sinon, utiliser View simple
  return (
    <View style={[styles.card, cardStyles, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

export default Card;
