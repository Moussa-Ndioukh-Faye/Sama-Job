/**
 * Écran d'Accueil Prestataire - REFACTORISÉ
 * Dashboard avec vraies statistiques, SkeletonLoader, pull-to-refresh et thème dynamique
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { missionAPI, candidatureAPI, prestataireAPI } from '../../services/api';
import { SkeletonLoader, EmptyState, Card } from '../../components';
import Toast from 'react-native-toast-message';

const AccueilPrestataireScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [missions, setMissions] = useState([]);
  const [missionsEnCours, setMissionsEnCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marquageEnCours, setMarquageEnCours] = useState({});
  const [stats, setStats] = useState({
    missionsCount: 0,
    candidaturesCount: 0,
    completesCount: 0,
    rating: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      // Charger toutes les données en parallèle
      const [missionsResponse, candidaturesResponse] = await Promise.all([
        missionAPI.consulterMissions({ limit: 5 }),
        candidatureAPI.consulterMesCandidatures().catch(() => ({ data: [] })),
      ]);

      setMissions(missionsResponse.data || []);

      // Calculer les stats à partir des vraies données
      const candidatures = candidaturesResponse.data || [];
      const completedCandidatures = candidatures.filter(
        (c) => c.statut === 'acceptee' && c.mission_statut === 'terminee'
      );

      // Missions actuellement en cours (acceptées + statut mission en_cours)
      const enCours = candidatures.filter(
        (c) => c.statut === 'acceptee' && c.mission_statut === 'en_cours'
      );
      setMissionsEnCours(enCours);

      setStats({
        missionsCount: missionsResponse.data?.length || 0,
        candidaturesCount: candidatures.length,
        completesCount: completedCandidatures.length,
        rating: user?.note_globale || 0,
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger le dashboard',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
  };

  const handleMarquerTerminee = (missionId, missionTitre) => {
    Alert.alert(
      'Confirmer la fin',
      `Marquer "${missionTitre}" comme terminée ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setMarquageEnCours((prev) => ({ ...prev, [missionId]: true }));
            try {
              await prestataireAPI.realiserMission(missionId);
              Toast.show({
                type: 'success',
                text1: 'Mission terminée',
                text2: 'Le client va valider la fin de mission',
              });
              await loadDashboard(true);
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: error?.response?.data?.message || 'Impossible de marquer la mission',
              });
            } finally {
              setMarquageEnCours((prev) => ({ ...prev, [missionId]: false }));
            }
          },
        },
      ]
    );
  };

  const renderMissionEnCoursCard = ({ item }) => (
    <View
      style={[
        styles.missionEnCoursCard,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderLeftColor: colors.warning || '#FF9800',
          ...elevation.sm,
        },
      ]}
    >
      <View style={styles.missionHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.missionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
            numberOfLines={1}
          >
            {item.mission_titre}
          </Text>
          <Text style={[{ color: colors.text.secondary, fontSize: fontSize.sm, marginTop: 2 }]}>
            Client : {item.client_prenom} {item.client_nom}
          </Text>
        </View>
        <Text style={[styles.missionBudget, { color: colors.primary, fontSize: fontSize.sm }]}>
          {item.budget} FCFA
        </Text>
      </View>
      <View style={[styles.missionFooter, { marginTop: spacing.sm }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: (colors.warning || '#FF9800') + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: borderRadius.sm,
          }}
        >
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.warning || '#FF9800'} />
          <Text style={{ color: colors.warning || '#FF9800', fontSize: fontSize.xs, marginLeft: 4, fontWeight: '600' }}>
            En cours
          </Text>
        </View>
        <TouchableOpacity
          style={[
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: marquageEnCours[item.mission_id] ? 0.6 : 1,
            },
          ]}
          onPress={() => handleMarquerTerminee(item.mission_id, item.mission_titre)}
          disabled={!!marquageEnCours[item.mission_id]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="check-bold" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: fontSize.sm, fontWeight: '600' }}>
            {marquageEnCours[item.mission_id] ? '...' : 'Terminée'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMissionCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.missionCard,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderLeftColor: colors.primary,
          ...elevation.sm,
        },
      ]}
      onPress={() =>
        navigation.navigate('Missions', {
          screen: 'DetailMission',
          params: { missionId: item.id },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.missionHeader}>
        <Text
          style={[styles.missionTitle, { color: colors.text.primary, fontSize: fontSize.base }]}
        >
          {item.titre}
        </Text>
        <Text style={[styles.missionBudget, { color: colors.primary, fontSize: fontSize.base }]}>
          {item.budget} FCFA
        </Text>
      </View>
      <Text
        style={[styles.missionDescription, { color: colors.text.secondary }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      <View style={styles.missionFooter}>
        <Text style={[styles.missionVille, { color: colors.text.tertiary }]}>{item.ville}</Text>
        <Text style={[styles.missionDate, { color: colors.text.tertiary }]}>
          {new Date(item.date_creation).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Skeleton loader pendant le chargement initial
  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Skeleton */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View>
            <SkeletonLoader.Rect width={150} height={24} borderRadius={4} />
            <View style={{ marginTop: 8 }}>
              <SkeletonLoader.Rect width={120} height={16} borderRadius={4} />
            </View>
          </View>
          <SkeletonLoader.Circle size={50} />
        </View>

        {/* Stats Skeleton */}
        <View style={[styles.statsContainer, { padding: spacing.md }]}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: '48%' }}>
              <SkeletonLoader.Rect width="100%" height={100} borderRadius={12} />
            </View>
          ))}
        </View>

        {/* Missions Skeleton */}
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader.Rect width="100%" height={120} borderRadius={12} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* En-tête avec infos utilisateur */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            padding: spacing.lg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { fontSize: fontSize['2xl'], color: colors.text.primary }]}>
            Bonjour {user?.prenom}!
          </Text>
          <Text style={[styles.subtitle, { fontSize: fontSize.sm, color: colors.text.secondary }]}>
            {user?.statut_validation === 'valide'
              ? '✓ Compte validé'
              : '⏳ En attente de validation'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfilPrestataire')}>
          <MaterialCommunityIcons name="account-circle" size={50} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={[styles.statsContainer, { padding: spacing.md }]}>
        <Card elevation="sm" padding="md" style={styles.statCard}>
          <MaterialCommunityIcons name="briefcase" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats.missionsCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Missions vues</Text>
        </Card>

        <Card elevation="sm" padding="md" style={styles.statCard}>
          <MaterialCommunityIcons name="send" size={24} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats.candidaturesCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Candidatures</Text>
        </Card>

        <Card elevation="sm" padding="md" style={styles.statCard}>
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.tertiary} />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats.completesCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Complétées</Text>
        </Card>

        <Card elevation="sm" padding="md" style={styles.statCard}>
          <MaterialCommunityIcons name="star" size={24} color="#FFC107" />
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {stats.rating.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Note</Text>
        </Card>
      </View>

      {/* Mission en cours */}
      {missionsEnCours.length > 0 && (
        <View style={[styles.section, { padding: spacing.md }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="clock-fast" size={20} color={colors.warning || '#FF9800'} />
              <Text
                style={[styles.sectionTitle, { fontSize: fontSize.lg, color: colors.text.primary }]}
              >
                Mission en cours
              </Text>
            </View>
          </View>
          <FlatList
            data={missionsEnCours}
            renderItem={renderMissionEnCoursCard}
            keyExtractor={(item) => item.mission_id.toString()}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Boutons rapides */}
      <View style={[styles.quickActionsContainer, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
        <TouchableOpacity
          style={[
            styles.quickAction,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
            },
          ]}
          onPress={() => navigation.navigate('Missions', { screen: 'ListeMissions' })}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="briefcase-search" size={24} color="#fff" />
          <Text style={[styles.quickActionText, { fontSize: fontSize.base }]}>
            Trouver une mission
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.quickAction,
            styles.quickActionSecondary,
            {
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
            },
          ]}
          onPress={() => navigation.navigate('Historique')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
          <Text
            style={[
              styles.quickActionText,
              styles.quickActionTextSecondary,
              { color: colors.primary, fontSize: fontSize.base },
            ]}
          >
            Mes missions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Missions récentes */}
      <View style={[styles.section, { padding: spacing.md }]}>
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: fontSize.lg, color: colors.text.primary },
            ]}
          >
            Missions récentes
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Missions', { screen: 'ListeMissions' })}
          >
            <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {missions.length > 0 ? (
          <FlatList
            data={missions}
            renderItem={renderMissionCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <EmptyState
            icon="briefcase-search"
            title="Aucune mission trouvée"
            description="Les nouvelles missions apparaîtront ici"
            actionLabel="Parcourir les missions"
            onAction={() => navigation.navigate('Missions', { screen: 'ListeMissions' })}
          />
        )}
      </View>
    </ScrollView>
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
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    // Styles dynamiques
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quickActionSecondary: {
    // Styles dynamiques
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickActionTextSecondary: {
    // Styles dynamiques
  },
  section: {
    // Styles dynamiques
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  seeAll: {
    fontWeight: '600',
  },
  missionEnCoursCard: {
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  missionCard: {
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  missionTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  missionBudget: {
    fontWeight: 'bold',
  },
  missionDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionVille: {
    fontSize: 12,
    fontWeight: '500',
  },
  missionDate: {
    fontSize: 12,
  },
});

export default AccueilPrestataireScreen;
