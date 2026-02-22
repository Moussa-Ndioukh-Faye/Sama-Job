// NOTE : Tous les montants de mission (client, prestataire, admin) doivent être affichés et saisis en Franc CFA (FCFA)
/**
 * Écrans Stub - IMPLÉMENTATION COMPLÈTE EN COURS
 * Ces écrans fournissent la navigation fonctionnelle complète
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authAPI, missionAPI, candidatureAPI, messageAPI } from '../services/api';
import { Button, Card, FormInput, SkeletonLoader, EmptyState } from '../components';
import { FadeInView, SlideInUpView } from '../components/FadeInView';
import Toast from 'react-native-toast-message';

// Écran Détail Mission (Prestataire) - MODERNISÉ
export const DetailMissionScreen = ({ route, navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation, typography } = useTheme();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPostulerModal, setShowPostulerModal] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [tarifPropose, setTarifPropose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMission = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const { missionId } = route.params;
      const response = await missionAPI.obtenirMission(missionId);
      setMission(response.data);
    } catch (err) {
      console.error('Erreur chargement mission:', err);
      setError(err.message || 'Impossible de charger la mission');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMission();
  }, [route.params.missionId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMission(true);
  };

  const handlePostuler = async () => {
    if (!motivation.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Champ requis',
        text2: 'Veuillez saisir votre motivation',
      });
      return;
    }

    if (!tarifPropose || parseFloat(tarifPropose) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Tarif invalide',
        text2: 'Veuillez saisir un tarif valide en FCFA',
      });
      return;
    }

    try {
      setSubmitting(true);
      await candidatureAPI.postuler(mission.id, mission.client_id, {
        message: motivation.trim(),
        proposition_prix: parseFloat(tarifPropose),
      });

      Toast.show({
        type: 'success',
        text1: 'Candidature envoyée',
        text2: 'Votre candidature a été soumise avec succès',
      });

      setShowPostulerModal(false);
      setMotivation('');
      setTarifPropose('');
      navigation.goBack();
    } catch (err) {
      console.error('Erreur postulation:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: err.response?.data?.message || 'Impossible de postuler',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.lg }}>
          <FadeInView>
            <SkeletonLoader.Rect width="70%" height={28} borderRadius={4} style={{ marginBottom: spacing.md }} />
            <SkeletonLoader.Rect width="40%" height={20} borderRadius={4} style={{ marginBottom: spacing.lg }} />
          </FadeInView>

          {[1,2,3,4].map((i) => (
            <SlideInUpView key={i} duration={400} delay={200 + i * 100}>
              <SkeletonLoader.Rect width="100%" height={80} borderRadius={12} style={{ marginBottom: spacing.md }} />
            </SlideInUpView>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle"
          title="Erreur de chargement"
          description={error}
          actionLabel="Réessayer"
          onAction={loadMission}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête Mission */}
        <FadeInView duration={500}>
          <Text style={[{ color: colors.text.primary, ...typography.h2 }]}>
            {mission.titre}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md }}>
            <Card elevation="sm" padding="md" style={{ flex: 1 }}>
              <Text style={{ color: colors.text.secondary, fontSize: fontSize.xs }}>Budget</Text>
              <Text style={{ color: colors.success, fontSize: fontSize.xl, fontWeight: '700', marginTop: spacing.sm }}>
                {mission.budget.toLocaleString('fr-FR')} FCFA
              </Text>
            </Card>
            {mission.type_location === 'a_distance' && (
              <Card elevation="sm" padding="md" style={{ flex: 1, backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 1 }}>
                <Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' }}>Télétravail</Text>
                <MaterialCommunityIcons name="laptop" size={24} color={colors.primary} style={{ marginTop: spacing.sm }} />
              </Card>
            )}
          </View>
        </FadeInView>

        {/* Infos Client */}
        <SlideInUpView duration={600} delay={200}>
          <Card elevation="sm" padding="lg" style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: colors.primary + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
              </View>
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: fontSize.base }}>
                  {mission.client_prenom} {mission.client_nom}
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: fontSize.sm }}>Client</Text>
              </View>
              <TouchableOpacity
                style={{ padding: spacing.md }}
                onPress={() => navigation.navigate('Chat', {
                  utilisateurId: mission.client_id,
                  utilisateurNom: `${mission.client_prenom} ${mission.client_nom}`,
                })}
              >
                <MaterialCommunityIcons name="message" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </SlideInUpView>

        {/* Description */}
        <SlideInUpView duration={600} delay={300}>
          <Card elevation="sm" padding="lg" style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <MaterialCommunityIcons name="text" size={20} color={colors.primary} />
              <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: fontSize.base, marginLeft: spacing.md }}>
                Description
              </Text>
            </View>
            <Text style={{ color: colors.text.secondary, lineHeight: 22, fontSize: fontSize.base }}>
              {mission.description}
            </Text>
          </Card>
        </SlideInUpView>

        {/* Détails */}
        <SlideInUpView duration={600} delay={400}>
          <Card elevation="sm" padding="lg" style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
              <MaterialCommunityIcons name="information" size={20} color={colors.primary} />
              <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: fontSize.base, marginLeft: spacing.md }}>
                Détails
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="briefcase" size={18} color={colors.primary} />
              <Text style={{ color: colors.text.secondary, flex: 1, marginLeft: spacing.md }}>Domaine</Text>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{mission.domaine}</Text>
            </View>

            <View style={[styles.detailRow, { marginTop: spacing.md }]}>
              <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary} />
              <Text style={{ color: colors.text.secondary, flex: 1, marginLeft: spacing.md }}>Localisation</Text>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{mission.ville}</Text>
            </View>

            <View style={[styles.detailRow, { marginTop: spacing.md }]}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} />
              <Text style={{ color: colors.text.secondary, flex: 1, marginLeft: spacing.md }}>Publié le</Text>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>
                {new Date(mission.date_creation).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </Card>
        </SlideInUpView>

        {/* Bouton Postuler */}
        <SlideInUpView duration={600} delay={500}>
          <Button
            variant="success"
            size="lg"
            onPress={() => setShowPostulerModal(true)}
            icon="send"
            iconPosition="right"
            fullWidth
          >
            Postuler à cette mission
          </Button>
        </SlideInUpView>
      </ScrollView>

      {/* Modal Postuler - MODERNISÉ */}
      <Modal
        visible={showPostulerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPostulerModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              styles.modalContent,
              { 
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                ...elevation.lg,
                marginTop: 'auto',
                maxHeight: '85%',
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: spacing.md }]}>
              <Text style={[{ color: colors.text.primary, ...typography.h3 }]}>
                Postuler à la mission
              </Text>
              <TouchableOpacity onPress={() => setShowPostulerModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
              {/* Mission info */}
              <Card elevation="sm" padding="lg" style={{ marginBottom: spacing.lg, backgroundColor: colors.primary + '08', borderColor: colors.primary, borderWidth: 1 }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: fontSize.base }}>
                  {mission?.titre}
                </Text>
                <Text style={{ color: colors.success, fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.sm }}>
                  Budget: {mission?.budget?.toLocaleString('fr-FR')} FCFA
                </Text>
              </Card>

              {/* Motivation */}
              <FormInput
                label="Votre motivation *"
                placeholder="Expliquez pourquoi vous êtes le bon candidat..."
                value={motivation}
                onChangeText={setMotivation}
                multiline
                numberOfLines={5}
                leftIcon="comment-text"
              />

              {/* Tarif proposé */}
              <View style={{ marginTop: spacing.lg }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: fontSize.base, marginBottom: spacing.md }}>
                  Tarif proposé (FCFA) *
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        color: colors.text.primary,
                        borderColor: colors.border,
                        borderRadius: borderRadius.md,
                        flex: 1,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                      },
                    ]}
                    placeholder="Ex: 50000"
                    placeholderTextColor={colors.text.tertiary}
                    value={tarifPropose}
                    onChangeText={setTarifPropose}
                    keyboardType="numeric"
                  />
                  <Text style={{ marginLeft: spacing.md, color: colors.text.secondary, fontWeight: '600', fontSize: fontSize.base }}>
                    FCFA
                  </Text>
                </View>
                <Text style={{ color: colors.text.tertiary, fontSize: fontSize.xs, marginTop: spacing.sm }}>
                  Budget demandé: {mission?.budget?.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={[styles.modalActions, { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: spacing.lg }]}>
              <Button variant="outline" onPress={() => setShowPostulerModal(false)} style={{ flex: 1, marginRight: spacing.sm }}>
                Annuler
              </Button>
              <Button
                variant="success"
                onPress={handlePostuler}
                loading={submitting}
                disabled={submitting}
                icon="send"
                iconPosition="right"
                style={{ flex: 1 }}
              >
                Envoyer
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Écran Historique (Prestataire) - Missions complétées
export const HistoriquePrestataireScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistorique = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await candidatureAPI.consulterMesCandidatures();
      // Filter only completed missions
      const completedMissions = (response.data || []).filter(
        (c) => c.statut === 'acceptee' && c.mission_statut === 'terminee'
      );
      setMissions(completedMissions);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger l\'historique',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistorique();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistorique(true);
  };

  const renderMissionCard = ({ item }) => (
    <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
      {/* Mission title and budget */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={[styles.historiqueMissionTitle, { color: colors.text.primary, flex: 1 }]}>
          {item.mission_titre}
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: colors.text.tertiary }}>Montant</Text>
          <Text style={[styles.historiqueAmount, { color: colors.primary }]}>{item.proposition_prix} FCFA</Text>
        </View>
      </View>

      {/* Client info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ fontSize: 14, color: colors.text.primary, fontWeight: '500' }}>
            {item.client_prenom} {item.client_nom}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text.tertiary }}>Client</Text>
        </View>
      </View>

      {/* Date and location */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.text.tertiary} />
          <Text style={{ fontSize: 13, color: colors.text.secondary }}>
            {new Date(item.date_fin || item.date_postulation).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.text.tertiary} />
          <Text style={{ fontSize: 13, color: colors.text.secondary }}>{item.mission_ville}</Text>
        </View>
      </View>

      {/* Rating if available */}
      {item.note_client && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            padding: 10,
            borderRadius: borderRadius.md,
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
          <Text style={{ fontSize: 14, color: colors.text.primary, marginLeft: 8, fontWeight: '600' }}>
            {item.note_client.toFixed(1)} / 5.0
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.tertiary, marginLeft: 8 }}>Note du client</Text>
        </View>
      )}

      {/* Review if available */}
      {item.commentaire_client && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Commentaire</Text>
          <Text style={{ fontSize: 14, color: colors.text.primary, lineHeight: 20, fontStyle: 'italic' }}>
            "{item.commentaire_client}"
          </Text>
        </View>
      )}

      {/* View details button */}
      <Button
        variant="ghost"
        size="sm"
        onPress={() => navigation.navigate('DetailMission', { missionId: item.mission_id })}
        icon="eye"
        iconPosition="left"
      >
        Voir les détails
      </Button>
    </Card>
  );

  // Loading skeleton
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader.Rect width="100%" height={200} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {missions.length > 0 ? (
        <FlatList
          data={missions}
          renderItem={renderMissionCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      ) : (
        <EmptyState
          icon="briefcase-search"
          title="Aucune mission réalisée"
          description="Vos missions complétées apparaîtront ici"
          actionLabel="Trouver des missions"
          onAction={() => navigation.navigate('Missions', { screen: 'ListeMissions' })}
        />
      )}
    </View>
  );
};

