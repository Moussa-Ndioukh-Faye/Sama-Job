/**
 * Écran Liste Missions (Prestataire) - REFACTORISÉ
 * Liste des missions avec filtres avancés, recherche debounced et skeleton loaders
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useDebounce } from '../../hooks';
import { missionAPI } from '../../services/api';
import { SkeletonLoader, FilterModal, EmptyState, Card } from '../../components';
import Toast from 'react-native-toast-message';

const MissionsScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filtres, setFiltres] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Debounce la recherche pour éviter trop d'appels API
  const debouncedSearch = useDebounce(search, 500);

  // Charger les missions au montage et quand les filtres changent
  useEffect(() => {
    loadMissions();
  }, [filtres]);

  // Rechercher quand le terme debounced change
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      handleSearch();
    }
  }, [debouncedSearch]);

  const loadMissions = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await missionAPI.consulterMissions(filtres);
      setMissions(response.data || []);
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les missions',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!debouncedSearch.trim()) {
      loadMissions();
      return;
    }
    try {
      setLoading(true);
      const response = await missionAPI.rechercher(debouncedSearch);
      setMissions(response.data || []);
    } catch (error) {
      console.error('Erreur recherche:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Erreur lors de la recherche',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions(true);
  };

  const handleApplyFilters = (newFilters) => {
    setFiltres(newFilters);
    Toast.show({
      type: 'success',
      text1: 'Filtres appliqués',
      text2: `${Object.keys(newFilters).length} filtre(s) actif(s)`,
    });
  };

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...filtres };
    delete newFilters[filterKey];
    setFiltres(newFilters);
  };

  // Compter le nombre de filtres actifs
  const activeFiltersCount = Object.keys(filtres).length;

  // Labels pour les filtres affichés
  const getFilterLabel = (key, value) => {
    const labels = {
      budgetMin: `Min: ${value} francs CFA`,
      budgetMax: `Max: ${value} francs CFA`,
      ville: value,
      domaine: value,
      typeLocation: value === 'a_distance' ? 'Télétravail' : 'Sur site',
      datePublication:
        value === 'today'
          ? "Aujourd'hui"
          : value === 'week'
          ? 'Cette semaine'
          : 'Ce mois',
    };
    return labels[key] || value;
  };

  const renderMissionCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.missionCard,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          ...elevation.sm,
        },
      ]}
      onPress={() => navigation.navigate('DetailMission', { missionId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.missionHeader}>
        <View style={styles.clientInfo}>
          <MaterialCommunityIcons name="account" size={32} color={colors.primary} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.clientName, { color: colors.text.primary }]}>
              {item.client_prenom} {item.client_nom}
            </Text>
            <Text style={[styles.domaine, { color: colors.text.tertiary }]}>{item.domaine}</Text>
          </View>
        </View>
        <Text style={[styles.budget, { color: colors.primary }]}>{item.budget} FCFA</Text>
      </View>

      <Text style={[styles.titre, { color: colors.text.primary }]}>{item.titre}</Text>
      <Text style={[styles.description, { color: colors.text.secondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.locationVille}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.text.secondary} />
          <Text style={[styles.ville, { color: colors.text.secondary }]}>{item.ville}</Text>
        </View>
        <View style={styles.badges}>
          {item.type_location === 'a_distance' && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.primary + '20', borderRadius: borderRadius.sm },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.primary }]}>Télétravail</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barre de recherche et bouton filtres */}
      <View style={[styles.searchContainer, { padding: spacing.md }]}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Rechercher une mission..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.text.tertiary}
          />
          {search ? (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
              }}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Bouton Filtres */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              ...elevation.xs,
            },
          ]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="filter-variant"
            size={24}
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.text.primary}
          />
          {activeFiltersCount > 0 && (
            <View
              style={[
                styles.filterBadge,
                { backgroundColor: '#FFFFFF', borderRadius: borderRadius.full },
              ]}
            >
              <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Chips des filtres actifs */}
      {activeFiltersCount > 0 && (
        <View style={[styles.activeFiltersContainer, { paddingHorizontal: spacing.md }]}>
          <FlatList
            horizontal
            data={Object.entries(filtres)}
            keyExtractor={([key]) => key}
            renderItem={({ item: [key, value] }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: colors.primary + '20',
                    borderRadius: borderRadius.full,
                  },
                ]}
                onPress={() => handleRemoveFilter(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, { color: colors.primary }]}>
                  {getFilterLabel(key, value)}
                </Text>
                <MaterialCommunityIcons name="close-circle" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          />
        </View>
      )}

      {/* Liste des missions */}
      {loading ? (
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader.Rect width="100%" height={180} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : missions.length > 0 ? (
        <FlatList
          data={missions}
          renderItem={renderMissionCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.sm }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      ) : (
        <EmptyState
          icon="briefcase-search"
          title="Aucune mission trouvée"
          description={
            search || activeFiltersCount > 0
              ? 'Essayez de modifier vos critères de recherche'
              : 'Les nouvelles missions apparaîtront ici'
          }
          actionLabel={activeFiltersCount > 0 ? 'Réinitialiser les filtres' : undefined}
          onAction={activeFiltersCount > 0 ? () => setFiltres({}) : undefined}
        />
      )}

      {/* Modal des filtres */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filtres}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  missionCard: {
    padding: 16,
    marginBottom: 12,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
  },
  domaine: {
    fontSize: 12,
    marginTop: 2,
  },
  budget: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  titre: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationVille: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ville: {
    fontSize: 12,
    marginLeft: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MissionsScreen;
