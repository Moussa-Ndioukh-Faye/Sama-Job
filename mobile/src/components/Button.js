/**
 * Composant Button
 * Bouton multi-variantes avec haptic feedback, loading et animations
 * Variantes : primary, secondary, outline, ghost, danger, success, warning, tertiary
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const Button = ({
  variant = 'primary', // primary, secondary, outline, ghost, danger, success, warning, tertiary
  size = 'md', // sm, md, lg
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left', // left, right
  children,
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = true,
  rounded = true, // Coins arrondis
  ...props
}) => {
  const { colors, borderRadius, opacity: opacityTheme, animation: animDurations } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animation de pression
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  };

  // Styles selon variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderWidth: 0,
        };
      case 'tertiary':
        return {
          backgroundColor: colors.tertiary,
          borderWidth: 0,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderWidth: 0,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
    }
  };

  // Couleur du texte selon variant
  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') {
      return colors.primary;
    }
    if (variant === 'danger') {
      return '#FFFFFF';
    }
    return '#FFFFFF';
  };

  // Tailles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 36,
          paddingHorizontal: 12,
          fontSize: 13,
          borderRadius: borderRadius.md,
        };
      case 'md':
        return {
          height: 44,
          paddingHorizontal: 16,
          fontSize: 15,
          borderRadius: borderRadius.lg,
        };
      case 'lg':
        return {
          height: 52,
          paddingHorizontal: 24,
          fontSize: 17,
          borderRadius: borderRadius.xl,
        };
      default:
        return {
          height: 44,
          paddingHorizontal: 16,
          fontSize: 15,
          borderRadius: borderRadius.lg,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            ...variantStyles,
            borderRadius: rounded ? sizeStyles.borderRadius : 4,
            height: sizeStyles.height,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          fullWidth && styles.fullWidth,
          (disabled || loading) && { opacity: opacityTheme.disabled },
          style,
        ]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.content}>
            {/* Icon Left */}
            {icon && iconPosition === 'left' && (
              <MaterialCommunityIcons
                name={icon}
                size={sizeStyles.fontSize + 4}
                color={textColor}
                style={styles.iconLeft}
              />
            )}

            {/* Text */}
            {typeof children === 'string' ? (
              <Text
                style={[
                  styles.text,
                  {
                    color: textColor,
                    fontSize: sizeStyles.fontSize,
                    fontWeight: '600',
                  },
                  textStyle,
                ]}
              >
                {children}
              </Text>
            ) : (
              children
            )}

            {/* Icon Right */}
            {icon && iconPosition === 'right' && (
              <MaterialCommunityIcons
                name={icon}
                size={sizeStyles.fontSize + 4}
                color={textColor}
                style={styles.iconRight}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