// Écran Profil (Prestataire) - Avec édition
export const ProfilPrestataireScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const { user, deconnexion } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    domaine: user?.domaine || '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await authAPI.mettreAJourProfil(formData);
      Toast.show({
        type: 'success',
        text1: 'Profil mis à jour',
        text2: 'Vos modifications ont été enregistrées',
      });
      setEditMode(false);
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de mettre à jour le profil',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
      domaine: user?.domaine || '',
    });
    setEditMode(false);
  };

  const handleDeconnexion = async () => {
    await deconnexion();
    Toast.show({
      type: 'success',
      text1: 'Déconnexion',
      text2: 'À bientôt !',
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Validation status banner */}
      {user?.statut_validation === 'en_attente' && (
        <View
          style={{
            backgroundColor: '#FF9800',
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <MaterialCommunityIcons name="clock-outline" size={24} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: 2 }}>
              Validation en attente
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 13 }}>
              Votre compte est en cours de vérification
            </Text>
          </View>
        </View>
      )}

      {/* Header with avatar */}
      <View
        style={{
          backgroundColor: colors.surface,
          padding: spacing.lg,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons name="account" size={60} color={colors.primary} />
        </View>
        <Text style={[styles.profilName, { color: colors.text.primary, fontSize: fontSize.xl }]}>
          {user?.prenom} {user?.nom}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <MaterialCommunityIcons name="star" size={18} color="#FFC107" />
          <Text style={{ fontSize: 16, color: colors.text.secondary, fontWeight: '600' }}>
            {user?.note_globale?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flex: 1, padding: spacing.md, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border }}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {user?.missions_completees || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Missions</Text>
        </View>
        <View style={{ flex: 1, padding: spacing.md, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border }}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {user?.note_globale?.toFixed(1) || 'N/A'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Note</Text>
        </View>
        <View style={{ flex: 1, padding: spacing.md, alignItems: 'center' }}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {user?.taux_acceptation || 0}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Acceptation</Text>
        </View>
      </View>

      <View style={{ padding: spacing.md }}>
        {/* Personal Info Section */}
        <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.lg }]}>
              Informations personnelles
            </Text>
            {!editMode && (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Nom */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Nom</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.nom}
                onChangeText={(text) => setFormData({ ...formData, nom: text })}
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.nom}</Text>
            )}
          </View>

          {/* Prénom */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Prénom</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.prenom}
                onChangeText={(text) => setFormData({ ...formData, prenom: text })}
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.prenom}</Text>
            )}
          </View>

          {/* Email */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Email</Text>
            <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.email}</Text>
          </View>

          {/* Téléphone */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Téléphone</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.telephone}
                onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.telephone}</Text>
            )}
          </View>

          {/* Domaine */}
          <View>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Domaine d'expertise</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.domaine}
                onChangeText={(text) => setFormData({ ...formData, domaine: text })}
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.domaine}</Text>
            )}
          </View>

          {/* Edit mode actions */}
          {editMode && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button variant="outline" onPress={handleCancel} style={{ flex: 1 }}>
                Annuler
              </Button>
              <Button variant="primary" onPress={handleSave} loading={loading} disabled={loading} style={{ flex: 1 }}>
                Sauvegarder
              </Button>
            </View>
          )}
        </Card>

        {/* Settings Section */}
        <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.lg, marginBottom: 16 }]}>
            Paramètres
          </Text>

          {/* Dark mode toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.text.secondary} />
              <Text style={{ fontSize: 15, color: colors.text.primary }}>Mode sombre</Text>
            </View>
            <TouchableOpacity
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDark ? colors.primary : colors.border,
                padding: 2,
                justifyContent: 'center',
              }}
              onPress={toggleTheme}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#FFFFFF',
                  alignSelf: isDark ? 'flex-end' : 'flex-start',
                }}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Actions */}
        <Card elevation="sm" padding="md">
          <Button
            variant="outline"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Fonctionnalité à venir',
                text2: 'Changement de mot de passe',
              });
            }}
            icon="lock-reset"
            iconPosition="left"
            style={{ marginBottom: 8 }}
          >
            Changer le mot de passe
          </Button>

          <Button
            variant="outline"
            onPress={handleDeconnexion}
            icon="logout"
            iconPosition="left"
            style={{ borderColor: colors.error }}
          >
            <Text style={{ color: colors.error }}>Se déconnecter</Text>
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
};

