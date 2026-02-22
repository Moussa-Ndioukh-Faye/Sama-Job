/**
 * Composant FormInput
 * Input de formulaire avec validation, focus states, password toggle et indicateurs
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const FormInput = ({
  label,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  showPasswordToggle = false,
  maxLength,
  showCounter = false,
  showStrength = false, // Afficher l'indicateur de force de mot de passe
  keyboardType = 'default',
  placeholder = '',
  autoCapitalize = 'sentences',
  editable = true,
  required = false,
  onValidate,
  onFocus,
  onBlur,
  multiline = false,
  numberOfLines = 1,
  ...props
}) => {
  const { colors, borderRadius, spacing } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (onBlur) onBlur();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Déterminer les couleurs selon l'état
  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border;

  const backgroundColor = error ? (colors.statusBg?.error || '#ffebee') : colors.surface;
  const labelColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.text.primary;

  // Calcul de la force du mot de passe
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: colors.border };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: 'Faible', color: colors.error };
    if (score <= 2) return { score, label: 'Moyen', color: colors.warning };
    if (score <= 3) return { score, label: 'Bon', color: colors.info };
    return { score, label: 'Très fort', color: colors.success };
  };

  const passwordStrength = showStrength && secureTextEntry ? getPasswordStrength(value) : null;

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, { color: labelColor }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderWidth: isFocused ? 2 : 1,
            borderRadius: borderRadius.md,
            backgroundColor,
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={leftIcon}
              size={20}
              color={colors.text.secondary}
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            { color: colors.text.primary },
            multiline && styles.multilineInput,
            !editable && { opacity: 0.6 },
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {showPasswordToggle && secureTextEntry ? (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={rightIcon}
              size={20}
              color={colors.text.secondary}
            />
          </View>
        ) : null}
      </Animated.View>

      {/* Password Strength Indicator */}
      {passwordStrength && (
        <View style={[styles.strengthContainer, { marginTop: spacing.sm }]}>
          <View style={styles.strengthBar}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor:
                      idx < passwordStrength.score
                        ? passwordStrength.color
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
            {passwordStrength.label}
          </Text>
        </View>
      )}

      {/* Helper Text, Error or Character Counter */}
      <View style={styles.footer}>
        <View style={styles.messageContainer}>
          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : helperText ? (
            <Text style={[styles.helperText, { color: colors.text.secondary }]}>
              {helperText}
            </Text>
          ) : null}
        </View>

        {showCounter && maxLength && (
          <Text style={[styles.counterText, { color: colors.text.tertiary }]}>
            {value?.length || 0}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  iconContainer: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
  },
  counterText: {
    fontSize: 12,
    marginLeft: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});

export default FormInput;
