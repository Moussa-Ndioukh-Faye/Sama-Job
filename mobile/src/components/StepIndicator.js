/**
 * Composant StepIndicator
 * Indicateur de progression pour les formulaires multi-étapes (wizard)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const StepIndicator = ({ currentStep, totalSteps, style }) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isFuture = stepNumber > currentStep;

        return (
          <View key={stepNumber} style={styles.stepWrapper}>
            {/* Dot/Circle */}
            <View
              style={[
                styles.step,
                {
                  backgroundColor: isCompleted || isActive ? colors.primary : colors.border,
                  borderColor: isActive ? colors.primary : 'transparent',
                  borderWidth: isActive ? 2 : 0,
                },
              ]}
            >
              {isCompleted ? (
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              ) : null}
            </View>

            {/* Line entre les steps (sauf le dernier) */}
            {index < totalSteps - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor: isCompleted ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
});

export default StepIndicator;