// Écran Accueil (Client) - Dashboard
export const AccueilClientScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    missionsActives: 0,
    candidaturesRecues: 0,
    missionsCompletes: 0,
    depensesTotales: 0,
  });

  const loadDashboard = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      // Charger missions et candidatures en parallèle
      const [missionsResponse, candidaturesResponse] = await Promise.all([
        missionAPI.listerMesMissions(),
        candidatureAPI.consulterCandidatures().catch(() => ({ data: [] })),
      ]);

      const allMissions = missionsResponse.data || [];
      const candidatures = candidaturesResponse.data || [];

      // Missions récentes (3 dernières)
      setMissions(allMissions.slice(0, 3));

      // Calculer stats
      const actives = allMissions.filter((m) => m.statut === 'ouverte' || m.statut === 'en_cours');
      const completes = allMissions.filter((m) => m.statut === 'terminee');
      const depenses = completes.reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0);

      setStats({
        missionsActives: actives.length,
        candidaturesRecues: candidatures.length,
        missionsCompletes: completes.length,
        depensesTotales: depenses,
      });
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
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

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
  };

  const renderMissionCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dashboardMissionCard,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderLeftColor: colors.primary,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...elevation.sm,
        },
      ]}
      onPress={() => navigation.navigate('MesMissions')}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={[styles.dashboardMissionTitle, { color: colors.text.primary, flex: 1 }]}>{item.titre}</Text>
        <Text style={[styles.dashboardMissionBudget, { color: colors.primary }]}>{item.budget} FCFA</Text>
      </View>
      <Text style={[styles.dashboardMissionDesc, { color: colors.text.secondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name="map-marker" size={14} color={colors.text.tertiary} />
          <Text style={{ fontSize: 12, color: colors.text.tertiary }}>{item.ville}</Text>
        </View>
        {item.nombre_candidatures > 0 && (
          <View
            style={{
              backgroundColor: colors.primary + '20',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: borderRadius.sm,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
              {item.nombre_candidatures} candidature{item.nombre_candidatures > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Loading skeleton
  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Skeleton */}
        <View
          style={[
            styles.dashboardHeader,
            { backgroundColor: colors.surface, borderBottomColor: colors.border, padding: spacing.lg },
          ]}
        >
          <View>
            <SkeletonLoader.Rect width={150} height={28} borderRadius={4} />
            <View style={{ marginTop: 8 }}>
              <SkeletonLoader.Rect width={120} height={16} borderRadius={4} />
            </View>
          </View>
          <SkeletonLoader.Circle size={50} />
        </View>

        {/* Stats Skeleton */}
        <View style={{ padding: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: '48%' }}>
              <SkeletonLoader.Rect width="100%" height={100} borderRadius={12} />
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
      {/* Header */}
      <View
        style={[
          styles.dashboardHeader,
          {
            backgroundColor: colors.surface,
            padding: spacing.lg,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <View>
          <Text style={[styles.dashboardGreeting, { fontSize: fontSize['2xl'], color: colors.text.primary }]}>
            Bonjour {user?.prenom} !
          </Text>
          <Text style={[styles.dashboardSubtitle, { fontSize: fontSize.sm, color: colors.text.secondary }]}>
            Gérez vos missions et candidatures
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfilClient')}>
          <MaterialCommunityIcons name="account-circle" size={50} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={{ padding: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Card elevation="sm" padding="md" style={{ width: '48%', alignItems: 'center' }}>
          <MaterialCommunityIcons name="briefcase-clock" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text.primary, marginTop: 8 }]}>
            {stats.missionsActives}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Actives</Text>
        </Card>

        <Card elevation="sm" padding="md" style={{ width: '48%', alignItems: 'center' }}>
          <MaterialCommunityIcons name="account-multiple" size={24} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.text.primary, marginTop: 8 }]}>
            {stats.candidaturesRecues}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Candidatures</Text>
        </Card>

        <Card elevation="sm" padding="md" style={{ width: '48%', alignItems: 'center' }}>
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.tertiary} />
          <Text style={[styles.statValue, { color: colors.text.primary, marginTop: 8 }]}>
            {stats.missionsCompletes}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Complétées</Text>
        </Card>

        <Card elevation="sm" padding="md" style={{ width: '48%', alignItems: 'center' }}>
          <MaterialCommunityIcons name="cash" size={24} color="#FFC107" />
          <Text style={[styles.statValue, { color: colors.text.primary, marginTop: 8 }]}>
            {stats.depensesTotales.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Dépenses (FCFA)</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 12 }}>
        <Button
          variant="primary"
          size="lg"
          onPress={() => navigation.navigate('CreerMission')}
          icon="plus-circle"
          iconPosition="left"
          fullWidth
        >
          Créer une nouvelle mission
        </Button>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('MesMissions')}
            icon="briefcase"
            iconPosition="left"
            style={{ flex: 1 }}
          >
            Mes missions
          </Button>

          <Button
            variant="outline"
            onPress={() => navigation.navigate('Candidatures')}
            icon="account-group"
            iconPosition="left"
            style={{ flex: 1 }}
          >
            Candidatures
          </Button>
        </View>
      </View>

      {/* Missions récentes */}
      <View style={{ padding: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { fontSize: fontSize.lg, color: colors.text.primary }]}>
            Missions récentes
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MesMissions')}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Voir tout</Text>
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
            icon="briefcase-plus"
            title="Aucune mission"
            description="Créez votre première mission pour commencer"
            actionLabel="Créer une mission"
            onAction={() => navigation.navigate('CreerMission')}
          />
        )}
      </View>
    </ScrollView>
  );
};

