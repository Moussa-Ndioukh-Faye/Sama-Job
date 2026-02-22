/**
 * Composant FilterModal
 * Modal de filtres avancés pour les missions
 * Permet de filtrer par catégorie, budget, localisation, type et date
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button, FormInput } from './';

const FilterModal = ({ visible, onClose, onApply, initialFilters }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [filters, setFilters] = useState(initialFilters || {
    budgetMin: '',
    budgetMax: '',
    ville: '',
    domaine: '',
    typeLocation: '', // 'a_distance' | 'sur_place' | ''
    datePublication: '', // 'today' | 'week' | 'month' | ''
  });

  const handleApply = () => {
    // Nettoyer les filtres vides
    const cleanedFilters = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        cleanedFilters[key] = filters[key];
      }
    });
    onApply(cleanedFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      budgetMin: '',
      budgetMax: '',
      ville: '',
      domaine: '',
      typeLocation: '',
      datePublication: '',
    });
  };

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  // Options pour les filtres
  const typeLocationOptions = [
    { value: '', label: 'Tous' },
    { value: 'a_distance', label: 'Télétravail' },
    { value: 'sur_place', label: 'Sur site' },
  ];

  const datePublicationOptions = [
    { value: '', label: 'Tout' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
  ];

  const domainesCommuns = [
    'Plomberie',
    'Électricité',
    'Maçonnerie',
    'Peinture',
    'Menuiserie',
    'Jardinage',
    'Nettoyage',
    'Informatique',
    'Mécanique',
    'Autre',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text.primary, fontSize: fontSize.xl }]}>
            Filtres
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.md }}>
          {/* Budget */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
            >
              Budget (FCFA)
            </Text>
            <View style={styles.budgetContainer}>
              <FormInput
                placeholder="Min"
                value={filters.budgetMin}
                onChangeText={(text) => handleChange('budgetMin', text)}
                keyboardType="numeric"
                style={styles.budgetInput}
              />
              <Text style={[styles.separator, { color: colors.text.secondary }]}>-</Text>
              <FormInput
                placeholder="Max"
                value={filters.budgetMax}
                onChangeText={(text) => handleChange('budgetMax', text)}
                keyboardType="numeric"
                style={styles.budgetInput}
              />
            </View>
          </View>

          {/* Localisation */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
            >
              Localisation
            </Text>
            <FormInput
              placeholder="Ville (ex: Dakar, Thiès...)"
              value={filters.ville}
              onChangeText={(text) => handleChange('ville', text)}
              leftIcon="map-marker"
            />
          </View>

          {/* Domaine */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
            >
              Domaine
            </Text>
            <View style={styles.chipsContainer}>
              {domainesCommuns.map((domaine) => (
                <TouchableOpacity
                  key={domaine}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        filters.domaine === domaine ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.full,
                      ...elevation.xs,
                    },
                  ]}
                  onPress={() =>
                    handleChange('domaine', filters.domaine === domaine ? '' : domaine)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: filters.domaine === domaine ? '#FFFFFF' : colors.text.primary,
                        fontSize: fontSize.sm,
                      },
                    ]}
                  >
                    {domaine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type de mission */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
            >
              Type de mission
            </Text>
            <View style={styles.optionsContainer}>
              {typeLocationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        filters.typeLocation === option.value ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      ...elevation.xs,
                    },
                  ]}
                  onPress={() => handleChange('typeLocation', option.value)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={
                      option.value === 'a_distance'
                        ? 'laptop'
                        : option.value === 'sur_place'
                        ? 'office-building'
                        : 'map-marker-multiple'
                    }
                    size={20}
                    color={filters.typeLocation === option.value ? '#FFFFFF' : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: filters.typeLocation === option.value ? '#FFFFFF' : colors.text.primary,
                        fontSize: fontSize.sm,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date de publication */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
            >
              Date de publication
            </Text>
            <View style={styles.optionsContainer}>
              {datePublicationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        filters.datePublication === option.value ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      ...elevation.xs,
                    },
                  ]}
                  onPress={() => handleChange('datePublication', option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          filters.datePublication === option.value ? '#FFFFFF' : colors.text.primary,
                        fontSize: fontSize.sm,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer avec boutons */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              padding: spacing.md,
            },
          ]}
        >
          <Button variant="outline" onPress={handleReset} style={styles.footerButton}>
            Réinitialiser
          </Button>
          <Button variant="primary" onPress={handleApply} style={styles.footerButton}>
            Appliquer
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  separator: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  optionText: {
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});

export default FilterModal;
