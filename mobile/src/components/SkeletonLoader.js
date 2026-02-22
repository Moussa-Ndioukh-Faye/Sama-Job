/**
 * Composant SkeletonLoader
 * Loading animé avec effet shimmer pour améliorer la perception du temps de chargement
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Composant SkeletonRect - Rectangle avec shimmer
export const SkeletonRect = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation shimmer en boucle
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerAnimation]);

  // Interpoler les couleurs pour l'effet shimmer
  const backgroundColor = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      isDark ? (colors.border || '#2C2C2C') : (colors.border || '#E0E0E0'),
      isDark ? '#3C3C3C' : '#F5F5F5',
      isDark ? (colors.border || '#2C2C2C') : (colors.border || '#E0E0E0'),
    ],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// Composant SkeletonCircle - Cercle avec shimmer
export const SkeletonCircle = ({ size = 50, style }) => {
  return (
    <SkeletonRect
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

// Composant SkeletonText - Lignes de texte avec shimmer
export const SkeletonText = ({ lines = 3, lineHeight = 20, gap = 8, style }) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonRect
          key={index}
          width={index === lines - 1 ? '70%' : '100%'} // Dernière ligne plus courte
          height={lineHeight}
          borderRadius={4}
          style={{ marginBottom: index < lines - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
};

// Composant SkeletonLoader principal - Container pour les composants skeleton
const SkeletonLoader = ({ children, style }) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

// Exporter les sous-composants
SkeletonLoader.Rect = SkeletonRect;
SkeletonLoader.Circle = SkeletonCircle;
SkeletonLoader.Text = SkeletonText;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SkeletonLoader;