// Écran Créer Mission (Client) - Wizard 4 étapes
export const CreerMissionScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Domaines disponibles
  const DOMAINES = [
    'Plomberie',
    'Électricité',
    'Menuiserie',
    'Peinture',
    'Jardinage',
    'Nettoyage',
    'Déménagement',
    'Informatique',
    'Mécanique',
    'Autres',
  ];

  // Villes du Sénégal
  const VILLES = [
    'Dakar',
    'Thiès',
    'Saint-Louis',
    'Kaolack',
    'Ziguinchor',
    'Louga',
    'Diourbel',
    'Tambacounda',
    'Fatick',
    'Kolda',
  ];

  const [formData, setFormData] = useState({
    titre: '',
    domaine: '',
    description: '',
    competences: [],
    budget: '',
    ville: '',
    lieu: '',
    typeLocation: 'sur_place',
    dateLimite: '',
    duree: '',
  });

  const [errors, setErrors] = useState({});
  const [competenceInput, setCompetenceInput] = useState('');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.titre.trim()) newErrors.titre = 'Titre requis';
        if (!formData.domaine) newErrors.domaine = 'Domaine requis';
        break;
      case 2:
        if (!formData.description.trim()) newErrors.description = 'Description requise';
        if (formData.description.trim().length < 20) newErrors.description = 'Minimum 20 caractères';
        break;
      case 3:
        if (!formData.budget || parseFloat(formData.budget) <= 0) newErrors.budget = 'Budget invalide';
        if (!formData.ville) newErrors.ville = 'Ville requise';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Champs invalides',
        text2: 'Veuillez remplir tous les champs correctement',
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddCompetence = () => {
    if (competenceInput.trim() && !formData.competences.includes(competenceInput.trim())) {
      handleChange('competences', [...formData.competences, competenceInput.trim()]);
      setCompetenceInput('');
    }
  };

  const handleRemoveCompetence = (competence) => {
    handleChange(
      'competences',
      formData.competences.filter((c) => c !== competence)
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const missionData = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        domaine: formData.domaine,
        budget: parseFloat(formData.budget),
        ville: formData.ville,
        lieu: formData.lieu.trim() || formData.ville,
        type_location: formData.typeLocation,
        competencesRequises: formData.competences,
        date_limite: formData.dateLimite || null,
        duree: formData.duree || null,
      };

      await missionAPI.publierMission(missionData);

      Toast.show({
        type: 'success',
        text1: 'Mission créée',
        text2: 'Votre mission a été publiée avec succès',
      });

      navigation.goBack();
    } catch (err) {
      console.error('Erreur création mission:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: err.response?.data?.message || 'Impossible de créer la mission',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Titre + Domaine
  const renderStep1 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Informations de base</Text>

      {/* Titre */}
      <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
        Titre de la mission <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text.primary,
            borderColor: errors.titre ? colors.error : colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        placeholder="Ex: Réparation de plomberie"
        placeholderTextColor={colors.text.tertiary}
        value={formData.titre}
        onChangeText={(text) => handleChange('titre', text)}
      />
      {errors.titre && <Text style={[styles.errorText, { color: colors.error }]}>{errors.titre}</Text>}

      {/* Domaine - Grid de chips */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>
        Domaine <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <View style={styles.chipGrid}>
        {DOMAINES.map((domaine) => (
          <TouchableOpacity
            key={domaine}
            style={[
              styles.chip,
              {
                backgroundColor: formData.domaine === domaine ? colors.primary : colors.background,
                borderColor: formData.domaine === domaine ? colors.primary : colors.border,
                borderRadius: borderRadius.full,
              },
            ]}
            onPress={() => handleChange('domaine', domaine)}
          >
            <Text
              style={[
                styles.chipText,
                { color: formData.domaine === domaine ? '#FFFFFF' : colors.text.primary },
              ]}
            >
              {domaine}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.domaine && <Text style={[styles.errorText, { color: colors.error }]}>{errors.domaine}</Text>}
    </View>
  );

  // Step 2: Description + Compétences
  const renderStep2 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Détails de la mission</Text>

      {/* Description */}
      <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
        Description détaillée <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <TextInput
        style={[
          styles.textArea,
          {
            backgroundColor: colors.background,
            color: colors.text.primary,
            borderColor: errors.description ? colors.error : colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        placeholder="Décrivez en détail les travaux à réaliser..."
        placeholderTextColor={colors.text.tertiary}
        value={formData.description}
        onChangeText={(text) => handleChange('description', text)}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />
      <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
        {formData.description.length} / 20 caractères minimum
      </Text>
      {errors.description && <Text style={[styles.errorText, { color: colors.error }]}>{errors.description}</Text>}

      {/* Compétences requises */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>
        Compétences requises (optionnel)
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.text.primary,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              flex: 1,
            },
          ]}
          placeholder="Ex: Soudure"
          placeholderTextColor={colors.text.tertiary}
          value={competenceInput}
          onChangeText={setCompetenceInput}
          onSubmitEditing={handleAddCompetence}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: colors.primary, borderRadius: borderRadius.md, ...elevation.xs },
          ]}
          onPress={handleAddCompetence}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Liste des compétences */}
      {formData.competences.length > 0 && (
        <View style={[styles.competencesList, { marginTop: 12 }]}>
          {formData.competences.map((comp) => (
            <View
              key={comp}
              style={[
                styles.competenceChip,
                { backgroundColor: colors.primary + '20', borderRadius: borderRadius.full },
              ]}
            >
              <Text style={[styles.competenceText, { color: colors.primary }]}>{comp}</Text>
              <TouchableOpacity onPress={() => handleRemoveCompetence(comp)}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Step 3: Budget + Localisation + Type
  const renderStep3 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Budget et localisation</Text>

      {/* Budget */}
      <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
        Budget (FCFA) <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text.primary,
            borderColor: errors.budget ? colors.error : colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        placeholder="Ex: 15000"
        placeholderTextColor={colors.text.tertiary}
        value={formData.budget}
        onChangeText={(text) => handleChange('budget', text)}
        keyboardType="numeric"
      />
      {errors.budget && <Text style={[styles.errorText, { color: colors.error }]}>{errors.budget}</Text>}

      {/* Ville */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>
        Ville <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <View style={styles.chipGrid}>
        {VILLES.map((ville) => (
          <TouchableOpacity
            key={ville}
            style={[
              styles.chip,
              {
                backgroundColor: formData.ville === ville ? colors.primary : colors.background,
                borderColor: formData.ville === ville ? colors.primary : colors.border,
                borderRadius: borderRadius.full,
              },
            ]}
            onPress={() => handleChange('ville', ville)}
          >
            <Text
              style={[styles.chipText, { color: formData.ville === ville ? '#FFFFFF' : colors.text.primary }]}
            >
              {ville}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.ville && <Text style={[styles.errorText, { color: colors.error }]}>{errors.ville}</Text>}

      {/* Lieu précis */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>
        Adresse / Lieu précis
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text.primary,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        placeholder="Ex: Quartier Almadies, Dakar"
        placeholderTextColor={colors.text.tertiary}
        value={formData.lieu}
        onChangeText={(text) => handleChange('lieu', text)}
      />

      {/* Date limite */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>
        Date limite de candidature
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text.primary,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor={colors.text.tertiary}
        value={formData.dateLimite}
        onChangeText={(text) => handleChange('dateLimite', text)}
      />

      {/* Durée */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>
        Durée estimée
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text.primary,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        placeholder="Ex: 3 jours, 1 semaine"
        placeholderTextColor={colors.text.tertiary}
        value={formData.duree}
        onChangeText={(text) => handleChange('duree', text)}
      />

      {/* Type de mission */}
      <Text style={[styles.inputLabel, { color: colors.text.primary, marginTop: 16 }]}>Type de mission</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              backgroundColor: formData.typeLocation === 'sur_place' ? colors.primary : colors.background,
              borderColor: formData.typeLocation === 'sur_place' ? colors.primary : colors.border,
              borderRadius: borderRadius.md,
              flex: 1,
            },
          ]}
          onPress={() => handleChange('typeLocation', 'sur_place')}
        >
          <MaterialCommunityIcons
            name="office-building"
            size={24}
            color={formData.typeLocation === 'sur_place' ? '#FFFFFF' : colors.text.secondary}
          />
          <Text
            style={[
              styles.typeButtonText,
              { color: formData.typeLocation === 'sur_place' ? '#FFFFFF' : colors.text.primary },
            ]}
          >
            Sur site
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              backgroundColor: formData.typeLocation === 'a_distance' ? colors.primary : colors.background,
              borderColor: formData.typeLocation === 'a_distance' ? colors.primary : colors.border,
              borderRadius: borderRadius.md,
              flex: 1,
            },
          ]}
          onPress={() => handleChange('typeLocation', 'a_distance')}
        >
          <MaterialCommunityIcons
            name="home"
            size={24}
            color={formData.typeLocation === 'a_distance' ? '#FFFFFF' : colors.text.secondary}
          />
          <Text
            style={[
              styles.typeButtonText,
              { color: formData.typeLocation === 'a_distance' ? '#FFFFFF' : colors.text.primary },
            ]}
          >
            Télétravail
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 4: Récapitulatif
  const renderStep4 = () => (
    <View>
      <Text style={[styles.stepTitle, { color: colors.text.primary }]}>Récapitulatif</Text>

      <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
        <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Titre</Text>
        <Text style={[styles.recapValue, { color: colors.text.primary }]}>{formData.titre}</Text>
      </Card>

      <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
        <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Domaine</Text>
        <Text style={[styles.recapValue, { color: colors.text.primary }]}>{formData.domaine}</Text>
      </Card>

      <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
        <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Description</Text>
        <Text style={[styles.recapValue, { color: colors.text.primary }]}>{formData.description}</Text>
      </Card>

      {formData.competences.length > 0 && (
        <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
          <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Compétences</Text>
          <View style={[styles.competencesList, { marginTop: 8 }]}>
            {formData.competences.map((comp) => (
              <View
                key={comp}
                style={[
                  styles.competenceChip,
                  { backgroundColor: colors.primary + '20', borderRadius: borderRadius.full },
                ]}
              >
                <Text style={[styles.competenceText, { color: colors.primary }]}>{comp}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
        <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Budget</Text>
        <Text style={[styles.recapValue, { color: colors.primary, fontWeight: 'bold' }]}>
          {Number(formData.budget).toLocaleString()} FCFA
        </Text>
      </Card>

      <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
        <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Localisation</Text>
        <Text style={[styles.recapValue, { color: colors.text.primary }]}>
          {formData.ville}{formData.lieu ? ` - ${formData.lieu}` : ''} • {formData.typeLocation === 'a_distance' ? 'Télétravail' : 'Sur site'}
        </Text>
      </Card>

      {formData.dateLimite ? (
        <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
          <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Date limite</Text>
          <Text style={[styles.recapValue, { color: colors.text.primary }]}>{formData.dateLimite}</Text>
        </Card>
      ) : null}

      {formData.duree ? (
        <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
          <Text style={[styles.recapLabel, { color: colors.text.tertiary }]}>Durée estimée</Text>
          <Text style={[styles.recapValue, { color: colors.text.primary }]}>{formData.duree}</Text>
        </Card>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.wizardTitle, { color: colors.primary, fontSize: fontSize['2xl'] }]}>
            Créer une Mission
          </Text>
          <Text style={[styles.wizardSubtitle, { color: colors.text.secondary }]}>
            Complétez les 4 étapes pour publier votre mission
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: step <= currentStep ? colors.primary : colors.background,
                      borderColor: step <= currentStep ? colors.primary : colors.border,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Text style={{ color: step <= currentStep ? '#FFFFFF' : colors.text.tertiary, fontWeight: '600' }}>
                    {step}
                  </Text>
                </View>
                {step < 4 && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: step < currentStep ? colors.primary : colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Form content */}
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...elevation.sm },
          ]}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation buttons */}
          <View style={[styles.navigationButtons, { marginTop: spacing.lg }]}>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onPress={handlePrevious}
                icon="arrow-left"
                iconPosition="left"
                style={{ flex: 1 }}
              >
                Précédent
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                variant="primary"
                onPress={handleNext}
                icon="arrow-right"
                iconPosition="right"
                style={[{ flex: 1 }, currentStep === 1 && { width: '100%' }]}
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="primary"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                icon="check"
                iconPosition="right"
                style={{ flex: 1 }}
              >
                Publier la mission
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Écran Mes Missions (Client) - Avec tabs
export const MesMissionsScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [activeTab, setActiveTab] = useState('active'); // 'active' ou 'completed'
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMissions = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await missionAPI.listerMesMissions();
      setMissions(response.data || []);
    } catch (err) {
      console.error('Erreur chargement missions:', err);
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

  useEffect(() => {
    loadMissions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions(true);
  };

  const handleDeleteMission = (missionId, missionTitre) => {
    Alert.alert(
      'Supprimer la mission',
      `Supprimer "${missionTitre}" ? Cette action est irréversible et toutes les candidatures seront supprimées.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await missionAPI.supprimerMission(missionId);
              Toast.show({
                type: 'success',
                text1: 'Mission supprimée',
                text2: 'La mission a été supprimée avec succès',
              });
              loadMissions();
            } catch (err) {
              console.error('Erreur suppression mission:', err);
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: err?.response?.data?.message || 'Impossible de supprimer la mission',
              });
            }
          },
        },
      ]
    );
  };

  const handleCloturerMission = async (missionId) => {
    Alert.alert(
      'Clôturer la mission',
      'Confirmez-vous la fin de cette mission ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          onPress: async () => {
            try {
              await missionAPI.cloturerMission(missionId);
              Toast.show({ type: 'success', text1: 'Mission clôturée', text2: 'Vous pouvez maintenant évaluer le prestataire' });
              loadMissions();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Erreur', text2: err.response?.data?.message || 'Impossible de clôturer' });
            }
          },
        },
      ]
    );
  };

  const filteredMissions = missions.filter((m) => {
    if (activeTab === 'active') {
      return m.statut === 'ouverte' || m.statut === 'en_cours' || !m.statut;
    } else {
      return m.statut === 'terminee';
    }
  });

  const renderMissionCard = ({ item }) => (
    <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={[styles.missionCardTitle, { color: colors.text.primary, flex: 1 }]}>{item.titre}</Text>
        <Text style={[styles.missionCardBudget, { color: colors.primary }]}>{Number(item.budget).toLocaleString()} FCFA</Text>
      </View>

      {/* Description */}
      <Text style={[styles.missionCardDesc, { color: colors.text.secondary }]} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Footer info */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.text.tertiary} />
            <Text style={{ fontSize: 12, color: colors.text.tertiary }}>{item.ville}</Text>
          </View>

          {item.nombre_candidatures > 0 && (
            <View
              style={{
                backgroundColor: colors.secondary + '20',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: borderRadius.full,
              }}
            >
              <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '600' }}>
                {item.nombre_candidatures} candidature{item.nombre_candidatures > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Badge statut */}
        <View
          style={{
            backgroundColor:
              activeTab === 'active' ? colors.primary + '20' : colors.tertiary + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              color: activeTab === 'active' ? colors.primary : colors.tertiary,
              fontSize: 11,
              fontWeight: '600',
            }}
          >
            {activeTab === 'active' ? 'Active' : 'Complétée'}
          </Text>
        </View>
      </View>

      {/* Actions - missions actives */}
      {activeTab === 'active' && (
        <View style={{ gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Candidatures', { missionId: item.id })}
              icon="account-group"
              style={{ flex: 1 }}
            >
              Candidatures
            </Button>
            {item.statut === 'ouverte' && (
              <TouchableOpacity
                style={{
                  padding: 8,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => handleDeleteMission(item.id, item.titre)}
              >
                <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
          {item.statut === 'en_cours' && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#4CAF50',
                paddingVertical: 10,
                borderRadius: borderRadius.md,
                gap: 6,
              }}
              onPress={() => handleCloturerMission(item.id)}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Valider la fin de mission</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {/* Actions - missions terminées */}
      {activeTab === 'completed' && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFC107',
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
            onPress={() => navigation.navigate('Evaluation', { missionId: item.id, prestataireName: item.prestataire_nom || 'Prestataire' })}
          >
            <MaterialCommunityIcons name="star" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Noter le prestataire</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  // Loading skeleton
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tabs skeleton */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            padding: spacing.sm,
            gap: 8,
          }}
        >
          <SkeletonLoader.Rect width="48%" height={40} borderRadius={8} />
          <SkeletonLoader.Rect width="48%" height={40} borderRadius={8} />
        </View>

        <View style={{ padding: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader.Rect width="100%" height={150} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          padding: spacing.sm,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor: activeTab === 'active' ? colors.primary : 'transparent',
              borderRadius: borderRadius.md,
              flex: 1,
            },
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabButtonText,
              {
                color: activeTab === 'active' ? '#FFFFFF' : colors.text.secondary,
              },
            ]}
          >
            Actives
          </Text>
          {missions.filter((m) => m.statut === 'ouverte' || m.statut === 'en_cours' || !m.statut).length > 0 && (
            <View
              style={{
                backgroundColor: activeTab === 'active' ? 'rgba(255,255,255,0.3)' : colors.primary + '20',
                borderRadius: borderRadius.full,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'active' ? '#FFFFFF' : colors.primary,
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              >
                {missions.filter((m) => m.statut === 'ouverte' || m.statut === 'en_cours' || !m.statut).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            {
              backgroundColor: activeTab === 'completed' ? colors.primary : 'transparent',
              borderRadius: borderRadius.md,
              flex: 1,
            },
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabButtonText,
              {
                color: activeTab === 'completed' ? '#FFFFFF' : colors.text.secondary,
              },
            ]}
          >
            Complétées
          </Text>
          {missions.filter((m) => m.statut === 'terminee').length > 0 && (
            <View
              style={{
                backgroundColor: activeTab === 'completed' ? 'rgba(255,255,255,0.3)' : colors.tertiary + '20',
                borderRadius: borderRadius.full,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'completed' ? '#FFFFFF' : colors.tertiary,
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              >
                {missions.filter((m) => m.statut === 'terminee').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Missions list */}
      {filteredMissions.length > 0 ? (
        <FlatList
          data={filteredMissions}
          renderItem={renderMissionCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      ) : (
        <EmptyState
          icon="briefcase-search"
          title={`Aucune mission ${activeTab === 'active' ? 'active' : 'complétée'}`}
          description={
            activeTab === 'active'
              ? 'Créez une nouvelle mission pour commencer'
              : 'Les missions terminées apparaîtront ici'
          }
          actionLabel={activeTab === 'active' ? 'Créer une mission' : undefined}
          onAction={activeTab === 'active' ? () => navigation.navigate('CreerMission') : undefined}
        />
      )}
    </View>
  );
};

// Écran Candidatures (Client) - Gestion des candidatures
export const CandidaturesScreen = ({ navigation, route }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [candidatures, setCandidatures] = useState([]);
  const [filteredCandidatures, setFilteredCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMission, setSelectedMission] = useState(route.params?.missionId || null);
  const [selectedStatut, setSelectedStatut] = useState('all'); // all, en_attente, acceptee, refusee
  const [expandedMotivation, setExpandedMotivation] = useState({});

  const loadCandidatures = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await candidatureAPI.consulterCandidatures(selectedMission);
      setCandidatures(response.data || []);
      filterCandidatures(response.data || [], selectedStatut);
    } catch (err) {
      console.error('Erreur chargement candidatures:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les candidatures',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCandidatures();
  }, [selectedMission]);

  useEffect(() => {
    filterCandidatures(candidatures, selectedStatut);
  }, [selectedStatut]);

  const filterCandidatures = (data, statut) => {
    if (statut === 'all') {
      setFilteredCandidatures(data);
    } else {
      setFilteredCandidatures(data.filter((c) => c.statut === statut));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCandidatures(true);
  };

  const handleAccept = async (candidatureId) => {
    try {
      await candidatureAPI.accepter(candidatureId);
      Toast.show({
        type: 'success',
        text1: 'Candidature acceptée',
        text2: 'Le prestataire a été notifié',
      });
      loadCandidatures();
    } catch (err) {
      console.error('Erreur acceptation:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'accepter la candidature',
      });
    }
  };

  const handleReject = async (candidatureId) => {
    try {
      await candidatureAPI.rejeter(candidatureId);
      Toast.show({
        type: 'success',
        text1: 'Candidature rejetée',
        text2: 'Le prestataire a été notifié',
      });
      loadCandidatures();
    } catch (err) {
      console.error('Erreur rejet:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de rejeter la candidature',
      });
    }
  };

  const toggleMotivation = (id) => {
    setExpandedMotivation({ ...expandedMotivation, [id]: !expandedMotivation[id] });
  };

  const renderCandidatureCard = ({ item }) => {
    const isExpanded = expandedMotivation[item.id];
    const statutColor = {
      en_attente: colors.secondary,
      acceptee: colors.tertiary,
      refusee: colors.error,
    }[item.statut] || colors.text.tertiary;

    return (
      <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
        {/* Header avec prestataire */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.candidatureName, { color: colors.text.primary }]}>
              {item.prenom} {item.nom}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
              <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                {item.note_globale?.toFixed(1) || 'N/A'}
              </Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: statutColor + '20',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: borderRadius.sm,
            }}
          >
            <Text style={{ color: statutColor, fontSize: 11, fontWeight: '600' }}>
              {item.statut === 'en_attente' ? 'En attente' : item.statut === 'acceptee' ? 'Acceptée' : 'Rejetée'}
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View
          style={{
            backgroundColor: colors.background,
            padding: 10,
            borderRadius: borderRadius.md,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 2 }}>Mission</Text>
          <Text style={{ fontSize: 14, color: colors.text.primary, fontWeight: '500' }}>
            {item.mission_titre}
          </Text>
        </View>

        {/* Tarif proposé */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialCommunityIcons name="cash" size={18} color={colors.primary} />
          <Text style={{ fontSize: 14, color: colors.text.secondary, marginLeft: 8 }}>
            Tarif proposé:{' '}
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{item.proposition_prix} FCFA</Text>
          </Text>
        </View>

        {/* Motivation */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Motivation</Text>
          <Text
            style={{ fontSize: 14, color: colors.text.primary, lineHeight: 20 }}
            numberOfLines={isExpanded ? undefined : 3}
          >
            {item.message}
          </Text>
          {item.message && item.message.length > 100 && (
            <TouchableOpacity onPress={() => toggleMotivation(item.id)} style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '500' }}>
                {isExpanded ? 'Voir moins' : 'Voir plus'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date candidature */}
        <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 12 }}>
          Candidature le {new Date(item.date_postulation).toLocaleDateString('fr-FR')}
        </Text>

        {/* Actions */}
        {item.statut === 'en_attente' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleAccept(item.id)}
              icon="check"
              iconPosition="left"
              style={{ flex: 1 }}
            >
              Accepter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleReject(item.id)}
              icon="close"
              iconPosition="left"
              style={{ flex: 1 }}
            >
              Rejeter
            </Button>
          </View>
        )}

        {/* Actions secondaires */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Profil', { utilisateurId: item.prestataire_id })}
            icon="account"
            style={{ flex: 1 }}
          >
            Voir profil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={() =>
              navigation.navigate('Chat', {
                utilisateurId: item.prestataire_id,
                nom: `${item.prestataire_prenom} ${item.prestataire_nom}`,
              })
            }
            icon="message"
            style={{ flex: 1 }}
          >
            Message
          </Button>
        </View>
      </Card>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader.Rect width="100%" height={220} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filtres */}
      <View
        style={{
          backgroundColor: colors.surface,
          padding: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'en_attente', 'acceptee', 'refusee'].map((statut) => (
            <TouchableOpacity
              key={statut}
              style={[
                styles.filterChipCandidature,
                {
                  backgroundColor: selectedStatut === statut ? colors.primary : colors.background,
                  borderColor: selectedStatut === statut ? colors.primary : colors.border,
                  borderRadius: borderRadius.full,
                },
              ]}
              onPress={() => setSelectedStatut(statut)}
            >
              <Text
                style={{
                  color: selectedStatut === statut ? '#FFFFFF' : colors.text.secondary,
                  fontSize: 13,
                  fontWeight: '500',
                }}
              >
                {statut === 'all'
                  ? 'Toutes'
                  : statut === 'en_attente'
                  ? 'En attente'
                  : statut === 'acceptee'
                  ? 'Acceptées'
                  : 'Rejetées'}
              </Text>
              {candidatures.filter((c) => statut === 'all' || c.statut === statut).length > 0 && (
                <View
                  style={{
                    backgroundColor:
                      selectedStatut === statut ? 'rgba(255,255,255,0.3)' : colors.primary + '20',
                    borderRadius: borderRadius.full,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 6,
                  }}
                >
                  <Text
                    style={{
                      color: selectedStatut === statut ? '#FFFFFF' : colors.primary,
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    {candidatures.filter((c) => statut === 'all' || c.statut === statut).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste candidatures */}
      {filteredCandidatures.length > 0 ? (
        <FlatList
          data={filteredCandidatures}
          renderItem={renderCandidatureCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      ) : (
        <EmptyState
          icon="account-search"
          title="Aucune candidature"
          description={
            selectedStatut === 'all'
              ? 'Les candidatures apparaîtront ici'
              : `Aucune candidature ${
                  selectedStatut === 'en_attente' ? 'en attente' : selectedStatut === 'acceptee' ? 'acceptée' : 'rejetée'
                }`
          }
          actionLabel={selectedStatut !== 'all' ? 'Voir toutes' : undefined}
          onAction={selectedStatut !== 'all' ? () => setSelectedStatut('all') : undefined}
        />
      )}
    </View>
  );
};

// Écran Profil (Client) - Avec édition
export const ProfilClientScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const { user, deconnexion } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    entreprise: user?.entreprise || '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await authAPI.mettreAJourProfil(formData);
      Toast.show({
        type: 'success',
        text1: 'Profil mis à jour',
        text2: 'Vos modifications ont été enregistrées',
      });
      setEditMode(false);
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de mettre à jour le profil',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
      entreprise: user?.entreprise || '',
    });
    setEditMode(false);
  };

  const handleDeconnexion = async () => {
    await deconnexion();
    Toast.show({
      type: 'success',
      text1: 'Déconnexion',
      text2: 'À bientôt !',
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with avatar */}
      <View
        style={{
          backgroundColor: colors.surface,
          padding: spacing.lg,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.secondary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <MaterialCommunityIcons name="briefcase" size={50} color={colors.secondary} />
        </View>
        <Text style={[styles.profilName, { color: colors.text.primary, fontSize: fontSize.xl }]}>
          {user?.prenom} {user?.nom}
        </Text>
        <Text style={{ fontSize: 14, color: colors.text.secondary, marginTop: 4 }}>Client</Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flex: 1, padding: spacing.md, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border }}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {user?.missions_publiees || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Publiées</Text>
        </View>
        <View style={{ flex: 1, padding: spacing.md, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border }}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {user?.missions_completees || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Complétées</Text>
        </View>
        <View style={{ flex: 1, padding: spacing.md, alignItems: 'center' }}>
          <Text style={[styles.statValue, { color: colors.text.primary }]}>
            {user?.prestataires_engages || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Prestataires</Text>
        </View>
      </View>

      <View style={{ padding: spacing.md }}>
        {/* Personal Info Section */}
        <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.lg }]}>
              Informations personnelles
            </Text>
            {!editMode && (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Nom */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Nom</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.nom}
                onChangeText={(text) => setFormData({ ...formData, nom: text })}
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.nom}</Text>
            )}
          </View>

          {/* Prénom */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Prénom</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.prenom}
                onChangeText={(text) => setFormData({ ...formData, prenom: text })}
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.prenom}</Text>
            )}
          </View>

          {/* Email */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Email</Text>
            <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.email}</Text>
          </View>

          {/* Téléphone */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Téléphone</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.telephone}
                onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.telephone}</Text>
            )}
          </View>

          {/* Entreprise */}
          <View>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Entreprise</Text>
            {editMode ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
                value={formData.entreprise}
                onChangeText={(text) => setFormData({ ...formData, entreprise: text })}
              />
            ) : (
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{user?.entreprise}</Text>
            )}
          </View>

          {/* Edit mode actions */}
          {editMode && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button variant="outline" onPress={handleCancel} style={{ flex: 1 }}>
                Annuler
              </Button>
              <Button variant="primary" onPress={handleSave} loading={loading} disabled={loading} style={{ flex: 1 }}>
                Sauvegarder
              </Button>
            </View>
          )}
        </Card>

        {/* Settings Section */}
        <Card elevation="sm" padding="md" style={{ marginBottom: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary, fontSize: fontSize.lg, marginBottom: 16 }]}>
            Paramètres
          </Text>

          {/* Dark mode toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.text.secondary} />
              <Text style={{ fontSize: 15, color: colors.text.primary }}>Mode sombre</Text>
            </View>
            <TouchableOpacity
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDark ? colors.primary : colors.border,
                padding: 2,
                justifyContent: 'center',
              }}
              onPress={toggleTheme}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#FFFFFF',
                  alignSelf: isDark ? 'flex-end' : 'flex-start',
                }}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Actions */}
        <Card elevation="sm" padding="md">
          <Button
            variant="outline"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Fonctionnalité à venir',
                text2: 'Changement de mot de passe',
              });
            }}
            icon="lock-reset"
            iconPosition="left"
            style={{ marginBottom: 8 }}
          >
            Changer le mot de passe
          </Button>

          <Button
            variant="outline"
            onPress={handleDeconnexion}
            icon="logout"
            iconPosition="left"
            style={{ borderColor: colors.error }}
          >
            <Text style={{ color: colors.error }}>Se déconnecter</Text>
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
};

// Écran Conversations
export const ConversationsScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadConversations = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await messageAPI.obtenirConversations();
      setConversations(response.data || []);
      setFilteredConversations(response.data || []);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les conversations',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const filtered = conversations.filter((conv) =>
        conv.nom_complet.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [search, conversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations(true);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
      onPress={() => navigation.navigate('Chat', { utilisateurId: item.utilisateur_id, nom: item.nom_complet })}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View
        style={[
          styles.conversationAvatar,
          {
            backgroundColor: colors.primary + '20',
          },
        ]}
      >
        <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: colors.text.primary }]}>{item.nom_complet}</Text>
          <Text style={[styles.conversationTime, { color: colors.text.tertiary }]}>
            {formatTimestamp(item.derniere_activite)}
          </Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text
            style={[
              styles.conversationMessage,
              {
                color: item.non_lu > 0 ? colors.text.primary : colors.text.secondary,
                fontWeight: item.non_lu > 0 ? '600' : 'normal',
              },
            ]}
            numberOfLines={1}
          >
            {item.dernier_message || 'Aucun message'}
          </Text>
          {item.non_lu > 0 && (
            <View
              style={[
                styles.unreadBadge,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Text style={styles.unreadText}>{item.non_lu > 99 ? '99+' : item.non_lu}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                padding: 12,
                backgroundColor: colors.surface,
                borderRadius: 12,
              }}
            >
              <SkeletonLoader.Circle size={48} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <SkeletonLoader.Rect width="60%" height={18} borderRadius={4} />
                <View style={{ marginTop: 8 }}>
                  <SkeletonLoader.Rect width="80%" height={14} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { padding: spacing.md, backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Rechercher une conversation..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.text.tertiary}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Conversations list */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.utilisateur_id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      ) : (
        <EmptyState
          icon={search ? 'magnify' : 'chat'}
          title={search ? 'Aucun résultat' : 'Aucune conversation'}
          description={search ? 'Essayez un autre nom' : 'Vos conversations apparaîtront ici'}
        />
      )}
    </View>
  );
};

// Écran Chat
export const ChatScreen = ({ route, navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const { utilisateurId, nom } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const pollingInterval = useRef(null);

  const loadMessages = async () => {
    try {
      const response = await messageAPI.obtenirConversation(utilisateurId);
      setMessages(response.data || []);

      // Marquer messages comme lus
      const unreadMessages = response.data?.filter(m => !m.lu && m.expediteur_id === utilisateurId) || [];
      for (const msg of unreadMessages) {
        await messageAPI.marquerCommeLu(msg.id).catch(() => {});
      }
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Polling every 5 seconds for new messages
    pollingInterval.current = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [utilisateurId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);

    try {
      await messageAPI.envoyer({
        destinataire_id: utilisateurId,
        contenu: messageText,
      });

      // Recharger immédiatement les messages
      await loadMessages();
    } catch (err) {
      console.error('Erreur envoi message:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'envoyer le message',
      });
      setMessage(messageText); // Restaurer le message en cas d'erreur
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item, index }) => {
    const isMyMessage = item.expediteur_id !== utilisateurId;
    const showAvatar = index === 0 || messages[index - 1]?.expediteur_id !== item.expediteur_id;
    const timestamp = new Date(item.date_envoi).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageRow,
          {
            justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
            marginBottom: spacing.xs,
          },
        ]}
      >
        {!isMyMessage && showAvatar && (
          <View
            style={[
              styles.messageAvatar,
              {
                backgroundColor: colors.primary + '20',
              },
            ]}
          >
            <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
          </View>
        )}
        {!isMyMessage && !showAvatar && <View style={{ width: 32 }} />}

        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMyMessage ? colors.primary : colors.surface,
              borderRadius: borderRadius.lg,
              maxWidth: '75%',
              ...elevation.xs,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isMyMessage ? '#FFFFFF' : colors.text.primary,
              },
            ]}
          >
            {item.contenu}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                {
                  color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.text.tertiary,
                },
              ]}
            >
              {timestamp}
            </Text>
            {isMyMessage && (
              <MaterialCommunityIcons
                name={item.lu ? 'check-all' : 'check'}
                size={14}
                color={item.lu ? '#4CAF50' : 'rgba(255,255,255,0.7)'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Custom header */}
        <View
          style={[
            styles.chatHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              padding: spacing.md,
            },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View
            style={[
              styles.messageAvatar,
              {
                backgroundColor: colors.primary + '20',
                marginRight: 12,
              },
            ]}
          >
            <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.chatHeaderTitle, { color: colors.text.primary }]}>{nom}</Text>
        </View>

        <View style={{ padding: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12, alignItems: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
              <SkeletonLoader.Rect width={i % 2 === 0 ? '70%' : '60%'} height={60} borderRadius={12} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View
        style={[
          styles.chatHeader,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            padding: spacing.md,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View
          style={[
            styles.messageAvatar,
            {
              backgroundColor: colors.primary + '20',
              marginRight: 12,
            },
          ]}
        >
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.chatHeaderTitle, { color: colors.text.primary }]}>{nom}</Text>
      </View>

      {/* Messages list */}
      {messages.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <MaterialCommunityIcons name="chat-outline" size={64} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary, marginTop: 16 }]}>
            Aucun message pour le moment
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
            Commencez la conversation !
          </Text>
        </View>
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            padding: spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[
            styles.messageInput,
            {
              backgroundColor: colors.background,
              color: colors.text.primary,
              borderColor: colors.border,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
            },
          ]}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim() && !sending ? colors.primary : colors.border,
              borderRadius: borderRadius.full,
              ...elevation.xs,
            },
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          <MaterialCommunityIcons
            name={sending ? 'loading' : 'send'}
            size={20}
            color={message.trim() && !sending ? '#FFFFFF' : colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Écran Profil Modal - Vue read-only autre utilisateur
export const ProfilScreen = ({ route, navigation }) => {
  const { colors, spacing, fontSize, borderRadius, elevation } = useTheme();
  const { utilisateurId } = route.params || {};
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfil = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getUtilisateur(utilisateurId);
        setProfil(response.data);
      } catch (err) {
        console.error('Erreur chargement profil:', err);
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de charger le profil',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfil();
  }, [utilisateurId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profil</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <SkeletonLoader.Circle size={100} />
          <View style={{ marginTop: 16, width: '60%' }}>
            <SkeletonLoader.Rect width="100%" height={24} borderRadius={4} />
          </View>
          <View style={{ marginTop: 8, width: '40%' }}>
            <SkeletonLoader.Rect width="100%" height={16} borderRadius={4} />
          </View>
        </View>
      </View>
    );
  }

  if (!profil) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profil</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <EmptyState icon="account-off" title="Profil introuvable" description="Ce profil n'existe pas ou a été supprimé" />
      </View>
    );
  }

  const isPrestataire = profil.role === 'prestataire';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profil</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Avatar and name */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: isPrestataire ? colors.primary + '20' : colors.secondary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons
              name={isPrestataire ? 'account' : 'briefcase'}
              size={60}
              color={isPrestataire ? colors.primary : colors.secondary}
            />
          </View>
          <Text style={[styles.profilName, { color: colors.text.primary, fontSize: fontSize.xl }]}>
            {profil.prenom} {profil.nom}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, marginTop: 4 }}>
            {isPrestataire ? 'Prestataire' : 'Client'}
          </Text>

          {/* Rating for prestataire */}
          {isPrestataire && profil.note_globale && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
              <Text style={{ fontSize: 18, color: colors.text.primary, fontWeight: '600' }}>
                {profil.note_globale.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Prestataire specific info */}
        {isPrestataire && (
          <>
            {/* Stats */}
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
              <Card elevation="sm" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {profil.missions_completees || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Missions</Text>
              </Card>
              <Card elevation="sm" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {profil.note_globale?.toFixed(1) || 'N/A'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Note</Text>
              </Card>
            </View>

            {/* Domaine */}
            {profil.domaine && (
              <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Domaine d'expertise</Text>
                <Text style={{ fontSize: 15, color: colors.text.primary, fontWeight: '500' }}>{profil.domaine}</Text>
              </Card>
            )}

            {/* Bio if available */}
            {profil.bio && (
              <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>À propos</Text>
                <Text style={{ fontSize: 14, color: colors.text.primary, lineHeight: 20 }}>{profil.bio}</Text>
              </Card>
            )}
          </>
        )}

        {/* Client specific info */}
        {!isPrestataire && (
          <>
            {/* Stats */}
            <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
              <Card elevation="sm" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {profil.missions_publiees || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Missions</Text>
              </Card>
              <Card elevation="sm" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {profil.missions_completees || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Complétées</Text>
              </Card>
            </View>

            {/* Entreprise */}
            {profil.entreprise && (
              <Card elevation="sm" padding="md" style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Entreprise</Text>
                <Text style={{ fontSize: 15, color: colors.text.primary, fontWeight: '500' }}>{profil.entreprise}</Text>
              </Card>
            )}
          </>
        )}

        {/* Contact info */}
        <Card elevation="sm" padding="md" style={{ marginBottom: 16 }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Email</Text>
            <Text style={{ fontSize: 14, color: colors.text.primary }}>{profil.email}</Text>
          </View>
          {profil.telephone && (
            <View>
              <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>Téléphone</Text>
              <Text style={{ fontSize: 14, color: colors.text.primary }}>{profil.telephone}</Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <Button
          variant="primary"
          size="lg"
          onPress={() =>
            navigation.navigate('Chat', {
              utilisateurId: profil.id,
              nom: `${profil.prenom} ${profil.nom}`,
            })
          }
          icon="message"
          iconPosition="left"
          fullWidth
        >
          Envoyer un message
        </Button>
      </ScrollView>
    </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  // DetailMissionScreen styles
  missionTitle: {
    fontWeight: 'bold',
    lineHeight: 32,
  },
  missionBudget: {
    fontWeight: 'bold',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  clientRole: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalMissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalMissionBudget: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 120,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  // CreerMissionScreen styles
  wizardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wizardSubtitle: {
    fontSize: 14,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 40,
    height: 2,
  },
  formCard: {
    // Styles dynamiques
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  competencesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  competenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  competenceText: {
    fontSize: 13,
    fontWeight: '500',
  },
  typeButton: {
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recapLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  recapValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  // ConversationsScreen styles
  searchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
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
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // ChatScreen styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // AccueilClientScreen styles
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashboardGreeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dashboardSubtitle: {
    // Dynamic styles
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  dashboardMissionCard: {
    borderLeftWidth: 4,
  },
  dashboardMissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  dashboardMissionBudget: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dashboardMissionDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  // MesMissionsScreen styles
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  missionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  missionCardBudget: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  missionCardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  // CandidaturesScreen styles
  filterChipCandidature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  candidatureName: {
    fontSize: 16,
    fontWeight: '600',
  },
  // HistoriquePrestataireScreen styles
  historiqueMissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  historiqueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ProfilPrestataireScreen & ProfilClientScreen styles
  profilName: {
    fontWeight: 'bold',
  },
});
